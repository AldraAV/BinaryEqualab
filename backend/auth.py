"""
Binary EquaLab - Supabase Auth Service

Handles user authentication via Supabase JWT tokens.
"""
import os
from typing import Optional
from functools import lru_cache

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client
import jwt
from dotenv import load_dotenv

load_dotenv()

# Supabase client
@lru_cache()
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
    return create_client(url, key)

# Security scheme
security = HTTPBearer(auto_error=False)

# JWT Secret (from Supabase project settings)
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

class User(BaseModel):
    id: str
    email: str
    role: Optional[str] = "authenticated"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class AuthRequest(BaseModel):
    email: str
    password: str

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Dependency to get current user from JWT token.
    Returns None if no valid token (allows unauthenticated access).
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        
        # Verify with Supabase Auth Server (More robust than local secret)
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        u = user_response.user
        return User(
            id=u.id,
            email=u.email or "",
            role=u.role or "authenticated"
        )

    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency that requires valid authentication.
    Raises 401 if not authenticated.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )
    return user
