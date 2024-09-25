from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
import os
from db import user_collection
from bson.objectid import ObjectId
from dotenv import load_dotenv
import bcrypt

security = HTTPBasic()

load_dotenv()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User Model
class User(BaseModel):
    email: str
    username: str
    password: str

def get_password_hash(password):
    return pwd_context.hash(password)

def hash_password(password: str) -> str:
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    # Verify a stored password against one provided by user
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def create_user(user: User):
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user.password = get_password_hash(user.password)
    new_user = await user_collection.insert_one(user.dict())
    return str(new_user.inserted_id)

async def authenticate_user(username: str, password: str):
    user = await user_collection.find_one({"username": username})
    if user and pwd_context.verify(password, user["password"]):
        return user
    raise HTTPException(status_code=401, detail="Invalid credentials")

async def get_user_by_id(user_id: str):
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    return user

async def find_users_by_usernames(username_list):
    try:
        # Query to find users with usernames in the provided list
        users = list(user_collection.find({"username": {"$in": username_list}}))
        return users
    except Exception as e:
        print("Error fetching users:", e)
        return []
    
async def find_user_by_username(username):
    try:
        # Query to find users with usernames in the provided list
        query_user={"username": username}
        includcols={"username":1,"aboutme":1,"avatarUrl":1}
        users = list(user_collection.find_one(query_user,includcols))
        return users
    except Exception as e:
        print("Error fetching users:", e)
        return []

async def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    user = await user_collection.find_one({"username": credentials.username})
    
    if user and bcrypt.checkpw(credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        return credentials.username
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Basic"},
    )