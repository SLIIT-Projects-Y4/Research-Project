from fastapi import FastAPI
from routes.group_routes import router as group
from routes.recommendation import router as recommend_router
from routes.group_creator import router as group_creator_router
from routes.chat_ws import router as chat_ws_router
from database.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()  # ✅ define app first

@app.on_event("startup")
async def startup_db_message():
    print(f"✅ Connected to MongoDB: {db.name}")

# Register routers
app.include_router(group)
app.include_router(recommend_router)
app.include_router(group_creator_router)
app.include_router(chat_ws_router)

# Allow CORS (cross-origin requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)