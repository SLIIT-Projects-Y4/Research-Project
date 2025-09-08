from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ml.recommender import recommend_groups_for_user
from database.database import db

router = APIRouter(prefix="/recommend", tags=["recommendation"])

class UserProfile(BaseModel):
    Age: int
    Budget: str
    User_Interest: List[str]
    Preferred_Destination: Optional[List[str]] = None
    Travel_Style: str
    user_id: Optional[str] = None

@router.post("/")
async def recommend(user: UserProfile):
    # ✅ NEW: check if frontend provided user_id
    user_id = getattr(user, "user_id", None)  # add field in schema if you like
    rejected = []
    if user_id:
        # ✅ NEW: fetch rejected groups from users collection
        doc = await db.users.find_one({"userID": user_id}, {"Rejected_Groups": 1, "_id": 0})
        rejected = doc.get("Rejected_Groups", []) if doc else []

    # ✅ NEW: pass exclude_ids so recommender skips rejected groups
    result = await recommend_groups_for_user(
        age=user.Age,
        budget=user.Budget,
        interests=user.User_Interest,
        preferred_destinations=user.Preferred_Destination,
        travel_style=user.Travel_Style,
        exclude_ids=rejected,   # <--- this is new
    )
    return {"recommendations": result}

