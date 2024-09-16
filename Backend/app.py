from fastapi import FastAPI, Depends, HTTPException, status
from models import UserModel, ChatModel
from auth import authenticate_user
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Request/Response Models
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

# Request Models
class MessageRequest(BaseModel):
    chat_id: str = None  # Optional: chat_id will be checked, or a new one created
    receiver_id: str     # Receiver's username
    content: str

class MessageResponse(BaseModel):
    sender: str
    content: str

# Registration Route
@app.post("/register")
def register_user(request: RegisterRequest):
    # Step 1: Check if the username already exists (now checking the _id field)
    existing_username = UserModel.get_user_by_id(request.username)
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    # Step 2: Check if the email already exists
    existing_email = UserModel.get_user_by_email(request.email)
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    # Step 3: Create the user with username stored in the _id field
    UserModel.create_user(user_id=request.username, email=request.email, password=request.password)
    
    return {"msg": "User registered successfully", "user_id": request.username}

# Send Message Route (Authenticated)
@app.post("/send_message")
def send_message(request: MessageRequest, username: str = Depends(authenticate_user)):
    # Step 1: Check if receiver_id exists (receiver_id refers to the _id of the user)
    receiver = UserModel.get_user_by_id(request.receiver_id)
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")

    # Step 2: Check if chat_id was provided
    if request.chat_id:
        chat = ChatModel.get_chat(request.chat_id)
        if chat is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
        # Ensure both participants are part of the chat
        if username not in chat["participants"] or request.receiver_id not in chat["participants"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this chat")
    else:
        # Step 3: No chat_id provided, check if a chat exists between the two users
        existing_chat = ChatModel.collection.find_one({
            "participants": {"$all": [username, request.receiver_id]}
        })
        
        if existing_chat:
            chat = existing_chat
        else:
            # Step 4: Create new chat if none exists
            new_chat = {
                "participants": [username, request.receiver_id],
                "messages": []
            }
            chat_id = ChatModel.collection.insert_one(new_chat).inserted_id
            chat = ChatModel.get_chat(str(chat_id))

    # Step 5: Add message to the chat
    ChatModel.add_message(str(chat["_id"]), sender=username, content=request.content)
    return {"msg": "Message sent"}


# Retrieve Messages Route (Authenticated)
@app.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_messages(chat_id: str, username: str = Depends(authenticate_user)):
    chat = ChatModel.get_chat(chat_id)
    if chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    if username not in chat["participants"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this chat")
    
    return chat["messages"]

# FastAPI root route
@app.get("/")
def read_root():
    return {"msg": "Welcome to the FastAPI chat app!"}
