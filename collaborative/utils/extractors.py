import re
from typing import Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import pandas as pd

# Load destination and activity lists
df = pd.read_csv("dataset/All_Cleaned_Destinations_and_Activities.csv")  # Adjust path as needed
DESTINATIONS = df["Destination"].dropna().unique().tolist()
ACTIVITIES = df["Activity"].dropna().unique().tolist()

# Load SBERT
sbert = SentenceTransformer("all-MiniLM-L6-v2")
DEST_EMBS = sbert.encode(DESTINATIONS)
ACT_EMBS = sbert.encode(ACTIVITIES)

# Keywords to interpret time-related phrases
DATE_KEYWORDS = {
    "this weekend": (datetime.today() + timedelta(days=5)).strftime("%Y-%m-%d"),
    "next weekend": (datetime.today() + timedelta(days=12)).strftime("%Y-%m-%d"),
    "next month": (datetime.today() + timedelta(days=30)).strftime("%Y-%m-%d")
}

def match_semantic(text: str, items: list[str], embeddings: np.ndarray, threshold: float = 0.55) -> str | None:
    user_vec = sbert.encode([text])[0]
    sims = cosine_similarity([user_vec], embeddings)[0]
    best_idx = int(np.argmax(sims))
    return items[best_idx] if sims[best_idx] >= threshold else None

def extract_destination(text: str) -> list[str]:
    text_lower = text.lower()
    exact_matches = [place for place in DESTINATIONS if place.lower() in text_lower]

    if exact_matches:
        return list(set(exact_matches))

    vec = sbert.encode([text])[0]
    sims = cosine_similarity([vec], DEST_EMBS)[0]
    best_idx = int(np.argmax(sims))
    if sims[best_idx] >= 0.65:
        return [DESTINATIONS[best_idx]]
    
    return []

def extract_activity(text: str) -> list[str]:
    text_lower = text.lower()
    exact_matches = [act for act in ACTIVITIES if act.lower() in text_lower]

    if exact_matches:
        return list(set(exact_matches))

    vec = sbert.encode([text])[0]
    sims = cosine_similarity([vec], ACT_EMBS)[0]
    best_idx = int(np.argmax(sims))
    if sims[best_idx] >= 0.65:
        return [ACTIVITIES[best_idx]]
    
    return []

def extract_date(text: str) -> Optional[str]:
    for phrase, date in DATE_KEYWORDS.items():
        if phrase in text.lower():
            return date

    match = re.search(r'(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)', text)
    if match:
        return match.group(1)

    return None

def extract_people_count(text: str) -> Optional[int]:
    match = re.search(r'(\d+)\s*(people|persons|friends|members)', text.lower())
    if match:
        return int(match.group(1))
    return None

def extract_trip_style(text: str) -> Optional[str]:
    styles = ["adventure", "relaxing", "cultural", "beach", "hiking", "wildlife", "budget", "luxury"]
    for style in styles:
        if style in text.lower():
            return style
    return None
