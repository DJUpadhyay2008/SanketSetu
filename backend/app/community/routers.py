import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.database import models
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/community", tags=["Sanket Community & Mentorship"])

# Schemas
class PublicProfile(BaseModel):
    user_id: str
    display_name: str
    avatar_url: Optional[str]
    isl_level: int
    badges: List[str]
    interests: List[str]

    class Config:
        from_attributes = True

class MentorDetail(BaseModel):
    id: str
    user_id: str
    display_name: str
    avatar_url: Optional[str]
    isl_level: int
    badges: List[str]
    interests: List[str]
    certification_details: Optional[str]
    rating: float
    is_verified: bool
    assessment_score: int
    reviews_count: int

    class Config:
        from_attributes = True

class PracticeRequestCreate(BaseModel):
    receiver_id: Optional[str] = None
    mentor_id: Optional[str] = None
    service_type: str  # practice, medical_emergency, legal, education, general
    description: str
    location: str
    scheduled_time: datetime

class PracticeRequestResponse(BaseModel):
    id: str
    user_id: str
    sender_name: str
    sender_avatar: Optional[str]
    receiver_id: Optional[str]
    mentor_id: Optional[str]
    service_type: str
    description: str
    location: str
    scheduled_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RespondRequest(BaseModel):
    action: str  # accept, decline

class ReportCreate(BaseModel):
    reported_user_id: Optional[str] = None
    content_type: str  # user, post, comment
    content_id: Optional[str] = None
    reason: str

# Endpoints
@router.get("/partners", response_model=List[PublicProfile])
async def get_practice_partners(
    level: Optional[int] = None,
    interest: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get matching practice partners based on level and interests.
    Only exposes public profile fields. Never exposes PII or exact location.
    """
    query = db.query(models.Profile).filter(models.Profile.id != current_user.id)
    
    if level is not None:
        query = query.filter(models.Profile.isl_level == str(level))
    
    profiles = query.all()
    
    # Filter by interest in python if provided
    if interest:
        interest_lower = interest.lower()
        profiles = [
            p for p in profiles 
            if any(interest_lower in str(i).lower() for i in p.interests)
        ]
        
    result = []
    for p in profiles:
        result.append(PublicProfile(
            user_id=str(p.id),
            display_name=p.display_name or "Sanket Citizen",
            avatar_url=p.avatar_url,
            isl_level=int(p.isl_level) if p.isl_level.isdigit() else 1,
            badges=p.badges or [],
            interests=p.interests or []
        ))
    return result

@router.get("/mentors", response_model=List[MentorDetail])
async def get_mentors(
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve list of active mentors with their certification details,
    ratings, and verified status.
    """
    query = db.query(models.Mentor).filter(models.Mentor.is_active == True)
    if is_verified is not None:
        query = query.filter(models.Mentor.is_verified == is_verified)
        
    mentors = query.all()
    result = []
    for m in mentors:
        user_profile = db.query(models.Profile).filter(models.Profile.id == m.user_id).first()
        if not user_profile:
            continue
            
        result.append(MentorDetail(
            id=str(m.id),
            user_id=str(m.user_id),
            display_name=user_profile.display_name or "Sanket Mentor",
            avatar_url=user_profile.avatar_url,
            isl_level=int(user_profile.isl_level) if user_profile.isl_level.isdigit() else 3,
            badges=user_profile.badges or [],
            interests=user_profile.interests or [],
            certification_details=m.certification_details,
            rating=m.rating,
            is_verified=m.is_verified,
            assessment_score=m.assessment_score,
            reviews_count=m.reviews_count
        ))
    return result

@router.get("/mentors/{mentor_id}", response_model=MentorDetail)
async def get_mentor_by_id(
    mentor_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed profile of a specific mentor.
    """
    m = db.query(models.Mentor).filter(models.Mentor.id == uuid.UUID(mentor_id)).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentor not found")
        
    user_profile = db.query(models.Profile).filter(models.Profile.id == m.user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
        
    return MentorDetail(
        id=str(m.id),
        user_id=str(m.user_id),
        display_name=user_profile.display_name or "Sanket Mentor",
        avatar_url=user_profile.avatar_url,
        isl_level=int(user_profile.isl_level) if user_profile.isl_level.isdigit() else 3,
        badges=user_profile.badges or [],
        interests=user_profile.interests or [],
        certification_details=m.certification_details,
        rating=m.rating,
        is_verified=m.is_verified,
        assessment_score=m.assessment_score,
        reviews_count=m.reviews_count
    )

@router.post("/requests", response_model=PracticeRequestResponse)
async def create_practice_request(
    payload: PracticeRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Send a practice matching or service assistance request.
    Truncates precise locations to broad cities to protect user privacy.
    """
    if not payload.receiver_id and not payload.mentor_id:
        raise HTTPException(status_code=400, detail="Must provide either receiver_id (partner) or mentor_id")
        
    # Truncate location details (broad location filter)
    location_parts = [p.strip() for p in payload.location.split(",") if p.strip()]
    broad_location = location_parts[-1] if location_parts else "Gujarat"
    if len(location_parts) > 1:
        # Use city + state if available
        broad_location = f"{location_parts[-2]}, {location_parts[-1]}"

    receiver_uuid = uuid.UUID(payload.receiver_id) if payload.receiver_id else None
    mentor_uuid = uuid.UUID(payload.mentor_id) if payload.mentor_id else None

    req = models.PracticeRequest(
        user_id=current_user.id,
        receiver_id=receiver_uuid,
        mentor_id=mentor_uuid,
        service_type=payload.service_type,
        description=payload.description,
        location=broad_location,
        scheduled_time=payload.scheduled_time,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Trigger a database notification to the receiver/mentor
    target_user_id = receiver_uuid
    if mentor_uuid:
        m = db.query(models.Mentor).filter(models.Mentor.id == mentor_uuid).first()
        if m:
            target_user_id = m.user_id

    if target_user_id:
        sender_name = current_user.profile.display_name if current_user.profile else "Sanket Learner"
        notif = models.Notification(
            user_id=target_user_id,
            title="New Practice Request",
            message=f"{sender_name} has requested an ISL practice session: '{payload.description[:60]}...'",
            is_read=False
        )
        db.add(notif)
        db.commit()

    sender_profile = current_user.profile
    return PracticeRequestResponse(
        id=str(req.id),
        user_id=str(req.user_id),
        sender_name=sender_profile.display_name if sender_profile else "Sanket Learner",
        sender_avatar=sender_profile.avatar_url if sender_profile else None,
        receiver_id=str(req.receiver_id) if req.receiver_id else None,
        mentor_id=str(req.mentor_id) if req.mentor_id else None,
        service_type=req.service_type,
        description=req.description,
        location=req.location,
        scheduled_time=req.scheduled_time,
        status=req.status,
        created_at=req.created_at
    )

@router.get("/requests/incoming", response_model=List[PracticeRequestResponse])
async def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all incoming requests for the current user (either as a peer partner or mentor).
    """
    # Fetch user's mentor record if exists
    mentor = db.query(models.Mentor).filter(models.Mentor.user_id == current_user.id).first()
    
    query = db.query(models.PracticeRequest)
    
    if mentor:
        query = query.filter(
            or_(
                models.PracticeRequest.receiver_id == current_user.id,
                models.PracticeRequest.mentor_id == mentor.id
            )
        )
    else:
        query = query.filter(models.PracticeRequest.receiver_id == current_user.id)
        
    requests = query.all()
    result = []
    for req in requests:
        sender = db.query(models.Profile).filter(models.Profile.id == req.user_id).first()
        result.append(PracticeRequestResponse(
            id=str(req.id),
            user_id=str(req.user_id),
            sender_name=sender.display_name if sender else "Sanket Learner",
            sender_avatar=sender.avatar_url if sender else None,
            receiver_id=str(req.receiver_id) if req.receiver_id else None,
            mentor_id=str(req.mentor_id) if req.mentor_id else None,
            service_type=req.service_type,
            description=req.description,
            location=req.location,
            scheduled_time=req.scheduled_time,
            status=req.status,
            created_at=req.created_at
        ))
    return result

@router.get("/requests/outgoing", response_model=List[PracticeRequestResponse])
async def get_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get requests sent out by the current user.
    """
    requests = db.query(models.PracticeRequest).filter(models.PracticeRequest.user_id == current_user.id).all()
    result = []
    for req in requests:
        sender = db.query(models.Profile).filter(models.Profile.id == req.user_id).first()
        result.append(PracticeRequestResponse(
            id=str(req.id),
            user_id=str(req.user_id),
            sender_name=sender.display_name if sender else "Sanket Learner",
            sender_avatar=sender.avatar_url if sender else None,
            receiver_id=str(req.receiver_id) if req.receiver_id else None,
            mentor_id=str(req.mentor_id) if req.mentor_id else None,
            service_type=req.service_type,
            description=req.description,
            location=req.location,
            scheduled_time=req.scheduled_time,
            status=req.status,
            created_at=req.created_at
        ))
    return result

@router.post("/requests/{request_id}/respond")
async def respond_to_practice_request(
    request_id: str,
    payload: RespondRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Accept or decline an incoming practice request.
    """
    req = db.query(models.PracticeRequest).filter(models.PracticeRequest.id == uuid.UUID(request_id)).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Check if the user is authorized to respond (must be the receiver or the mentor)
    authorized = False
    if req.receiver_id == current_user.id:
        authorized = True
    elif req.mentor_id:
        m = db.query(models.Mentor).filter(models.Mentor.id == req.mentor_id).first()
        if m and m.user_id == current_user.id:
            authorized = True
            
    if not authorized:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")

    new_status = "accepted" if payload.action == "accept" else "declined"
    req.status = new_status
    db.commit()

    # Trigger a database notification to the requester
    responder_name = current_user.profile.display_name if current_user.profile else "Practice Partner"
    notif = models.Notification(
        user_id=req.user_id,
        title="Practice Request Update",
        message=f"{responder_name} has {new_status} your practice session request.",
        is_read=False
    )
    db.add(notif)
    db.commit()

    return {"status": "success", "new_status": new_status}

@router.post("/reports")
async def create_moderation_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    File moderation/content reports for admin review.
    """
    reported_uuid = uuid.UUID(payload.reported_user_id) if payload.reported_user_id else None
    
    report = models.Report(
        reporter_id=current_user.id,
        reported_user_id=reported_uuid,
        content_type=payload.content_type,
        content_id=payload.content_id,
        reason=payload.reason,
        status="pending"
    )
    db.add(report)
    db.commit()
    return {"status": "success", "message": "Report logged and sent to moderation board"}
