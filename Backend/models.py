from pydantic import BaseModel
from typing import List,Optional

class ChatCreate(BaseModel):
    participants: List[str]

class Chat(BaseModel):
    chat_id: str
    participants: List[str]

class Message(BaseModel):
    sender: str
    content: str
    timestamp: Optional[str] = None

class User(BaseModel):
    email: str
    username: str
    password: str
    gender: str
    avatarUrl: str