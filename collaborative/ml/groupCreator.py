from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pandas as pd
from database.database import db
from ml.recommender import (
    sbert,
    budget_encoder,
    style_encoder,
    scaler,
    load_groups_from_db
)
from utils.group_utils import generate_group_id, generate_composite_group_name


# ➤ Match user to similar existing group using ML
async def match_user_to_group(user_data, rejected_ids=None):
    rejected_ids = rejected_ids or []
    group_df = await load_groups_from_db()

    # Exclude rejected groups
    if rejected_ids:
        group_df = group_df[~group_df["Group_ID"].isin(rejected_ids)]

    # Rename to match encoder's training columns
    if "Budget" in group_df.columns:
        group_df = group_df.rename(columns={"Budget": "Budget_x"})
    if "Travel_Style" in group_df.columns:
        group_df = group_df.rename(columns={"Travel_Style": "Travel_Style_x"})

    # Encode user data
    user_interest_emb = sbert.encode([", ".join(user_data["User_Interest"])])[0]
    user_dest_emb = (
        sbert.encode([", ".join(user_data["Preferred_Destination"])])[0]
        if user_data.get("Preferred_Destination")
        else np.zeros(384)
    )

    # Wrap input with column names to match fitted encoders
    user_budget_df = pd.DataFrame([[user_data["Budget"]]], columns=["Budget_x"])
    user_style_df = pd.DataFrame([[user_data["Travel_Style"]]], columns=["Travel_Style_x"])
    user_scale_df = pd.DataFrame([[0]], columns=["Current_Members"])

    budget_enc = budget_encoder.transform(user_budget_df)[0]
    style_enc = style_encoder.transform(user_style_df)[0]
    member_scaled = scaler.transform(user_scale_df)[0][0]

    user_vector = np.concatenate([
        user_interest_emb,
        user_dest_emb,
        [budget_enc] if np.isscalar(budget_enc) else budget_enc,
        [style_enc] if np.isscalar(style_enc) else style_enc,
        [member_scaled]
    ])

    # Encode existing groups
    group_interest_embs = sbert.encode(group_df["Group_Interest"].apply(lambda x: ", ".join(x)).tolist())
    group_dest_embs = sbert.encode(group_df["Destinations_Planned"].apply(lambda x: ", ".join(x)).tolist())
    budget_encs = budget_encoder.transform(group_df[["Budget_x"]])
    style_encs = style_encoder.transform(group_df[["Travel_Style_x"]])
    member_scaled_list = scaler.transform(group_df[["Current_Members"]])[:, 0]

    group_vectors = np.hstack([
        group_interest_embs,
        group_dest_embs,
        budget_encs,
        style_encs,
        member_scaled_list.reshape(-1, 1)
    ])

    # Similarity check
    sims = cosine_similarity([user_vector], group_vectors)[0]
    best_sim = np.max(sims)

    if best_sim >= 0.65:
        best_index = np.argmax(sims)
        matched_group = group_df.iloc[best_index].to_dict()
        return {
            "matched": True,
            "Group_ID": matched_group["Group_ID"],
            "Group_Name": matched_group["Group_Name"],
            "Score": float(best_sim),
            "Budget": matched_group["Budget_x"],
            "Group_Interest": matched_group["Group_Interest"],
            "Destinations_Planned": matched_group["Destinations_Planned"],
            "Travel_Style" : matched_group["Travel_Style_x"],
        }

    return {"matched": False}


# ➤ Create a new group
async def create_ml_based_group(user_data, _rejected_ids=None):  # keep _rejected_ids for API consistency
    # Check if the user has already created a group
    existing = await db.groups.find_one({"Created_By": user_data["user_id"]})
    if existing:
        return {"error": "User has already created a group."}

    group_name = await generate_composite_group_name(user_data)
    group_id = await generate_group_id()

    group = {
        "Group_ID": group_id,
        "Group_Name": group_name,
        "Budget": user_data["Budget"],
        "Travel_Style": user_data["Travel_Style"],
        "Destinations_Planned": user_data.get("Preferred_Destination", []),
        "Group_Interest": user_data["User_Interest"],
        "Current_Members": 0,
        "Status": "Inactive",
        "Created_By": user_data["user_id"]
    }

    await db.groups.insert_one(group)

    return {
        "message": "✅ New group created",
        "Group_ID": group_id,
        "Group_Name": group_name,
    }
