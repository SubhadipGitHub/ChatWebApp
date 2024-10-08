from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import socketio
from typing import List, Optional
from auth import create_admin_user, authenticate_user, hash_password, verify_password,find_user_by_username,find_user_online_status,verify_credentials
from db import chat_collection, user_collection,client
from models import Chat, Message, User,ChatCreate,UserUpdateModel
from bson.objectid import ObjectId
from datetime import datetime
from dateutil import parser  
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import PyMongoError
from io import StringIO

app = FastAPI()

# Use FastAPI's built-in HTTPBasic dependency for basic authentication
security = HTTPBasic()

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
online_user_list = []

#custom functions
def format_message(sender, time_str, content):
    # Ensure the time is formatted as dd/mm/yy hh:mm:ss
    formatted_time = time_str.strftime("%d/%m/%y %H:%M:%S")
    return f"{sender} ({formatted_time}): {content}"

# Backend initialization hook
@app.on_event("startup")
async def on_startup():
    print("FastAPI app is starting...")
    await create_admin_user()
    
@app.on_event("shutdown")
async def shutdown_event():
    print("FastAPI app is shutting down...")

# Handle socket disconnection
@sio.event
async def disconnect(sid):
    username = [user for user, session_id in online_users if session_id == sid]
    #print(online_users)
    if username:
        #print(f'{username[0]} and session id {sid}')
        online_users.remove((username[0], sid))
        online_user_list = [item[0] for item in online_users]
        #print(f'Online user list {online_user_list} when disconnection of {username[0]}')
        await sio.emit('user_offline', {'username': username[0],'online_users':online_user_list})
    #print(f"User disconnected: {sid}")

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
    
    # find online status of user
    user_online = await find_user_online_status(username)
    if(user_online == True):
        # Add the new session for the user
        online_users.add((username, sid))
        online_user_list = [item[0] for item in online_users]
        #print(f'Online user list {online_user_list} when connection of {username[0]}')
        await sio.emit('user_online', {'username': username,'online_users':online_user_list})
        
@sio.event
async def read_message(sid, data):
    chatid = data.get('chatid')
    try:
        await chat_collection.update_one({"_id":chatid},{"$set": {"unreadMessageCounter": 0}})
    except:
        print("Unread message counter update failed")
    

@sio.event
async def message(sid, data):
    print(data)
    # Get the current UTC time, set microseconds to 0, and format as ISO
    current_utc_time = datetime.utcnow().replace(microsecond=0)
    # Convert to ISO 8601 format with 'Z' (for UTC)
    iso_utc_time = current_utc_time.isoformat() + 'Z'

    chat_id = data['chat_id']
    chat_receipients = data['chatparticipants']
    #print(chat_participants)
    chat_receipients.remove(data['sender'])
    #print(receiver)
    message_data = {
        'content': data['content'],
        'sender': data['sender'],
        'receiver': chat_receipients,
        'time': iso_utc_time  # Convert to ISO string
    }
    #print(message_data)
    update_query = {"_id": chat_id}
    # Find the current chat document to check the last_updated_by field
    chat = await chat_collection.find_one(update_query)

    if chat:
        # Determine how to update the unreadMessageCounter
        if chat['last_updated_by'] == data['sender']:
            # If the sender is the same as last_updated_by, increment the unreadMessageCounter by 1
            unread_message_update = {"$inc": {"unreadMessageCounter": 1}}
        else:
            # If the sender is different, reset the unreadMessageCounter to 1
            unread_message_update = {"$set": {"unreadMessageCounter": 1}}

        # Combine the other updates with the unreadMessageCounter logic
        update_data = {
            "$set": {
                "last_updated": datetime.utcnow(),
                "last_updated_by": data['sender'],
                "latestMessage": data['content'][:50],  # Save the first 50 characters as preview
            },
            "$push": {
                "messages": message_data  # Add the new message to the messages array
            }
        }

        # Perform the update to the MongoDB document, including unreadMessageCounter changes
        await chat_collection.update_one(
            update_query,
            {**update_data, **unread_message_update}  # Merge the two update operations
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
        "online_status":"Online",
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
    

@app.get("/server_status")
async def server_status(credentials: HTTPBasicCredentials = Depends(security)):
    # Validate the credentials
    verify_credentials(credentials)
    
    # If the credentials are valid, return the server status
    db_server_status = await client.admin.command("serverStatus")
    connections = db_server_status['connections']
    user_count = await user_collection.count_documents({})
    user_online_count = len(online_user_list)
    
    data_response = {
        "user_count": user_count,
        "user_online_count": user_online_count,
        "db_connections": connections
    }
    
    return data_response

@app.delete("/drop_collections")
async def drop_collections(credentials: HTTPBasicCredentials = Depends(security)):
    # Verify Basic Auth credentials
    verify_credentials(credentials)
    try:
        # Drop users collection
        users_result = await user_collection.drop()
        
        # Drop chat collection
        chat_result = await chat_collection.drop()

        return {"message": "Users and chat collections dropped successfully"}

    except PyMongoError as e:
        # Handle any pymongo specific errors
        raise HTTPException(status_code=500, detail=f"Failed to drop collections: {str(e)}")

    except Exception as e:
        # Handle any other unexpected exceptions
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.put("/users/{user_id}", response_model=dict)
async def update_user(user_id: str, user_data: UserUpdateModel, username: str = Depends(authenticate_user)):
    print(user_data)

    # Update the user document with the new data
    update_result = await user_collection.update_one(
        {"username": user_id},
        {"$set": user_data.dict()}
    )

    if update_result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user")

    return {"message": "User updated successfully"}

@app.get("/users/{user_id}")
async def get_user(user_id: str, username: str = Depends(authenticate_user)):
    try:
        # Find user by user_id
        user = await find_user_by_username(user_id)
        if not user:
            # Raise 404 error if user is not found
            raise HTTPException(status_code=404, detail="User not found")
        
        return user  # Return the user details
    except Exception as e:
        # Catch any unexpected exceptions and return a 500 Internal Server Error
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

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
        "created_by": username, # Add the created_by field
        "last_updated":datetime.utcnow(),
        "last_updated_by": username,
        "latestMessage":None,
        "unreadMessageCounter":0
    }
    
    new_chat = await chat_collection.insert_one(chat_data)
    
    if(len(unique_chat_paticipants_list)>1):
        # Extract the receiver's username
        receiver = [user for user in unique_chat_paticipants_list if user != username][0]

        # Emit the new chat event to the receiver
        await sio.emit('new_chat', {
            "chat_id": str(new_chat.inserted_id),
            "name": chat_name,
            "image": chat_image, 
            "participants": unique_chat_paticipants_list
        })  # Emit the event only to the receiver
    
    return {"chat_id": str(new_chat.inserted_id),"name":chat_name,"participants":unique_chat_paticipants_list,"image": chat_image}

# Fetch messages for a specific chat room (endpoint example)
@app.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, skip: int = 0, limit: int = 100, username: str = Depends(authenticate_user)):
    chat = await chat_collection.find_one({"_id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = chat.get("messages", [])[skip:skip + limit]
    return {"messages": messages}

@app.get("/export-chat/{chat_id}")
async def export_chat(chat_id: str,username: str = Depends(authenticate_user)):
    try:
        # Fetch the chat messages for the given chat_id
        chat = await chat_collection.find_one({"_id": chat_id})

        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        chat_txt = StringIO()

        # Check if there are any messages
        if "messages" not in chat or len(chat["messages"]) == 0:
            # No messages found, write the default content
            chat_txt.write("No messages found\n")
        else:
            # Assuming `messages` is a list of dictionaries with 'sender', 'time', and 'content'
            for message in chat["messages"]:
                sender = message["sender"]
                try:
                    time = parser.isoparse(message["time"])  # Handle ISO 8601 timestamps
                except ValueError:
                    time = None  # Handle invalid time format

                content = message["content"]
                if time:
                    chat_txt.write(format_message(sender, time, content) + "\n")
                else:
                    chat_txt.write(f"{sender} (Unknown time): {content}\n")

        chat_txt.seek(0)  # Move to the start of the file

        # Create a streaming response with the file
        response = StreamingResponse(chat_txt, media_type="text/plain")
        response.headers["Content-Disposition"] = f"attachment; filename=chat_{chat_id}.txt"

        return response

    except Exception as e:
        # Handle any unexpected errors and return an empty file with "No messages found"
        chat_txt = StringIO()
        chat_txt.write("No messages found\n")
        chat_txt.seek(0)

        response = StreamingResponse(chat_txt, media_type="text/plain")
        response.headers["Content-Disposition"] = f"attachment; filename=chat_{chat_id}.txt"
        return response
    
@app.get("/chats", summary="Fetch chats for a user with pagination")
async def get_user_chats(
    user_id: str,
    skip: Optional[int] = Query(0, ge=0),  # Default to 0, must be >= 0
    limit: Optional[int] = Query(100, ge=1, le=100),  # Default to 100, must be between 1 and 100
    sort_field: Optional[str] = Query("last_updated"),  # Default sort field
    sort_order: Optional[str] = Query("desc"),  # Default sort order
    username: str = Depends(authenticate_user)
):
    # Determine the sorting order
    order = ASCENDING if sort_order.lower() == "asc" else DESCENDING

    # Query to find documents where the username is in the participants array
    query = {
        "participants": {
            "$in": [username]  # Use the $in operator to check if the username exists in the participants array
        }
    }
    excludcols = {"messages": 0}

    # Fetch chats with sorting
    chats = await chat_collection.find(query, excludcols)\
        .sort(sort_field, order)\
        .skip(skip)\
        .limit(limit)\
        .to_list(length=limit)

    return chats

# Entry point for running the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
