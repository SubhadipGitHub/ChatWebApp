from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from auth import create_user, authenticate_user,get_user_by_id, hash_password, verify_password,authenticate_user
from db import chat_collection,user_collection
from models import Chat, Message, User
from bson.objectid import ObjectId
from datetime import datetime

app = FastAPI()

# Allowing CORS for specific origins (for your frontend on localhost:3000)
origins = [
    "http://localhost:3000",
    # You can add more origins here if needed
]

# Add the CORSMiddleware to allow requests from specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow requests from the frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers (Authorization, Content-Type, etc.)
)

# User registration
@app.post("/register")
async def register_user(user: User):
    existing_user = await user_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = hash_password(user.password)
    user_data = {
        "email": user.email,
        "username": user.username,
        "password": hashed_password
    }
    result = await user_collection.insert_one(user_data)
    return {"user_id": str(result.inserted_id), "message": "User registered successfully"}

# Endpoint for login using query parameters
@app.post("/login")
async def login_user(username: str, password: str):
    # Fetch user from the MongoDB collection
    user = await user_collection.find_one({"username": username})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Verify password using bcrypt
    if not verify_password(password, user['password']):  # Assuming user['password'] is hashed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return {"message": "User logged successfully"}

@app.post("/chats/")
async def create_chat(participants: List[str], username: str = Depends(authenticate_user)):
    chat_data = {"participants": participants, "created_at": datetime.utcnow()}
    new_chat = await chat_collection.insert_one(chat_data)
    return {"chat_id": str(new_chat.inserted_id)}

# Send a message in a chat
@app.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, message: Message):
    chat = await chat_collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    message_data = message.dict()
    message_data["timestamp"] = datetime.utcnow()

    await chat_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$push": {"messages": message_data}}
    )
    return {"message": "Message sent"}

# Fetch messages from a chat (with pagination)
@app.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, skip: int = 0, limit: int = 10):
    chat = await chat_collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = chat.get("messages", [])[skip:skip + limit]
    return {"messages": messages}

# Fetch list of chats for a user
@app.get("/chats")
async def get_user_chats(user_id: str):
    chats = await chat_collection.find({"participants": user_id})
    print(chats)
    return {"chats": chats}
