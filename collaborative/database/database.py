import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "test_db")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in environment variables")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
