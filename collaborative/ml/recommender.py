import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import lightgbm as lgb
from database.database import db
from typing import List, Optional

# Load models
model = lgb.Booster(model_file="TrainedModel/trained_lgbm_ranker_semantic.txt")
budget_encoder = joblib.load("TrainedModel/budget_encoder.pkl")
style_encoder = joblib.load("TrainedModel/style_encoder.pkl")
scaler = joblib.load("TrainedModel/feature_scaler.pkl")
sbert = SentenceTransformer('all-MiniLM-L6-v2')

# Load groups from MongoDB
async def load_groups_from_db():
    groups = await db.groups.find().to_list(length=None)

    if not groups:
        print("❌ No groups found in database.")
        return pd.DataFrame()  # safe empty return

    df = pd.DataFrame(groups)
    print("✅ Loaded DataFrame columns:", df.columns.tolist())

    if 'Group_Interest' in df.columns:
        df['Group_Interest'] = df['Group_Interest'].fillna('').apply(
            lambda x: [i.strip() for i in x] if isinstance(x, list) else []
        )
    else:
        print("⚠️ 'Group_Interest' missing from DataFrame. Adding empty lists.")
        df['Group_Interest'] = [[] for _ in range(len(df))]

    if 'Destinations_Planned' in df.columns:
        df['Destinations_Planned'] = df['Destinations_Planned'].fillna('').apply(
            lambda x: [i.strip() for i in x] if isinstance(x, list) else []
        )
    else:
        print("⚠️ 'Destinations_Planned' missing. Adding empty lists.")
        df['Destinations_Planned'] = [[] for _ in range(len(df))]

    return df

# Recommender function
async def recommend_groups_for_user(age, budget, interests, preferred_destinations=None, travel_style="Unknown", exclude_ids: Optional[List[str]] = None, ):
    group_df = await load_groups_from_db()
    
    # ✅ Exclude groups (left/rejected/etc.)
    if exclude_ids:
        group_df = group_df[~group_df["Group_ID"].isin(exclude_ids)]

    # ✅ Avoid downstream errors (embeddings/model) when nothing remains
    if group_df.empty:
        return []
    
    preferred_destinations = preferred_destinations if preferred_destinations else []

    user_interest_text = ", ".join(interests)
    user_interest_emb = sbert.encode([user_interest_text])[0]

    if preferred_destinations:
        user_dest_text = ", ".join(preferred_destinations)
        user_dest_emb = sbert.encode([user_dest_text])[0]
    else:
        user_dest_emb = np.zeros(384)

    group_interest_embs = sbert.encode(group_df['Group_Interest'].apply(lambda x: ', '.join(x)).tolist())
    group_dest_embs = sbert.encode(group_df['Destinations_Planned'].apply(lambda x: ', '.join(x)).tolist())

    interest_sims = np.dot(group_interest_embs, user_interest_emb) / (
        np.linalg.norm(group_interest_embs, axis=1) * np.linalg.norm(user_interest_emb)
    )

    dest_sims = np.dot(group_dest_embs, user_dest_emb) / (
        np.linalg.norm(group_dest_embs, axis=1) * np.linalg.norm(user_dest_emb)
    ) if preferred_destinations else np.zeros(len(group_df))

    budget_encoded = budget_encoder.transform([[budget]])
    style_encoded = style_encoder.transform([[travel_style]])
    age_scaled = np.repeat(scaler.transform([[age]])[:, 0], len(group_df))
    members_scaled = scaler.transform(group_df[['Current_Members']])[:, 0]

    X_new = np.hstack([
        age_scaled.reshape(-1, 1),
        np.repeat(budget_encoded, len(group_df), axis=0),
        np.repeat(style_encoded, len(group_df), axis=0),
        interest_sims.reshape(-1, 1),
        dest_sims.reshape(-1, 1),
        members_scaled.reshape(-1, 1)
    ])

    scores = model.predict(X_new)
    group_df['Score'] = scores
    top_5 = group_df.sort_values(by='Score', ascending=False).head(5)

    return top_5[['Group_ID', 'Group_Name', 'Budget', 'Group_Interest', 'Destinations_Planned','Travel_Style', 'Current_Members', 'Score']].to_dict(orient="records")

