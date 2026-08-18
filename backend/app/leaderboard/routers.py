from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.institutions.routers import calculate_score_and_breakdown

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard & Engagement"])

class LeaderboardInstitutionEntry(BaseModel):
    rank: int
    id: str
    name: str
    category: str
    city: str
    score: int
    tier: str
    trend: str  # "up", "down", "stable"
    badges: List[str]
    is_verified: bool

@router.get("/institutions", response_model=List[LeaderboardInstitutionEntry])
async def get_institution_leaderboard(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get top institutions ranked by their ISL accessibility readiness scores.
    Categories supported: overall, education (Colleges), healthcare (Hospitals), corporate (Companies), civic (Government Offices).
    """
    query = db.query(models.Institution)
    
    # Filter if category is specified (map frontend tab name to category database string)
    if category and category.lower() != "overall":
        mapped_cat = category.lower()
        if mapped_cat == "colleges":
            mapped_cat = "education"
        elif mapped_cat == "hospitals":
            mapped_cat = "healthcare"
        elif mapped_cat == "companies":
            mapped_cat = "corporate"
        elif mapped_cat == "government":
            mapped_cat = "civic"
        query = query.filter(models.Institution.category == mapped_cat)

    institutions = query.all()
    entries = []

    for inst in institutions:
        metric = db.query(models.InstitutionMetric).filter(models.InstitutionMetric.institution_id == inst.id).first()
        if not metric:
            continue
            
        total_score, tier, _, _ = calculate_score_and_breakdown(metric)

        # Determine badges dynamically based on metrics
        badges = []
        if metric.staff_trained_percentage >= 80:
            badges.append("ISL Trained Staff")
        if metric.has_isl_interpreters:
            badges.append("Interpreter Present")
        if metric.has_video_relay_services:
            badges.append("Video Relay (VRS)")
        if metric.emergency_readiness_score >= 12:
            badges.append("Emergency Ready")
        if metric.user_feedback_score >= 9:
            badges.append("Top Feedback")
            
        # Add tier badge
        if total_score >= 90:
            badges.append("Gold Tier")
        elif total_score >= 75:
            badges.append("Silver Tier")
        elif total_score >= 55:
            badges.append("Bronze Tier")

        # Mock a trend based on the score hash for visual demonstration
        trend_hash = (total_score + len(inst.name)) % 3
        trend = "stable"
        if trend_hash == 0:
            trend = "up"
        elif trend_hash == 1:
            trend = "down"

        entries.append({
            "id": str(inst.id),
            "name": inst.name,
            "category": inst.category,
            "city": inst.city,
            "score": total_score,
            "tier": tier,
            "trend": trend,
            "badges": badges,
            "is_verified": inst.is_verified
        })

    # Sort entries by score descending
    entries.sort(key=lambda x: x["score"], reverse=True)

    # Assign ranks
    leaderboard = []
    for idx, entry in enumerate(entries):
        leaderboard.append(LeaderboardInstitutionEntry(
            rank=idx + 1,
            id=entry["id"],
            name=entry["name"],
            category=entry["category"],
            city=entry["city"],
            score=entry["score"],
            tier=entry["tier"],
            trend=entry["trend"],
            badges=entry["badges"],
            is_verified=entry["is_verified"]
        ))

    return leaderboard
