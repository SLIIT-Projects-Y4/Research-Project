# utils/group_utils.py

from database.database import db

async def generate_group_id():
    last_group = await db.groups.find_one({}, sort=[("Group_ID", -1)])
    if last_group and "Group_ID" in last_group:
        last_id_num = int(last_group["Group_ID"][1:])
        new_id_num = last_id_num + 1
    else:
        new_id_num = 1
    return f"G{new_id_num:04d}"

async def generate_composite_group_name(user_data):
    interest = user_data["User_Interest"][0].strip().title()
    style = user_data["Travel_Style"].strip().title()
    budget = user_data["Budget"].strip().title()

    destination = (
        user_data["Preferred_Destination"][0].strip().title()
        if user_data.get("Preferred_Destination") and len(user_data["Preferred_Destination"]) > 0
        else None
    )

    if destination:
        base_name = f"{interest} {style} {budget} in {destination}"
    else:
        base_name = f"{interest} {style} {budget} Explorers"

    similar_groups = await db.groups.find(
        {"Group_Name": {"$regex": f"^{base_name}( \\d+)?$", "$options": "i"}}
    ).to_list(length=None)

    if not similar_groups:
        return base_name

    existing_names = [g["Group_Name"] for g in similar_groups]
    count = 2
    while f"{base_name} {count}" in existing_names:
        count += 1

    return f"{base_name} {count}"