from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    UploadFile,
    File,
    HTTPException,
)
from fastapi.responses import StreamingResponse
from typing import Dict, List
from datetime import datetime, timezone
from database.database import db
from sentence_transformers import SentenceTransformer
import joblib
from bson import ObjectId
from chatbot.bot_brain import BotBrain
from utils.helper import detect_help_subtype, get_weather, is_help_like
from utils.extractors import (
    extract_destination,
    extract_date,
    extract_trip_style,
    extract_people_count,
    extract_activity,
)
from chatbot.gemini_handler import get_gemini_response
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
import os
from io import BytesIO
import asyncio

bucket = AsyncIOMotorGridFSBucket(db)

# Load models once
sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
clf = joblib.load("TrainedModel/sbert_intent_classifier.pkl")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def predict_intent(message: str) -> str:
    vector = sbert_model.encode([message])
    return clf.predict(vector)[0]


router = APIRouter()
active_connections: Dict[str, List[WebSocket]] = {}

# Group context reference
group_context: Dict[str, Dict] = {}

# Temporarily buffer experience messages per group/user
experience_buffer: Dict[str, Dict[str, Dict]] = {}


# Connect user to group
async def connect_user(group_id: str, websocket: WebSocket):
    await websocket.accept()
    if group_id not in active_connections:
        active_connections[group_id] = []
    active_connections[group_id].append(websocket)


# Disconnect user
def disconnect_user(group_id: str, websocket: WebSocket):
    if group_id in active_connections:
        active_connections[group_id].remove(websocket)


# Broadcast message to all users in a group
async def broadcast_message(group_id: str, message: dict):
    for connection in active_connections.get(group_id, []):
        await connection.send_json(message)


# Clean ObjectId for JSON serialization
def clean_mongo(obj):
    if isinstance(obj, dict):
        return {
            k: clean_mongo(str(v)) if isinstance(v, ObjectId) else clean_mongo(v)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [clean_mongo(i) for i in obj]
    return obj


async def flush_experience_after_silence(group_id, user_id, username, bot, timeout=35):
    await asyncio.sleep(timeout)
    group_buf = experience_buffer.get(group_id, {})
    user_buf = group_buf.get(user_id)
    if not user_buf or user_buf.get("intent") != "share_experience":
        return  # Don't flush if it's not meant to be experience

    if user_buf and user_buf["messages"]:
        combined = " ".join(user_buf["messages"])

        # Extract all destinations and activities
        destinations = extract_destination(combined)
        activities = extract_activity(combined)

        # Save to context
        await bot.record_experience(username, combined, destinations, activities)

        # Build rich response
        response = f"🙏 Thanks {username}, your tips have been saved!"
        if destinations:
            response += f" 🗺️ Related to {', '.join(f'**{d}**' for d in destinations)}."
        if activities:
            response += f" ✨ Tagged as {', '.join(f'**{a}**' for a in activities)}."

        await send_bot_message(group_id, response)

        # Reset buffer
        experience_buffer[group_id][user_id] = {
            "messages": [],
            "last_message_time": datetime.utcnow(),
        }


@router.websocket("/ws/chat/{group_id}/{user_id}")
async def chat_websocket(websocket: WebSocket, group_id: str, user_id: str):
    await connect_user(group_id, websocket)

    # Fetch username
    user = await db.users.find_one({"userID": user_id})
    username = user.get("name", "Anonymous") if user else "Anonymous"

    # Initialize bot brain
    bot = BotBrain(group_id)
    await bot.init_context()

    group = await db.groups.find_one({"Group_ID": group_id})
    greeted_users = group.get("Greeted_Users", [])

    if user_id not in greeted_users:
        summary = await bot.summarize_for_new_user(username)

        onboarding = {
            "group_id": group_id,
            "user_id": "AI_BOT",
            "username": "TripBot",
            "message": summary,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        await db.messages.insert_one(onboarding)
        await broadcast_message(
            group_id, {"type": "message", **clean_mongo(onboarding)}
        )

        # Mark user as greeted
        await db.groups.update_one(
            {"Group_ID": group_id}, {"$addToSet": {"Greeted_Users": user_id}}
        )

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")

            if event_type == "confirm_help":
                query = data.get("query", "Help with trip planning")
                help_msg = await get_gemini_response(query)
                await bot.record_bot_reply("ai_help_responded")
                await send_bot_message(group_id, help_msg)
                continue

            elif event_type == "reaction":
                message_id = data.get("message_id")
                emoji = data.get("reaction")
                user_id = data.get("user_id")
                if message_id and emoji:
                    # First, remove any previous reaction by the same user
                    await db.messages.update_one(
                        {"_id": ObjectId(message_id)},
                        {"$pull": {"reactions": {"user_id": user_id}}},
                    )

                    # Then, add the new reaction
                    await db.messages.update_one(
                        {"_id": ObjectId(message_id)},
                        {"$push": {"reactions": {"user_id": user_id, "emoji": emoji}}},
                    )

                updated_msg = await db.messages.find_one({"_id": ObjectId(message_id)})
                await broadcast_message(
                    group_id,
                    {
                        "type": "reaction",
                        "_id": message_id,
                        "reactions": await get_message_reactions(message_id),
                        **clean_mongo(updated_msg),
                    },
                )
                continue

            elif event_type == "media":
                file_id = data.get("file_id")
                media_type = data.get("media_type")

                message = {
                    "group_id": group_id,
                    "user_id": user_id,
                    "username": username,
                    "media_id": file_id,
                    "media_type": media_type,
                    "timestamp": datetime.now(timezone.utc)
                    .isoformat()
                    .replace("+00:00", "Z"),
                }
                await db.messages.insert_one(message)
                await broadcast_message(
                    group_id, {"type": "media", **clean_mongo(message)}
                )
                continue

            # chat_ws.py  (inside the while True: event loop of chat_websocket)

            elif event_type == "leave":
                # Announce to the room with a system/bot message
                leave_msg = {
                    "group_id": group_id,
                    "user_id": "AI_BOT",
                    "username": "TripBot",
                    "message": f"👋 {username} left the chat.",
                    "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                }
                await db.messages.insert_one(leave_msg)
                await broadcast_message(group_id, {"type": "message", **clean_mongo(leave_msg)})
                # Client will close the socket after sending this; server will then run WebSocketDisconnect → disconnect_user()
                continue


            message_text = data.get("message")
            if not message_text:
                continue
            
            bot.ctx["last_group_message_time"] = datetime.utcnow()
            await bot.persist_context()

            # Run intent prediction
            intent = predict_intent(message_text)
            print(f"[INTENT] {username}: \"{message_text}\" → {intent}")
            # 🔍 Override intent if it's clearly a help-related question
            if is_help_like(message_text):
                intent = "ask_help"

            # Flush pending experiences if intent changes
            if intent != "share_experience":
                group_buf = experience_buffer.get(group_id, {})
                user_buf = group_buf.get(user_id)

                if user_buf and user_buf["messages"] and user_buf.get("intent") == "share_experience":
                    time_since_last = (
                        datetime.utcnow() - user_buf["last_message_time"]
                    ).total_seconds()
                    if time_since_last <= 60:  # Allow flushing if user just finished
                        combined = " ".join(user_buf["messages"])
                        await bot.record_experience(username, combined)

                        dest = extract_destination(combined)
                        act = extract_activity(combined)

                        response = f"🙏 Thanks {username}, your tips have been saved!"
                        if dest:
                            response += f" 🗺️ Related to **{dest}**."
                        if act:
                            response += f" ✨ Tagged as **{act}**."

                        await send_bot_message(group_id, response)

                    # Clear the buffer regardless
                    experience_buffer[group_id][user_id] = {
                        "messages": [],
                        "last_message_time": datetime.utcnow(),
                    }

            bot.update_intent(intent)

            # Save user message
            message = {
                "group_id": group_id,
                "user_id": user_id,
                "username": username,
                "message": message_text,
                "intent": intent,
                "timestamp": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
            }
            await db.messages.insert_one(message)

            # Broadcast user message
            await broadcast_message(
                group_id, {"type": "message", **clean_mongo(message)}
            )

            # Handle bot logic based on intent
            if intent == "plan_trip":
                dest = extract_destination(message_text)
                date = extract_date(message_text)
                people = extract_people_count(message_text)
                style = extract_trip_style(message_text)

                # store all in plan
                plan = {
                    "destination": dest or "unknown",
                    "date": date or "unspecified",
                    "people": people or "unspecified",
                    "style": style or "unspecified",
                    "status": "draft",
                }
                bot.ctx["last_plan"] = plan
                await bot.persist_context()

                # # respond
                # if bot.can_reply():
                #     msg = f"🗺️ Planning to go to {dest or 'somewhere'}"
                #     if date:
                #         msg += f" on {date}"
                #     if style:
                #         msg += f" for a {style} trip"
                #     if people:
                #         msg += f" with {people} people"
                #     msg += ". Need help with suggestions or routes?"

                #     await bot.record_bot_reply("suggest_destinations")
                #     await send_bot_message(group_id, msg)

            elif intent == "share_experience":
                now = datetime.utcnow()
                group_buf = experience_buffer.setdefault(group_id, {})
                user_buf = group_buf.setdefault(
                    user_id, {"messages": [], "last_message_time": now, "intent": intent}
                )
                user_buf["intent"] = intent


                # Append new message and update time
                user_buf["messages"].append(message_text)
                user_buf["last_message_time"] = now

                # 🧠 Start flush timeout checker (background)
                asyncio.create_task(
                    flush_experience_after_silence(group_id, user_id, username, bot)
                )

            elif intent == "greet":
                now = datetime.utcnow()
                last_msg_time = bot.ctx.get("last_group_message_time")

                if not last_msg_time or (now - last_msg_time).total_seconds() > 60:
                    greet_msg = f"👋 Welcome, {username}! Ready to start planning your next adventure?"
                    await bot.record_bot_reply("greet")
                    await send_bot_message(group_id, greet_msg)

            elif intent == "ask_help":
                subtype = detect_help_subtype(message_text)
                print(f"[ASK_HELP] {username} asked: {message_text} | Subtype: {subtype}")

                async def delayed_help_response():
                    await asyncio.sleep(60)  # wait 60 seconds

                    # Check if someone else responded in the meantime
                    last_msg_time = bot.ctx.get("last_group_message_time")
                    last_bot_reply = bot.ctx.get("last_bot_reply_time")

                    if (
                        last_msg_time
                        and (datetime.utcnow() - last_msg_time).total_seconds() > 55
                        and (not last_bot_reply or last_bot_reply < last_msg_time)
                    ):
                        if subtype == "experience":
                            await bot.init_context()
                            keywords = extract_destination(message_text) + extract_activity(message_text)
                            found = False

                            for word in keywords:
                                exp_entry = bot.has_experience_about(word)
                                if exp_entry:
                                    await bot.record_bot_reply("show_experience")
                                    snippet = exp_entry["message"]
                                    author = exp_entry["user"]
                                    summary = f"📝 {author} shared this earlier about **{word}**:\n> {snippet}"
                                    await send_bot_message(group_id, summary)
                                    found = True
                                    break

                            if not found:
                                await send_bot_message(
                                    group_id,
                                    "🤔 No one has shared experiences about that yet. Maybe you can be the first?",
                                )

                        elif subtype == "cost_info":
                            await bot.record_bot_reply("cost_info")
                            reply = await get_gemini_response(
                                f"Answer this travel-related cost or hotel question in 3-4 sentences max:\n\n{message_text}"
                            )
                            await send_bot_message(group_id, reply)

                        elif subtype == "trip_plan":
                            await bot.record_bot_reply("trip_plan")
                            await send_bot_message(
                                group_id,
                                "🗺️ Let me connect you to the trip planning assistant! (Feature coming soon 🚧)",
                            )

                        elif subtype == "route":
                            await bot.record_bot_reply("route_help")
                            destinations = extract_destination(message_text)

                            if len(destinations) >= 2:
                                origin = destinations[0]
                                dest = destinations[1]
                                maps_url = f"https://www.google.com/maps/dir/{origin}/{dest}"
                                response = f"🗺️ Here's the route from **{origin}** to **{dest}**:\n{maps_url}"
                            elif len(destinations) == 1:
                                dest = destinations[0]
                                maps_url = f"https://www.google.com/maps/dir//{dest}"
                                response = f"🗺️ Here's the route to **{dest}** from your location (if enabled):\n{maps_url}"
                            else:
                                response = "🤔 I couldn't understand the route. Could you mention both the starting point and destination?"

                            await send_bot_message(group_id, response)

                        elif subtype == "packing":
                            await bot.record_bot_reply("packing_help")
                            prompt = f"Give travel packing advice in 3-4 sentences:\n\n{message_text}"
                            reply = await get_gemini_response(prompt)
                            await send_bot_message(group_id, reply)

                        elif subtype == "safety":
                            await bot.record_bot_reply("safety_info")
                            prompt = f"Answer this travel safety question in 3-4 clear sentences:\n\n{message_text}"
                            reply = await get_gemini_response(prompt)
                            await send_bot_message(group_id, reply)

                        elif subtype == "weather":
                            await bot.record_bot_reply("weather_info")
                            dest = extract_destination(message_text)
                            place = dest[0] if dest else "Sri Lanka"
                            weather = await get_weather(place)
                            await send_bot_message(group_id, weather)

                        elif subtype == "customs":
                            await bot.record_bot_reply("customs_info")
                            prompt = f"Explain local customs, etiquette or rules in 3-4 sentences:\n\n{message_text}"
                            reply = await get_gemini_response(prompt)
                            await send_bot_message(group_id, reply)

                        elif subtype == "language":
                            await bot.record_bot_reply("language_info")
                            prompt = f"Give language tips or common phrases for this message in 3-4 lines:\n\n{message_text}"
                            reply = await get_gemini_response(prompt)
                            await send_bot_message(group_id, reply)

                        else:
                            await bot.record_bot_reply("general_help")
                            prompt = f"Provide a helpful travel response in 3-4 concise sentences:\n\n{message_text}"
                            reply = await get_gemini_response(prompt)
                            await send_bot_message(group_id, reply)

                asyncio.create_task(delayed_help_response())

    except WebSocketDisconnect:
        disconnect_user(group_id, websocket)


async def send_bot_message(group_id: str, text: str):
    bot_response = {
        "group_id": group_id,
        "user_id": "AI_BOT",
        "username": "TripBot",
        "message": text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(bot_response)
    await broadcast_message(group_id, {"type": "message", **clean_mongo(bot_response)})

    bot = BotBrain(group_id)
    await bot.init_context()
    bot.ctx["last_bot_reply_time"] = datetime.utcnow()
    await bot.persist_context()


@router.get("/history/{group_id}")
async def get_chat_history(group_id: str, limit: int = 50):
    messages = (
        await db.messages.find({"group_id": group_id})
        .sort("timestamp", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    return clean_mongo(messages[::-1])


@router.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    stream = BytesIO(contents)
    grid_in = await bucket.upload_from_stream(file.filename, stream)
    return {"file_id": str(grid_in)}


@router.get("/file/{file_id}")
async def get_file(file_id: str):
    try:
        bucket = AsyncIOMotorGridFSBucket(db)
        file_obj = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(
            file_obj,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={file_obj.filename}"
            },
        )
    except Exception as e:
        print("Download error:", e)
        raise HTTPException(status_code=404, detail="File not found or corrupted")


@router.get("/groups/{group_id}/experiences")
async def get_experience_log(group_id: str):
    doc = await db.group_context.find_one({"group_id": group_id})
    if not doc or "experience_log" not in doc:
        return []
    return doc["experience_log"]


async def get_message_reactions(message_id: str):
    doc = await db.messages.find_one({"_id": ObjectId(message_id)}, {"reactions": 1})
    return doc.get("reactions", [])