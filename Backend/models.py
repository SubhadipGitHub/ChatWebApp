from pydantic import BaseModel, Field
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

# User Model update
class UserUpdateModel(BaseModel):
    online_status: str = Field(..., example="Online")
    aboutme: str = Field(..., example="This is my updated about me section.")
    timezone: str = Field(..., example="GMT")

    class Config:
        schema_extra = {
            "example": {
                "online_status": "Online",
                "about_me": "Updated about me section.",
                "timezone": "PST",
            }
        }