from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

# Pydantic Schemas
class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime
    roles: List[str]

    class Config:
        from_attributes = True

class ProfileResponse(BaseModel):
    id: uuid.UUID
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    disability_category: Optional[str] = None
    isl_level: str
    badges: List[str]
    interests: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    disability_category: Optional[str] = None
    isl_level: Optional[str] = None
    interests: Optional[List[str]] = None

@router.get("/me", response_model=UserMeResponse)
def get_current_user_account(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get the authenticated user's account details and capabilities.
    """
    # Flatten the roles list of models to list of strings
    roles = [ur.role for ur in current_user.roles]
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "roles": roles
    }

@router.get("/profile", response_model=ProfileResponse)
def get_user_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the public/private profile of the authenticated user.
    """
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/profile", response_model=ProfileResponse)
def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile fields for the authenticated user.
    """
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if profile_data.display_name is not None:
        profile.display_name = profile_data.display_name
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.gender is not None:
        profile.gender = profile_data.gender
    if profile_data.dob is not None:
        profile.dob = profile_data.dob
    if profile_data.state is not None:
        profile.state = profile_data.state
    if profile_data.city is not None:
        profile.city = profile_data.city
    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.disability_category is not None:
        profile.disability_category = profile_data.disability_category
    if profile_data.isl_level is not None:
        profile.isl_level = profile_data.isl_level
    if profile_data.interests is not None:
        profile.interests = profile_data.interests

    db.commit()
    db.refresh(profile)
    return profile
