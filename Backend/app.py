from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from typing import List, Optional
from auth import create_user, authenticate_user, get_user_by_id, hash_password, verify_password
from db import chat_collection, user_collection
from models import Chat, Message, User,ChatCreate,UserUpdateModel
from bson.objectid import ObjectId
from datetime import datetime

app = FastAPI()

origins = [
    "http://localhost:3000"  # Frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#user default value
aboutme_value="I am a Dummy!!"

# Socket.IO Server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000"]  # Allow frontend origin for WebSocket
)

# Store connected users in a set or a dictionary
online_users = set()

# Handle socket disconnection
@sio.event
async def disconnect(sid):
    username = [user for user, session_id in online_users if session_id == sid]
    if username:
        online_users.remove((username[0], sid))
        await sio.emit('user_offline', {'username': username[0]})
    print(f"User disconnected: {sid}")

@sio.event
async def user_connected(sid, data):
    username = data.get('username')
    
    # Check if the user already exists in the online_users set
    for user, session_id in online_users:
        if user == username:
            # Disconnect the old session
            await sio.disconnect(session_id)
            online_users.remove((user, session_id))
            break

    # Add the new session for the user
    online_users.add((username, sid))
    await sio.emit('user_online', {'username': username})

# Join a specific chat room
@sio.event
async def join_room(sid, chat_id):
    await sio.enter_room(sid, chat_id)  # Await the coroutine
    print(f"User {sid} joined room {chat_id}")

@sio.event
async def message(sid, data):
    # Get the current UTC time, set microseconds to 0, and format as ISO
    current_utc_time = datetime.utcnow().replace(microsecond=0)
    # Convert to ISO 8601 format with 'Z' (for UTC)
    iso_utc_time = current_utc_time.isoformat() + 'Z'

    chat_id = data['chat_id']
    message_data = {
        'content': data['content'],
        'sender': data['sender'],
        'time': iso_utc_time  # Convert to ISO string
    }

    # Save message in MongoDB
    await chat_collection.update_one(
        {"_id": chat_id},
        {"$push": {"messages": message_data}}
    )

    message_data['chat_id'] = chat_id

    # Emit the message to all connected clients without using rooms
    await sio.emit("new_message", message_data)

app.mount("/socket.io/", socketio.ASGIApp(sio))

# User registration, login, and other endpoints here (omitted for brevity)

# User registration
@app.post("/register")
async def register_user(user: User):
    existing_user = await user_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = hash_password(user.password)    
    
    user_data = {
        "email": user.email,
        "online_status":"ONLINE",
        "timezone":"IST",
        "aboutme":aboutme_value,
        "username": user.username,
        "password": hashed_password,
        "gender": user.gender,
        "avatarUrl": user.avatarUrl,
        "creation_date": datetime.utcnow()
    }
    
    result = await user_collection.insert_one(user_data)
    
    return {
        "user_id": str(result.inserted_id),
        "user": user.username,
        "message": "User registered successfully",
        "status": "success"
    }

# Endpoint for login using query parameters
@app.post("/login")
async def login_user(username: str, password: str):
    user = await user_collection.find_one({"username": username})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return {"message": "User logged successfully",
             "status": "success",
               "user": 
               {"name": username,
                 "avatarUrl": user['avatarUrl'],
                 "online_status":user['online_status'],
        "timezone":user['timezone'],
        "aboutme":user['aboutme']}}

@app.put("/users/{user_id}", response_model=dict)
async def update_user(user_id: str, user_data: UserUpdateModel):

    # Update the user document with the new data
    update_result = await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": user_data.dict()}
    )

    if update_result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user")

    return {"message": "User updated successfully"}

# Create a new chat
@app.post("/chats/", response_model=dict, summary="Create a new chat")
async def create_chat(chat: ChatCreate, username: str = Depends(authenticate_user)):
    unique_chat_paticipants_list = list(set(chat.participants))
    #print(unique_chat_paticipants_list)
    chat_id = str('_'.join(unique_chat_paticipants_list))
    
    # Check if the chat with the same participants already exists
    query = {
        "participants": {
        "$all": unique_chat_paticipants_list,         # Ensure all participants are in the array
        "$size": len(unique_chat_paticipants_list)  # Ensure the length of the array matches the number of participants
    }
    }
    existing_chat = await chat_collection.find_one(query)
    if existing_chat:
        raise HTTPException(status_code=400, detail=f"Chat {existing_chat['name']} with the same participants already exists.")

    # Check if all participants exist in the user_collection
    for participant in unique_chat_paticipants_list:
        user = await user_collection.find_one({"username": participant})
        if not user:
            raise HTTPException(status_code=404, detail=f"User '{participant}' does not exist.")

    chat_name = str(' & '.join(unique_chat_paticipants_list))
    chat_image = f'https://ui-avatars.com/api/?name={chat_name}&background=random&color=fff&size=50'
    
    chat_data = {
        "_id": chat_id,
        "name": chat_name,
        "image": chat_image, 
        "participants": unique_chat_paticipants_list,
        "created_at": datetime.utcnow(),
        "created_by": username  # Add the created_by field
    }
    
    new_chat = await chat_collection.insert_one(chat_data)
    return {"chat_id": str(new_chat.inserted_id),"name":chat_name,"participants":unique_chat_paticipants_list,"image": chat_image}

# Fetch messages for a specific chat room (endpoint example)
@app.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, skip: int = 0, limit: int = 100, username: str = Depends(authenticate_user)):
    chat = await chat_collection.find_one({"_id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = chat.get("messages", [])[skip:skip + limit]
    return {"messages": messages}

# Fetch list of chats for a user with pagination
@app.get("/chats",  summary="Fetch chats for a user with pagination")
async def get_user_chats(
    user_id: str,
    skip: Optional[int] = Query(0, ge=0),  # Default to 0, must be >= 0
    limit: Optional[int] = Query(100, ge=1, le=100),  # Default to 10, must be between 1 and 100
    username: str = Depends(authenticate_user)
):
    # Query to find documents where the username is in the participants array
    query = {
        "participants": {
            "$in": [username]  # Use the $in operator to check if the username exists in the participants array
        }
    }
    excludcols={"messages":0}
    chats = await chat_collection.find(query,excludcols).skip(skip).limit(limit).to_list(length=limit)
    #print(chats)
    return chats

# Entry point for running the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
