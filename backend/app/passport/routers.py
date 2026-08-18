import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database import models
from app.auth.dependencies import get_current_user
from app.learning.gamification import calculate_user_total_xp

router = APIRouter(prefix="/passport", tags=["Sanket Passport"])

# Schemas
class CertificateItem(BaseModel):
    id: str
    course_name: str
    issue_date: date
    grade: str
    credential_url: str
    issuer: str
    skill: str

class PassportDetail(BaseModel):
    user_id: str
    display_name: str
    avatar_url: Optional[str]
    current_level: int  # 1, 2, 3
    xp_points: int
    streak: int
    badges: List[str]
    certificates: List[CertificateItem]
    skills: List[str]
    interests: List[str]
    qr_code_data: str

class VerificationResponse(BaseModel):
    is_valid: bool
    recipient_masked_name: str
    course_name: str
    issue_date: date
    grade: str
    issuer: str
    skill: str
    verification_id: str
    disclaimer: str

@router.get("/", response_model=PassportDetail)
async def get_my_passport(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve the current authenticated user's digital ISL Passport.
    """
    profile = current_user.profile
    display_name = profile.display_name if profile and profile.display_name else "Sanket Citizen"
    avatar_url = profile.avatar_url if profile else "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    current_level = int(profile.isl_level) if profile and profile.isl_level.isdigit() else 1
    
    # Calculate real XP from completed lessons
    xp_points = calculate_user_total_xp(current_user.id, db)
    if xp_points == 0:
        # Give some baseline XP for demo purposes if they haven't completed any lessons yet
        xp_points = 250
        
    # Get user badges from profile
    badges = list(profile.badges or []) if profile else []
    if not badges:
        badges = ["Quick Starter", "First Greeting"]

    # Interests from profile
    interests = list(profile.interests or []) if profile else []
    if not interests:
        interests = ["Healthcare ISL", "Civic Services", "Daily Vocabulary"]

    # Skills computed based on courses
    skills = ["Everyday Greetings", "Emergency Reporting"]

    # Fetch real credentials from db
    certificates = []
    credentials = db.query(models.Credential).filter(models.Credential.user_id == current_user.id).all()
    
    for cred in credentials:
        course_title = cred.course.title if cred.course else "ISL Course"
        skill_name = "ISL Communication"
        if "Healthcare" in course_title:
            skill_name = "Medical Sign Language"
        elif "Emergency" in course_title:
            skill_name = "Crisis Response Signs"
            
        certificates.append(CertificateItem(
            id=str(cred.id),
            course_name=course_title,
            issue_date=cred.issue_date.date() if isinstance(cred.issue_date, datetime) else date.today(),
            grade=cred.grade,
            credential_url=f"/verify/{cred.id}",
            issuer="Sanket Setu Platform",
            skill=skill_name
        ))

    # Add a mock certificate if they have none for demo/sandbox purposes
    if not certificates:
        certificates.append(CertificateItem(
            id="00000000-0000-0000-0000-000000000000",
            course_name="Everyday ISL Greetings",
            issue_date=date.today(),
            grade="A+",
            credential_url="/verify/00000000-0000-0000-0000-000000000000",
            issuer="Sanket Setu Platform",
            skill="Basic Greetings"
        ))
        
    return PassportDetail(
        user_id=str(current_user.id),
        display_name=display_name,
        avatar_url=avatar_url,
        current_level=current_level,
        xp_points=xp_points,
        streak=5,  # Demo 5 days streak
        badges=badges,
        certificates=certificates,
        skills=skills,
        interests=interests,
        qr_code_data=f"sanket-passport-v1-{current_user.id}"
    )

@router.get("/verify/{credential_id}", response_model=VerificationResponse)
async def verify_credential_public(
    credential_id: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to verify a certificate / credential without exposing private user data.
    """
    disclaimer = "Sanket Setu Platform Credential. This certificate verifies learning completion on the Sanket Setu digital portal. It does not represent or claim government certification or formal licensing."
    
    # Check for demo credential ID
    if credential_id == "00000000-0000-0000-0000-000000000000":
        return VerificationResponse(
            is_valid=True,
            recipient_masked_name="S***** C******",
            course_name="Everyday ISL Greetings",
            issue_date=date.today(),
            grade="A+",
            issuer="Sanket Setu Platform",
            skill="Basic Greetings",
            verification_id="00000000-0000-0000-0000-000000000000",
            disclaimer=disclaimer
        )

    try:
        cred_uuid = uuid.UUID(credential_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid credential ID format")

    cred = db.query(models.Credential).filter(models.Credential.id == cred_uuid).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found or invalid")

    # Mask user's display name for privacy
    user_name = "Sanket Citizen"
    if cred.user and cred.user.profile and cred.user.profile.display_name:
        user_name = cred.user.profile.display_name
        
    # Mask name: keep first letter of each word, replace others with *
    parts = user_name.split(" ")
    masked_parts = []
    for part in parts:
        if len(part) > 1:
            masked_parts.append(part[0] + "*" * (len(part) - 1))
        else:
            masked_parts.append(part)
    masked_name = " ".join(masked_parts)

    course_title = cred.course.title if cred.course else "ISL Course"
    skill_name = "ISL Communication"
    if "Healthcare" in course_title:
        skill_name = "Medical Sign Language"
    elif "Emergency" in course_title:
        skill_name = "Crisis Response Signs"

    return VerificationResponse(
        is_valid=True,
        recipient_masked_name=masked_name,
        course_name=course_title,
        issue_date=cred.issue_date.date() if isinstance(cred.issue_date, datetime) else date.today(),
        grade=cred.grade,
        issuer="Sanket Setu Platform",
        skill=skill_name,
        verification_id=str(cred.id),
        disclaimer=disclaimer
    )
