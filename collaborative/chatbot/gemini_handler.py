import os
import httpx

# Replace this with your actual Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or "your-gemini-api-key"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY
}

async def get_gemini_response(query: str) -> str:
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"You are a helpful travel assistant. Answer this: {query}"}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, headers=headers, json=payload)
            result = response.json()

        return result["candidates"][0]["content"]["parts"][0]["text"]

    except Exception as e:
        return "❌ Sorry, I couldn't get help from TripBot right now. Please try again later."
