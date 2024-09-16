from pymongo import MongoClient
from bson.objectid import ObjectId
from passlib.context import CryptContext
import datetime
import json

# Load the MongoDB URI from secret.json
def load_mongodb_uri():
    with open('secret.json', 'r') as file:
        secrets = json.load(file)
        return secrets["MONGODB_URI"]
    
# Get the MongoDB URI from the secrets file
MONGODB_URI = load_mongodb_uri()

# MongoDB connection
client = MongoClient(MONGODB_URI)
db = client.chat_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserModel:
    collection = db.users

    @staticmethod
    def get_user_by_id(user_id: str):
        # Check MongoDB for a user with the provided _id (username)
        return UserModel.collection.find_one({"_id": user_id})

    @staticmethod
    def get_user_by_email(email: str):
        # Check MongoDB for a user with the provided email
        return UserModel.collection.find_one({"email": email})

    @staticmethod
    def create_user(user_id: str, email: str, password: str):
        # Hash the password before storing it in the database
        hashed_password = pwd_context.hash(password)
        # Insert user into MongoDB with _id as the username        
        new_user = {
            "_id": user_id,  # Using _id to store the username
            "email": email,
            "password": hashed_password  # Store the hashed password
        }
        UserModel.collection.insert_one(new_user)

class ChatModel:
    @staticmethod
    def get_chat(chat_id: str):
        # Retrieve the chat by _id
        return ChatModel.collection.find_one({"_id": chat_id})

    @staticmethod
    def add_message(chat_id: str, sender: str, content: str):
        # Add the message to the chat
        message = {
            "sender": sender,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        ChatModel.collection.update_one(
            {"_id": chat_id},
            {"$push": {"messages": message}}
        )

