# routes/moderation.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from database.database import db

router = APIRouter(prefix="/messages", tags=["moderation"])

REPORT_THRESHOLD = 3

class ReportBody(BaseModel):
    reporter_id: str
    group_id: str
    category: Optional[str] = None
    note: Optional[str] = None

@router.post("/{message_id}/report")
async def report_message(message_id: str, body: ReportBody):
    # 1) Load message (cast id)
    try:
        msg_oid = ObjectId(message_id)
    except Exception:
        raise HTTPException(400, "Invalid message id")

    msg = await db.messages.find_one(
        {"_id": msg_oid},
        {"_id": 1, "user_id": 1, "group_id": 1}
    )
    if not msg:
        raise HTTPException(404, "Message not found")

    author_id = msg["user_id"]
    if author_id == body.reporter_id:
        raise HTTPException(400, "You cannot report your own message")

    # 2) Reporter must be a current member
    group = await db.groups.find_one(
        {"Group_ID": body.group_id},
        {"Members": 1, "Current_Members": 1, "Status": 1}
    )
    if not group or body.reporter_id not in group.get("Members", []):
        raise HTTPException(403, "Only current group members can report")

    # 3) Unique report (atomic): only add & increment if reporter not already present
    added = await db.messages.update_one(
        {"_id": msg_oid, "reporters": {"$ne": body.reporter_id}},
        {
            "$addToSet": {"reporters": body.reporter_id},
            "$push": {"reports_log": {
                "user_id": body.reporter_id,
                "at": datetime.utcnow(),
                "category": body.category,
                "note": body.note
            }},
            "$inc": {"report_count": 1}
        }
    )
    if added.modified_count == 0:
        return {"ok": True, "status": "already_reported"}

    # 4) Threshold logic
    updated = await db.messages.find_one({"_id": msg_oid}, {"report_count": 1})
    count = int(updated.get("report_count", 0))
    if count < REPORT_THRESHOLD:
        return {"ok": True, "status": "recorded", "report_count": count}

    # 5) Warn or auto-remove
    upg = await db.users_per_group.find_one(
        {"group_id": body.group_id, "user_id": author_id},
        {"warnings": 1}
    )
    warnings = (upg or {}).get("warnings", 0)

    if warnings == 0:
        await db.users_per_group.update_one(
            {"group_id": body.group_id, "user_id": author_id},
            {"$set": {"warnings": 1, "warned_at": datetime.utcnow()}},
            upsert=True
        )
        return {"ok": True, "status": "warned_author"}

    # 6) Auto-remove author (mirror your leave flow)
    members = [m for m in group.get("Members", []) if m != author_id]
    new_count = max(0, int(group.get("Current_Members", 0)) - 1)
    new_status = "Active" if new_count >= 2 else "Inactive"

    await db.groups.update_one(
        {"Group_ID": body.group_id},
        {"$set": {"Members": members, "Current_Members": new_count, "Status": new_status}}
    )
    await db.users.update_one(
        {"userID": author_id},
        {"$addToSet": {"Rejected_Groups": body.group_id}},
        upsert=True
    )
    await db.users_per_group.update_one(
        {"group_id": body.group_id, "user_id": author_id},
        {"$set": {"last_auto_action": datetime.utcnow()}},
        upsert=True
    )

    return {
        "ok": True,
        "status": "auto_removed",
        "current_members": new_count,
        "new_status": new_status
    }
