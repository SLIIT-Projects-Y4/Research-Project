from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ml.recommender import recommend_groups_for_user

router = APIRouter(prefix="/recommend", tags=["recommendation"])

class UserProfile(BaseModel):
    Age: int
    Budget: str
    User_Interest: List[str]
    Preferred_Destination: Optional[List[str]] = None
    Travel_Style: str

@router.post("/")
async def recommend(user: UserProfile):
    result = await recommend_groups_for_user(
        age=user.Age,
        budget=user.Budget,
        interests=user.User_Interest,
        preferred_destinations=user.Preferred_Destination,
        travel_style=user.Travel_Style
    )
    return {"recommendations": result}

