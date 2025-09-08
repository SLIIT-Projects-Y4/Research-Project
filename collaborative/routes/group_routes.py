from fastapi import APIRouter, HTTPException
from models.groupModel import GroupCreate
from database.database import db
from ml.groupCreator import (create_ml_based_group)
from utils.group_utils import (generate_group_id)

router = APIRouter(prefix="/groups", tags=["groups"])

# @router.post("/createGroup")
# async def create_group(group: GroupCreate):
#     group_id = await generate_group_id()
#     group_data = group.dict()
#     group_data["Group_ID"] = group_id
#     group_data["Members"] = []  # Track list of user_ids who joined
#     result = await db.groups.insert_one(group_data)
#     return {"message": "Group created", "Group_ID": group_id}

@router.post("/join/{group_id}/{user_id}")
async def join_group(group_id: str, user_id: str):
    group = await db.groups.find_one({"Group_ID": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if "Members" not in group:
        group["Members"] = []

    if user_id in group["Members"]:
        raise HTTPException(status_code=400, detail="User already in the group")

    updated_members = group.get("Current_Members", 0) + 1
    new_status = "Active" if updated_members >= 2 else group.get("Status", "Inactive")
    group["Members"].append(user_id)

    await db.groups.update_one(
        {"Group_ID": group_id},
        {"$set": {
            "Current_Members": updated_members,
            "Status": new_status,
            "Members": group["Members"]
        }}
    )

    return {
        "message": f"User {user_id} joined group {group_id}",
        "Current_Members": updated_members,
        "Status": new_status
    }

@router.get("/details/{group_id}")
async def get_group_details(group_id: str):
    group = await db.groups.find_one({"Group_ID": group_id}, {"_id": 0})  # exclude _id
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.get("/joined/{user_id}")
async def get_joined_groups(user_id: str):
    user_groups = await db.groups.find(
        {"Members": {"$in": [user_id]}},
        {"_id": 0}
    ).to_list(length=100)
    return user_groups

@router.post("/createByML")
async def create_by_ml(payload: dict):
    user_data = payload["user_data"]
    rejected_ids = payload.get("rejected_ids", [])
    return await create_ml_based_group(user_data, rejected_ids)

#leave chat group
@router.post("/leave/{group_id}/{user_id}")
async def leave_group(group_id: str, user_id: str):
    group = await db.groups.find_one({"Group_ID": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    members = group.get("Members", [])
    if user_id not in members:
        raise HTTPException(status_code=400, detail="User not in the group")

    # Remove user and update counters
    members.remove(user_id)
    new_count = max(0, group.get("Current_Members", 0) - 1)
    new_status = "Active" if new_count >= 2 else "Inactive"

    await db.groups.update_one(
        {"Group_ID": group_id},
        {"$set": {
            "Members": members,
            "Current_Members": new_count,
            "Status": new_status
        }}
    )

    await db.users.update_one(
        {"userID": user_id},
        {"$addToSet": {"Rejected_Groups": group_id}},
        upsert=True
    )

    return {
        "message": f"User {user_id} left group {group_id}",
        "Current_Members": new_count,
        "Status": new_status
    }


