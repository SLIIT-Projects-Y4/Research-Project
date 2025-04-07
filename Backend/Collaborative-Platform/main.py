from fastapi import FastAPI
from routes.recommendation import router as recommend_router
from database.database import db
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

@app.on_event("startup")
async def startup_db_message():
    print(f"✅ Connected to MongoDB: {db.name}")

app.include_router(recommend_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


