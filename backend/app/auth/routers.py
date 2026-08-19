from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """
    Register a new user in the system using email and password.
    TODO: Integrate with Supabase Auth and save custom user profile in users table.
    """
    # Placeholder return
    return {"access_token": "mock_register_token", "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Log in a user using email and password.
    TODO: Verify with Supabase Auth.
    """
    # Placeholder return
    return {"access_token": "mock_login_token", "token_type": "bearer"}

@router.post("/logout")
async def logout():
    """
    Logs out the user (revokes current session).
    TODO: Invalidate tokens/sessions in Supabase.
    """
    return {"message": "Successfully logged out"}
