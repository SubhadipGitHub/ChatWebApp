from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from passlib.context import CryptContext
from models import UserModel, ChatModel

# Security configuration
security = HTTPBasic()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Assume UserModel is already imported
# Ensure UserModel has get_user_by_username to retrieve user by username.

def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    user = UserModel.get_user_by_id(credentials.username)  # Use get_user_by_username
    if user is None or not pwd_context.verify(credentials.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return user['_id']  # Return user ID (instead of username), to match your new logic
