from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ml.groupCreator import match_user_to_group
from database.database import db

router = APIRouter(prefix="/groups", tags=["groups"])

# 🧾 Pydantic schemas
class UserInput(BaseModel):
    Age: int
    Budget: str
    User_Interest: List[str]
    Preferred_Destination: Optional[List[str]] = None
    Travel_Style: str
    user_id: Optional[str] = None

class GroupRequest(BaseModel):
    user_data: UserInput
    rejected_ids: Optional[List[str]] = []

# 🔍 Route to recommend an existing group using ML
@router.post("/recommandNewGroup")
async def recommend_group(request: GroupRequest):
    # ✅ NEW: merge client-side rejected_ids with server-side Rejected_Groups
    rejected_ids = set(request.rejected_ids or [])

    # ✅ NEW: also check the user’s stored rejected groups
    user_id = getattr(request.user_data, "user_id", None)
    if user_id:
        user_doc = await db.users.find_one({"userID": user_id}, {"Rejected_Groups": 1, "_id": 0})
        if user_doc and user_doc.get("Rejected_Groups"):
            rejected_ids.update(user_doc["Rejected_Groups"])

    # ✅ Pass merged list to ML matcher
    result = await match_user_to_group(
        user_data=request.user_data.dict(),
        rejected_ids=list(rejected_ids)
    )

    if result.get("matched"):
        return {
            "recommendations": [  # wrap in list to unify format
                {
                    "Group_ID": result["Group_ID"],
                    "Group_Name": result["Group_Name"],
                    "Score": result["Score"],
                    "Budget": result["Budget"],
                    "Travel_Style": result["Travel_Style"],
                    "Group_Interest": result["Group_Interest"],
                    "Destinations_Planned": result["Destinations_Planned"],
                }
            ]
        }

    return {"recommendations": []}

