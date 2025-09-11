import httpx
import os
from dotenv import load_dotenv
load_dotenv()
import re

API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

def detect_help_subtype(message: str) -> str:
    msg = message.lower()

    if any(k in msg for k in [
        "been to", "visited", "experience with", "has anyone been", "tips about", 
        "what was your experience", "anyone been", "reviews of", "how was"
    ]):
        return "experience"

    if any(k in msg for k in [
        "cost", "price", "budget", "how much", "hotel", "stay", "accommodation",
        "rates", "entry fee", "ticket price", "expense", "cheap", "expensive"
    ]):
        return "cost_info"

    if any(k in msg for k in [
        "plan a trip", "itinerary", "how to plan", "schedule", "organize", "arrange", 
        "trip idea", "planning for", "prepare a trip", "suggest a plan"
    ]):
        return "trip_plan"

    if any(k in msg for k in [
        "route", "how to get", "how do i reach", "directions", "transport", 
        "travel route", "bus to", "train to", "flight to", "commute", "way to"
    ]):
        return "route"

    if any(k in msg for k in [
        "pack", "carry", "prepare", "bring", "what should i take", 
        "packing list", "essential items", "things to take", "what to wear"
    ]):
        return "packing"

    if any(k in msg for k in [
        "safe", "dangerous", "risk", "security", "is it safe", "safety", 
        "precaution", "crime", "warning", "alert"
    ]):
        return "safety"

    if "weather" in msg or any(k in msg for k in [
        "temperature", "climate", "raining", "rainy", "sunny", "forecast"
    ]):
        return "weather"

    if any(k in msg for k in [
        "custom", "tradition", "culture", "dress code", "rules", 
        "etiquette", "norms", "social behavior", "dos and don'ts"
    ]):
        return "customs"

    if any(k in msg for k in [
        "language", "speak", "how to say", "translate", "communication", 
        "local language", "common phrases", "understand locals"
    ]):
        return "language"

    return "generic"

async def get_weather(place: str) -> str:
    url = f"http://api.openweathermap.org/data/2.5/weather?q={place}&appid={API_KEY}&units=metric"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            data = response.json()

        if "weather" in data:
            weather_main = data["weather"][0]["main"]
            description = data["weather"][0]["description"]
            temp = data["main"]["temp"]
            return f"🌤️ Weather in {place.title()}: {weather_main} ({description}), {temp}°C."
        else:
            return f"❌ Couldn't fetch weather info for **{place.title()}**."

    except Exception as e:
        return "⚠️ Error retrieving weather info. Please try again later."

def is_help_like(message: str) -> bool:
    patterns = [
        r"\b(has|have)\s+anyone\b",           # has anyone / have anyone
        r"\banyone\s+visited\b",              # anyone visited
        r"\bbeen\s+to\b",                     # been to
        r"\bany\s+tips\b",                    # any tips
        r"\blooking\s+for\s+tips\b",          # looking for tips
        r"\bsuggestions\s+for\b",             # suggestions for
        r"\brecommendations\s+for\b",         # recommendations for
        r"\bexperience\s+with\b",             # experience with
        r"\bvisited\b",                       # visited (loose match)
    ]
    text = message.lower()
    return any(re.search(p, text) for p in patterns)


