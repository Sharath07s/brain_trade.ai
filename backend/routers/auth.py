import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database.supabase_client import supabase

router = APIRouter()

# In a real app this should be in .env and loaded via os.getenv()
# Hardcoding a secure random string here for hackathon convenience
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-braintrade-key-321-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days

class UserCredentials(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=Token)
async def register(user: UserCredentials):
    try:
        # SANDBOX BYPASS
        if "mock.supabase.co" in os.getenv("SUPABASE_URL", ""):
            access_token = create_access_token({"sub": user.email, "id": "mock_id_123"}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
            return {"access_token": access_token, "token_type": "bearer", "user": {"id": "mock_id_123", "email": user.email}}

        res = supabase.auth.sign_up({"email": user.email, "password": user.password})
        if not res.user:
            raise HTTPException(status_code=400, detail="Registration failed.")
            
        access_token = create_access_token({"sub": res.user.email, "id": res.user.id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": res.user.id, "email": res.user.email}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(user: UserCredentials):
    try:
        # SANDBOX BYPASS
        if "mock.supabase.co" in os.getenv("SUPABASE_URL", ""):
            access_token = create_access_token({"sub": user.email, "id": "mock_id_123"}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
            return {"access_token": access_token, "token_type": "bearer", "user": {"id": "mock_id_123", "email": user.email}}

        res = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        access_token = create_access_token({"sub": res.user.email, "id": res.user.id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": res.user.id, "email": res.user.email}}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")
