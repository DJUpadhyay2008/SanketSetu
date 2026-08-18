import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models

router = APIRouter(prefix="/institutions", tags=["ISL-Ready Index & Auditing"])

# Schemas
class ScoreBreakdown(BaseModel):
    staff_training: int
    service_accessibility: int
    isl_resources: int
    emergency_readiness: int
    learning_participation: int
    user_feedback: int
    accessibility_audit: int

class InstitutionIndexItem(BaseModel):
    id: str
    name: str
    category: str  # "healthcare", "education", "corporate", "civic"
    readiness_score: int  # 0 to 100
    tier: str  # "A+", "A", "B", "C", "D"
    city: str
    is_verified: bool
    breakdown: ScoreBreakdown
    recommendations: List[str]

class SelfEvaluationRequest(BaseModel):
    has_isl_interpreters: bool
    staff_trained_percentage: int
    has_video_relay_services: bool
    isl_resources_score: int  # 0-15
    emergency_readiness_score: int  # 0-15
    learning_participation_score: int  # 0-10
    user_feedback_score: int  # 0-10
    accessibility_audit_score: int  # 0-10

class SelfEvaluationResult(BaseModel):
    calculated_score: int
    assigned_tier: str
    breakdown: ScoreBreakdown
    recommendations: List[str]

class InstitutionRegisterRequest(BaseModel):
    name: str
    category: str  # healthcare, education, corporate, civic
    city: str
    has_isl_interpreters: bool = False
    staff_trained_percentage: int = 0
    has_video_relay_services: bool = False
    isl_resources_score: int = 0
    emergency_readiness_score: int = 0
    learning_participation_score: int = 0
    user_feedback_score: int = 0
    accessibility_audit_score: int = 0

def calculate_score_and_breakdown(metric: models.InstitutionMetric):
    # Deterministic Scoring Model
    staff_training = int(min(20, (metric.staff_trained_percentage * 20) / 100))
    service_accessibility = (10 if metric.has_isl_interpreters else 0) + (10 if metric.has_video_relay_services else 0)
    isl_resources = int(min(15, metric.isl_resources_score))
    emergency_readiness = int(min(15, metric.emergency_readiness_score))
    learning_participation = int(min(10, metric.learning_participation_score))
    user_feedback = int(min(10, metric.user_feedback_score))
    accessibility_audit = int(min(10, metric.accessibility_audit_score))

    total_score = staff_training + service_accessibility + isl_resources + emergency_readiness + learning_participation + user_feedback + accessibility_audit
    
    tier = "D"
    if total_score >= 90:
        tier = "A+"
    elif total_score >= 75:
        tier = "A"
    elif total_score >= 55:
        tier = "B"
    elif total_score >= 35:
        tier = "C"

    # Compile recommendations
    recs = []
    if not metric.has_isl_interpreters:
        recs.append("Hire or contract certified ISL interpreters for on-site assistance.")
    if metric.staff_trained_percentage < 50:
        recs.append("Enroll more customer-facing staff in everyday greetings ISL courses.")
    if not metric.has_video_relay_services:
        recs.append("Install a Video Relay Service (VRS) kiosk at the main reception/lobby.")
    if metric.emergency_readiness_score < 10:
        recs.append("Conduct a dedicated ISL emergency drill and print visual evacuation signs.")
    if metric.isl_resources_score < 10:
        recs.append("Establish a physical or digital directory containing QR-for-ISL sign guides.")

    return total_score, tier, ScoreBreakdown(
        staff_training=staff_training,
        service_accessibility=service_accessibility,
        isl_resources=isl_resources,
        emergency_readiness=emergency_readiness,
        learning_participation=learning_participation,
        user_feedback=user_feedback,
        accessibility_audit=accessibility_audit
    ), recs

@router.get("/index", response_model=List[InstitutionIndexItem])
async def get_index(
    category: Optional[str] = None, 
    city: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    Get all institutions ranked by their ISL accessibility readiness scores.
    """
    query = db.query(models.Institution)
    if category:
        query = query.filter(models.Institution.category == category.lower())
    if city:
        query = query.filter(models.Institution.city.ilike(f"%{city}%"))
        
    institutions = query.all()
    results = []

    for inst in institutions:
        metric = db.query(models.InstitutionMetric).filter(models.InstitutionMetric.institution_id == inst.id).first()
        if not metric:
            # Create default metric if none exists
            metric = models.InstitutionMetric(
                institution_id=inst.id,
                has_isl_interpreters=False,
                staff_trained_percentage=0,
                has_video_relay_services=False,
                signage_accessibility_score=5,
                isl_resources_score=5,
                emergency_readiness_score=5,
                learning_participation_score=5,
                user_feedback_score=5,
                accessibility_audit_score=5
            )
            db.add(metric)
            db.commit()
            db.refresh(metric)

        total_score, tier, breakdown, recs = calculate_score_and_breakdown(metric)
        results.append(InstitutionIndexItem(
            id=str(inst.id),
            name=inst.name,
            category=inst.category,
            readiness_score=total_score,
            tier=tier,
            city=inst.city,
            is_verified=inst.is_verified,
            breakdown=breakdown,
            recommendations=recs
        ))

    # Sort by score descending
    results.sort(key=lambda x: x.readiness_score, reverse=True)
    return results

@router.post("/register", response_model=InstitutionIndexItem)
async def register_institution(req: InstitutionRegisterRequest, db: Session = Depends(get_db)):
    """
    Allows a new institution to self-register.
    """
    # Create the institution
    inst = models.Institution(
        id=uuid.uuid4(),
        name=req.name,
        category=req.category.lower(),
        city=req.city,
        is_verified=False  # Must be approved by admin
    )
    db.add(inst)
    db.flush()

    # Create the metrics
    metric = models.InstitutionMetric(
        id=uuid.uuid4(),
        institution_id=inst.id,
        has_isl_interpreters=req.has_isl_interpreters,
        staff_trained_percentage=req.staff_trained_percentage,
        has_video_relay_services=req.has_video_relay_services,
        signage_accessibility_score=req.accessibility_audit_score,
        isl_resources_score=req.isl_resources_score,
        emergency_readiness_score=req.emergency_readiness_score,
        learning_participation_score=req.learning_participation_score,
        user_feedback_score=req.user_feedback_score,
        accessibility_audit_score=req.accessibility_audit_score
    )
    db.add(metric)
    db.commit()

    total_score, tier, breakdown, recs = calculate_score_and_breakdown(metric)
    
    # Save the score
    score_record = models.InstitutionScore(
        id=uuid.uuid4(),
        institution_id=inst.id,
        calculated_score=total_score,
        assigned_tier=tier,
        recommendations=recs
    )
    db.add(score_record)
    db.commit()

    return InstitutionIndexItem(
        id=str(inst.id),
        name=inst.name,
        category=inst.category,
        readiness_score=total_score,
        tier=tier,
        city=inst.city,
        is_verified=inst.is_verified,
        breakdown=breakdown,
        recommendations=recs
    )

@router.post("/{inst_id}/verify", response_model=InstitutionIndexItem)
async def verify_institution(inst_id: str, db: Session = Depends(get_db)):
    """
    Admin verifies an institution, marking it as verified on the index.
    """
    try:
        inst_uuid = uuid.UUID(inst_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid institution ID format")

    inst = db.query(models.Institution).filter(models.Institution.id == inst_uuid).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    inst.is_verified = True
    db.commit()

    metric = db.query(models.InstitutionMetric).filter(models.InstitutionMetric.institution_id == inst.id).first()
    total_score, tier, breakdown, recs = calculate_score_and_breakdown(metric)

    return InstitutionIndexItem(
        id=str(inst.id),
        name=inst.name,
        category=inst.category,
        readiness_score=total_score,
        tier=tier,
        city=inst.city,
        is_verified=inst.is_verified,
        breakdown=breakdown,
        recommendations=recs
    )

@router.post("/evaluate", response_model=SelfEvaluationResult)
async def submit_self_evaluation(evaluation: SelfEvaluationRequest):
    """
    Preview the scoring for an institution self-auditing submission before publishing.
    """
    # Create temporary metric object
    temp_metric = models.InstitutionMetric(
        has_isl_interpreters=evaluation.has_isl_interpreters,
        staff_trained_percentage=evaluation.staff_trained_percentage,
        has_video_relay_services=evaluation.has_video_relay_services,
        isl_resources_score=evaluation.isl_resources_score,
        emergency_readiness_score=evaluation.emergency_readiness_score,
        learning_participation_score=evaluation.learning_participation_score,
        user_feedback_score=evaluation.user_feedback_score,
        accessibility_audit_score=evaluation.accessibility_audit_score
    )

    total_score, tier, breakdown, recs = calculate_score_and_breakdown(temp_metric)

    return {
        "calculated_score": total_score,
        "assigned_tier": tier,
        "breakdown": breakdown,
        "recommendations": recs
    }
