# routes/translate.py
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from database.database import db
import os

from deep_translator import (
    GoogleTranslator,
    LibreTranslator,
    MyMemoryTranslator,
)

router = APIRouter(prefix="/translate", tags=["translate"])

# Optional: point to your self-hosted LibreTranslate (recommended)
# docker run -it -p 5000:5000 libretranslate/libretranslate
LIBRE_BASE_URL = os.getenv("LIBRE_BASE_URL", "http://localhost:5000")

# Languages you want to expose (adjust freely)
SUPPORTED = {"ta", "si", "hi", "fr", "de", "es", "it", "zh", "ja", "en"}

@router.get("/{message_id}")
async def translate_message(message_id: str, target_lang: str = Query("ta")):
    """
    Translate message text from (auto-detected) source -> target_lang using DeepTranslator.
    Priority: LibreTranslate (if available) -> GoogleTranslator (unofficial) -> MyMemory.
    target_lang is ISO code like 'ta', 'si', 'fr', ...
    """
    # Validate ObjectId
    try:
        oid = ObjectId(message_id)
    except Exception:
        raise HTTPException(400, "Invalid message id")

    # Fetch message text
    doc = await db.messages.find_one({"_id": oid}, {"message": 1})
    if not doc or not doc.get("message"):
        raise HTTPException(404, "Message not found or has no text")
    text = doc["message"]

    target = target_lang.lower()
    if target not in SUPPORTED:
        raise HTTPException(400, f"Unsupported language code: {target}")

    # Try LibreTranslate (self-hosted) first to avoid rate limits
    # If the server isn't up, this will raise and we fallback automatically
    try:
        # LibreTranslate supports 'auto' source detection
        lt = LibreTranslator(source="auto", target=target, base_url=LIBRE_BASE_URL)
        translated = lt.translate(text)
        if translated and translated.strip():
            return {"translated": translated.strip(), "target_lang": target}
    except Exception:
        pass  # fallback

    # Fallback 2: GoogleTranslator (unofficial)
    try:
        gt = GoogleTranslator(source="auto", target=target)
        translated = gt.translate(text)
        if translated and translated.strip():
            return {"translated": translated.strip(), "target_lang": target}
    except Exception:
        pass  # fallback

    # Fallback 3: MyMemory (may return partial/less accurate results)
    try:
        mm = MyMemoryTranslator(source="auto", target=target)
        translated = mm.translate(text)
        if translated and translated.strip():
            return {"translated": translated.strip(), "target_lang": target}
    except Exception as e:
        raise HTTPException(500, f"Translation failed: {e}")

    # If all failed
    raise HTTPException(502, "All translation providers failed")
