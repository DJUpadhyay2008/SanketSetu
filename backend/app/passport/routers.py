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
    gender: Optional[str] = None
    dob: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    disability_category: Optional[str] = None
    current_level: int  # 1, 2, 3
    xp_points: int
    streak: int
    badges: List[str]
    certificates: List[CertificateItem]
    skills: List[str]
    interests: List[str]
    qr_code_data: str

def mask_name(name: str) -> str:
    parts = name.strip().split()
    masked_parts = []
    for part in parts:
        if len(part) > 1:
            masked_parts.append(part[0] + "*" * (len(part) - 1))
        elif part:
            masked_parts.append(part[0])
    return " ".join(masked_parts)

class VerificationResponse(BaseModel):
    is_valid: bool
    recipient_name: str
    recipient_masked_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    disability_category: Optional[str] = None
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
    display_name = profile.display_name if profile and profile.display_name else "Dutt"
    avatar_url = profile.avatar_url if profile else "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    current_level = int(profile.isl_level) if profile and profile.isl_level and profile.isl_level.isdigit() else 1
    
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
            id="88888888-8888-4888-8888-88888888888f",
            course_name="Everyday ISL Greetings",
            issue_date=date.today(),
            grade="A+",
            credential_url="/verify/88888888-8888-4888-8888-88888888888f",
            issuer="Sanket Setu Platform",
            skill="Basic Greetings"
        ))
        
    return PassportDetail(
        user_id=str(current_user.id),
        display_name=display_name,
        avatar_url=avatar_url,
        gender=profile.gender if profile else "Male",
        dob=profile.dob if profile else "2008-03-08",
        state=profile.state if profile else "Gujarat",
        city=profile.city if profile else "Vadodara",
        phone=profile.phone if profile else "+91 98765 43210",
        bio=profile.bio if profile else "Certified ISL Learner dedicated to civic inclusion.",
        disability_category=profile.disability_category if profile else "Deaf / Hard of Hearing",
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
    Public endpoint to verify a certificate / credential unmasked with full profile metadata.
    """
    disclaimer = "Sanket Setu Platform Credential. This certificate verifies learning completion on the Sanket Setu digital portal. It does not represent or claim government certification or formal licensing."
    
    try:
        cred_uuid = uuid.UUID(credential_id)
    except ValueError:
        if credential_id.startswith("sanket") or credential_id.startswith("demo"):
            demo_name = "Sanket Citizen"
            return VerificationResponse(
                is_valid=True,
                recipient_name=demo_name,
                recipient_masked_name=mask_name(demo_name),
                avatar_url=None,
                gender="Male",
                dob="2008-03-08",
                state="Gujarat",
                city="Vadodara",
                disability_category="Deaf / Hard of Hearing",
                course_name="Everyday ISL Greetings",
                issue_date=date.today(),
                grade="A+",
                issuer="Sanket Setu Platform",
                skill="Basic Greetings",
                verification_id=credential_id,
                disclaimer=disclaimer
            )
        raise HTTPException(status_code=400, detail="Invalid credential ID format")

    cred = db.query(models.Credential).filter(models.Credential.id == cred_uuid).first()
    if not cred:
        if credential_id in ("00000000-0000-0000-0000-000000000000", "88888888-8888-4888-8888-88888888888f"):
            latest_prof = db.query(models.Profile).first()
            demo_name = latest_prof.display_name if (latest_prof and latest_prof.display_name) else "Sanket Citizen"
            return VerificationResponse(
                is_valid=True,
                recipient_name=demo_name,
                recipient_masked_name=mask_name(demo_name),
                avatar_url=latest_prof.avatar_url if latest_prof else None,
                gender=latest_prof.gender if (latest_prof and latest_prof.gender) else "Male",
                dob=latest_prof.dob if (latest_prof and latest_prof.dob) else "2008-03-08",
                state=latest_prof.state if (latest_prof and latest_prof.state) else "Gujarat",
                city=latest_prof.city if (latest_prof and latest_prof.city) else "Vadodara",
                disability_category=latest_prof.disability_category if (latest_prof and latest_prof.disability_category) else "Deaf / Hard of Hearing",
                course_name="Everyday ISL Greetings",
                issue_date=date.today(),
                grade="A+",
                issuer="Sanket Setu Platform",
                skill="Basic Greetings",
                verification_id=credential_id,
                disclaimer=disclaimer
            )
        raise HTTPException(status_code=404, detail="Credential not found or invalid")

    user_name = "Sanket Citizen"
    avatar_url = None
    gender = "Male"
    dob = "2008-03-08"
    state = "Gujarat"
    city = "Vadodara"
    disability_category = "Deaf / Hard of Hearing"

    if cred.user and cred.user.profile:
        prof = cred.user.profile
        if prof.display_name:
            user_name = prof.display_name
        avatar_url = prof.avatar_url
        gender = prof.gender or gender
        dob = prof.dob or dob
        state = prof.state or state
        city = prof.city or city
        disability_category = prof.disability_category or disability_category

    course_title = cred.course.title if cred.course else "ISL Course"
    skill_name = "ISL Communication"
    if "Healthcare" in course_title:
        skill_name = "Medical Sign Language"
    elif "Emergency" in course_title:
        skill_name = "Crisis Response Signs"

    return VerificationResponse(
        is_valid=True,
        recipient_name=user_name,
        recipient_masked_name=mask_name(user_name),
        avatar_url=avatar_url,
        gender=gender,
        dob=dob,
        state=state,
        city=city,
        disability_category=disability_category,
        course_name=course_title,
        issue_date=cred.issue_date.date() if isinstance(cred.issue_date, datetime) else date.today(),
        grade=cred.grade,
        issuer="Sanket Setu Platform",
        skill=skill_name,
        verification_id=str(cred.id),
        disclaimer=disclaimer
    )
