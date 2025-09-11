from datetime import datetime, timedelta
from typing import Dict, Optional
from database.database import db
from utils.extractors import extract_destination, extract_activity

# Shared group_context from main chat system
group_context: Dict[str, Dict] = {}

class BotBrain:
    def __init__(self, group_id: str):
        self.group_id = group_id
        self.ctx = None  # will be set in init_context

    async def init_context(self):
        if self.group_id in group_context:
            self.ctx = group_context[self.group_id]
        else:
            doc = await db.group_context.find_one({"group_id": self.group_id})
            if doc:
                group_context[self.group_id] = doc
            else:
                group_context[self.group_id] = {
                    "last_bot_prompt": None,
                    "last_bot_reply_time": None,
                    "last_user_intents": [],
                    "last_plan": {},
                    "experience_log": [],
                    "last_group_message_time": None 
                }
            self.ctx = group_context[self.group_id]

    def update_intent(self, intent: str):
        self.ctx["last_user_intents"].append(intent)
        if len(self.ctx["last_user_intents"]) > 10:
            self.ctx["last_user_intents"] = self.ctx["last_user_intents"][1:]

    def can_reply(self, cooldown_minutes: int = 2) -> bool:
        last_reply = self.ctx.get("last_bot_reply_time")
        if not last_reply:
            return True
        return datetime.utcnow() - last_reply > timedelta(minutes=cooldown_minutes)

    async def record_bot_reply(self, prompt: Optional[str] = None):
        self.ctx["last_bot_reply_time"] = datetime.utcnow()
        if prompt:
            self.ctx["last_bot_prompt"] = prompt
        await self.persist_context()

    async def record_plan(self, destination: Optional[str], date: Optional[str]):
        self.ctx["last_plan"] = {
            "destination": destination or "unknown",
            "date": date or "undecided",
            "status": "draft",
        }
        await self.persist_context()

    async def record_experience(self, username: str, message: str, destinations=None, activities=None):
        print("🔥 Saving experience to context:", {"user": username, "message": message})

        self.ctx["experience_log"].append(
            {
                "user": username,
                "message": message,
                "destinations": destinations or [],
                "activities": activities or [],
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        self.ctx["last_experience_time"] = datetime.utcnow()
        self.ctx["last_experience_message"] = message

        if len(self.ctx["experience_log"]) > 10:
            self.ctx["experience_log"] = self.ctx["experience_log"][1:]

        await self.persist_context()

    async def summarize_for_new_user(self, username: Optional[str] = None) -> str:
        from chatbot.gemini_handler import (
            get_gemini_response,
        )  # import here to avoid circular import

        greeting = f"Hi {username}! " if username else "👋 Welcome! "
        header = (
            "This group is planning a trip. Here’s what they’ve discussed so far:\n"
        )

        # Fetch last 20 messages from DB
        messages = (
            await db.messages.find({"group_id": self.group_id})
            .sort("timestamp", -1)
            .limit(20)
            .to_list(length=20)
        )
        messages = list(reversed(messages))  # most recent last

        # Format for Gemini or fallback
        if messages:
            text_snippets = [
                f"{msg['username']}: {msg['message']}"
                for msg in messages
                if msg.get("message")
            ]
            prompt = (
                "You are TripBot. Summarize this group chat in **3 short sentences**. "
                "Include only the trip destination, date if mentioned, and 1-2 helpful travel tips. "
                "Avoid repeating greetings, disclaimers, or unnecessary explanations.\n\n"
                + "\n".join(text_snippets)
            )

            summary = await get_gemini_response(prompt)
            return f"{greeting}{header}{summary}"
        else:
            return f"{greeting}No one has shared anything yet. Why not get the conversation started? 🚀"

    def has_experience_about(self, keyword: str) -> Optional[dict]:
        keyword_lower = keyword.lower()

        for entry in self.ctx.get("experience_log", []):
            if any(keyword_lower in d.lower() for d in entry.get("destinations", [])):
                return entry  # Return full experience entry
            if any(keyword_lower in a.lower() for a in entry.get("activities", [])):
                return entry
            if keyword_lower in entry.get("message", "").lower():
                return entry

        return None


    async def persist_context(self):
        await db.group_context.update_one(
            {"group_id": self.group_id}, {"$set": self.ctx}, upsert=True
        )

