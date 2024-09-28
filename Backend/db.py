from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URI")
# Assume these environment variables are set for the admin details
ADMIN_USER = os.getenv('ADMIN_USER', 'admin')
ADMIN_PASS = os.getenv('ADMIN_PASS', 'password123')
ADMIN_GENDER = os.getenv('ADMIN_GENDER', 'male')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')


client = AsyncIOMotorClient(MONGO_DETAILS)
db = client['chatdb']
user_collection = db['users']
chat_collection = db['chats']