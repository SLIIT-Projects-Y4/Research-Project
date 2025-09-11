# routes/polls.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, constr
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from database.database import db

router = APIRouter(prefix="/polls", tags=["polls"])

# --------- Models ---------
class CreatePollBody(BaseModel):
    group_id: constr(strip_whitespace=True, min_length=1) # type: ignore
    created_by: constr(strip_whitespace=True, min_length=1) # type: ignore # user_id
    question: constr(strip_whitespace=True, min_length=3, max_length=200) # type: ignore
    options: list[constr(strip_whitespace=True, min_length=1, max_length=100)] # type: ignore
    duration_minutes: int | None = Field(default=0, ge=0)  # 0 = no auto close

class VoteBody(BaseModel):
    user_id: constr(strip_whitespace=True, min_length=1) # type: ignore
    option_id: str  # we’ll generate per-option ids

# --------- Helpers ---------
def oid(x: str) -> ObjectId:
    try:
        return ObjectId(x)
    except Exception:
        raise HTTPException(400, "Invalid id")

# --------- Routes ---------
@router.post("/", status_code=201)
async def create_poll(body: CreatePollBody):
    if len(body.options) < 2:
        raise HTTPException(400, "Provide at least 2 options")

    # Ensure creator is a member (simple check)
    group = await db.groups.find_one({"Group_ID": body.group_id}, {"Members": 1})
    if not group or body.created_by not in group.get("Members", []):
        raise HTTPException(403, "Only group members can create polls")

    now = datetime.now(timezone.utc)
    closes_at = (
        now + timedelta(minutes=body.duration_minutes)
        if body.duration_minutes and body.duration_minutes > 0
        else None
    )

    # Build poll doc
    options = [
        {
            "id": str(ObjectId()),  # option_id to refer when voting
            "text": opt,
            "votes": 0,
        }
        for opt in body.options
    ]
    poll_doc = {
        "group_id": body.group_id,
        "created_by": body.created_by,
        "question": body.question,
        "options": options,
        "voters": {},  # user_id -> option_id (single choice)
        "status": "open",
        "created_at": now,
        "closes_at": closes_at,
    }

    res = await db.polls.insert_one(poll_doc)
    poll_doc["_id"] = str(res.inserted_id)
    return poll_doc

@router.get("/{group_id}")
async def list_polls(group_id: str, include_closed: bool = False):
    query = {"group_id": group_id}
    if not include_closed:
        query["status"] = "open"
    polls = await db.polls.find(query).sort("created_at", -1).to_list(length=100)
    # Convert ObjectIds for client
    for p in polls:
        p["_id"] = str(p["_id"])
    return polls

@router.post("/{poll_id}/vote")
async def vote_poll(poll_id: str, body: VoteBody):
    p_id = oid(poll_id)
    poll = await db.polls.find_one({"_id": p_id})
    if not poll:
        raise HTTPException(404, "Poll not found")
    if poll.get("status") != "open":
        raise HTTPException(400, "Poll is closed")

    # Optional: enforce member-only voting
    group = await db.groups.find_one({"Group_ID": poll["group_id"]}, {"Members": 1})
    if not group or body.user_id not in group.get("Members", []):
        raise HTTPException(403, "Only current group members can vote")

    # Auto-close if time passed
    if poll.get("closes_at") and datetime.now(timezone.utc) > poll["closes_at"]:
        await db.polls.update_one({"_id": p_id}, {"$set": {"status": "closed"}})
        raise HTTPException(400, "Poll is closed")

    # Prevent multiple votes (single choice)
    if body.user_id in poll.get("voters", {}):
        raise HTTPException(400, "You have already voted in this poll")

    # Validate option
    options: List[Dict] = poll["options"]
    idx = next((i for i, o in enumerate(options) if o["id"] == body.option_id), -1)
    if idx == -1:
        raise HTTPException(400, "Invalid option")

    # Atomically record vote
    options[idx]["votes"] += 1
    poll["voters"][body.user_id] = body.option_id

    await db.polls.update_one(
        {"_id": p_id},
        {"$set": {"options": options, "voters": poll["voters"]}},
    )

    # Return updated poll (normalized)
    poll = await db.polls.find_one({"_id": p_id})
    poll["_id"] = str(poll["_id"])
    return poll

@router.post("/{poll_id}/close")
async def close_poll(poll_id: str, user_id: str):
    # Local import to avoid circular imports
    from .chat_ws import broadcast_message, clean_mongo

    p_id = oid(poll_id)
    poll = await db.polls.find_one({"_id": p_id})
    if not poll:
        raise HTTPException(404, "Poll not found")

    # Only the creator can close
    if poll["created_by"] != user_id:
        raise HTTPException(403, "Only the creator can close this poll")

    # Mark as closed if not already
    if poll.get("status") != "closed":
        await db.polls.update_one({"_id": p_id}, {"$set": {"status": "closed"}})
        poll = await db.polls.find_one({"_id": p_id})

    # ---- Build results summary ----
    options = sorted(poll["options"], key=lambda o: o.get("votes", 0), reverse=True)
    total = sum(o.get("votes", 0) for o in options) or 0

    lines = [f"📊 Poll closed: {poll['question']}"]
    for o in options:
        votes = o.get("votes", 0)
        pct = int(round((votes / total) * 100)) if total else 0
        lines.append(f"- {o['text']} — {votes} vote(s) • {pct}%")
    summary = "\n".join(lines)

    # Insert a TripBot/system message
    result_msg = {
        "group_id": poll["group_id"],
        "user_id": "AI_BOT",
        "username": "TripBot",
        "message": summary,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    await db.messages.insert_one(result_msg)

    # Broadcast so it appears instantly in everyone’s chat
    await broadcast_message(poll["group_id"], {"type": "message", **clean_mongo(result_msg)})

    return {"ok": True, "status": "closed", "notified": True}
