from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
import jwt
import base64
from datetime import datetime, timedelta

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
client = MongoClient('mongodb://localhost:27017/')
db = client['chat_db']
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

# Utility functions
def encrypt_message(public_key_pem: bytes, message: str) -> bytes:
    public_key = serialization.load_pem_public_key(public_key_pem)
    encrypted_message = public_key.encrypt(
        message.encode(),
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    return encrypted_message

def decrypt_message(private_key_pem: bytes, encrypted_message: bytes) -> str:
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    decrypted_message = private_key.decrypt(
        encrypted_message,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    )
    return decrypted_message.decode()

def create_jwt_token(user_id: str):
    expires_delta = timedelta(hours=1)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"exp": expire, "sub": user_id}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.PyJWTError:
        return None

class RegisterUser(BaseModel):
    user_id: str
    public_key: str
    private_key: str

class Login(BaseModel):
    user_id: str
    password: str

class SendMessage(BaseModel):
    sender_id: str
    receiver_id: str
    message: str

class MessageResponse(BaseModel):
    sender_id: str
    message: str

@app.post('/register')
async def register_user(user: RegisterUser):
    db.users.update_one(
        {'user_id': user.user_id},
        {'$set': {'public_key': user.public_key, 'private_key': user.private_key}},
        upsert=True
    )
    return {'status': 'success'}

@app.post('/token')
async def login(user: Login):
    # Validate user credentials here
    token = create_jwt_token(user.user_id)
    return {"access_token": token, "token_type": "bearer"}

@app.post('/send_message')
async def send_message(message: SendMessage, token: str = Depends(oauth2_scheme)):
    user_id = verify_jwt_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    receiver = db.users.find_one({'user_id': message.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    public_key_pem = receiver['public_key'].encode()
    encrypted_message = encrypt_message(public_key_pem, message.message)
    
    db.messages.insert_one({
        'sender_id': message.sender_id,
        'receiver_id': message.receiver_id,
        'message': base64.b64encode(encrypted_message).decode()
    })
    
    return {'status': 'success'}

@app.get('/get_messages/{user_id}', response_model=List[MessageResponse])
async def get_messages(user_id: str, token: str = Depends(oauth2_scheme)):
    user_id_from_token = verify_jwt_token(token)
    if not user_id_from_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    messages = db.messages.find({'receiver_id': user_id})
    user = db.users.find_one({'user_id': user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    decrypted_messages = []
    for msg in messages:
        encrypted_message = base64.b64decode(msg['message'])
        decrypted_message = decrypt_message(user['private_key'].encode(), encrypted_message)
        decrypted_messages.append({
            'sender_id': msg['sender_id'],
            'message': decrypted_message
        })
    
    return decrypted_messages

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Handle WebSocket messages here
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print(f"Client {user_id} disconnected")
