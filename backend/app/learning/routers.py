import uuid
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai

from app.database.session import get_db
from app.database import models
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.core.config import settings
from app.learning.gamification import trigger_gamification_update

router = APIRouter(prefix="/learning", tags=["Sanket Learn"])

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class CourseOutline(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    difficulty: str
    lessons_count: int
    xp_reward: int
    progress_percent: float

class LessonOutline(BaseModel):
    id: str
    title: str
    difficulty: str
    category: str
    xp_reward: int
    completed: bool

class CourseDetail(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    difficulty: str
    downloadable: bool
    content_version: int
    last_updated: datetime
    validation_status: str
    content_source: Optional[str] = None
    lessons: List[LessonOutline]

class LessonDetail(BaseModel):
    id: str
    course_id: str
    title: str
    content: Optional[str] = None
    difficulty: str
    category: str
    xp_reward: int
    video_url: Optional[str] = None
    images: List[str]
    meaning: Optional[str] = None
    example_sentence: Optional[str] = None
    related_signs: List[str]
    practice_instructions: Optional[str] = None
    scenario_prompt: Optional[str] = None
    scenario_options: List[str]
    scenario_correct_answer: Optional[str] = None
    scenario_feedback: Optional[str] = None
    downloadable: bool
    content_version: int
    last_updated: datetime
    validation_status: str
    content_source: Optional[str] = None
    
    # Progress fields (if logged in)
    completed: bool = False
    quiz_completed: bool = False
    scenario_completed: bool = False
    practice_completed: bool = False
    quiz_score: Optional[int] = None
    scenario_score: Optional[int] = None

class LessonCompleteRequest(BaseModel):
    time_spent_seconds: int

class AnswerSubmission(BaseModel):
    answer: str

class RecommendationResponse(BaseModel):
    weakness_analysis: str
    practice_suggestion: str
    recommended_focus: str
    recommended_lesson_id: Optional[str] = None
    recommended_lesson_title: Optional[str] = None

# ==========================================
# UTILS & HELPER ENGINES
# ==========================================

def get_rule_recommendation(user_name: str, level: str, weak_areas: List[str], completed_count: int) -> dict:
    """Rules-based fallback for user personalization recommendations."""
    if not weak_areas:
        analysis = f"Excellent job, {user_name}! You are demonstrating strong sign recognition accuracy across all completed lessons."
        suggestion = "Review existing vocabulary or practice hand coordination daily for 5-10 minutes to maintain your streak."
        focus = "Everyday Communication or Healthcare"
    else:
        weak_str = ", ".join(weak_areas)
        analysis = f"Based on your assessment history, you are currently showing minor placement errors in the following signs: {weak_str}."
        suggestion = "Focus on double-checking wrist pulse placement for medical signs and hand postures for greetings."
        focus = "Healthcare or Emergency vocabulary"
        
    return {
        "weakness_analysis": analysis,
        "practice_suggestion": suggestion,
        "recommended_focus": focus
    }

def get_ai_recommendation(user_name: str, level: str, weak_areas: List[str], completed_count: int) -> dict:
    """Personalized recommendations powered by Gemini or rules engine fallback."""
    if not settings.GEMINI_API_KEY:
        return get_rule_recommendation(user_name, level, weak_areas, completed_count)
        
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are the Sanket Setu Adaptive ISL Learning Coach.
        User Profile:
        - Name: {user_name}
        - Current ISL Level: {level}
        - Completed Modules: {completed_count}
        - Weak Areas (incorrect quiz/scenario answers): {", ".join(weak_areas) if weak_areas else "None"}
        
        Provide a friendly, personalized analysis and recommendations in JSON format:
        {{
            "weakness_analysis": "string explanation of where they need to improve (e.g., pulse check wrist gesture, or prayer position alignment)",
            "practice_suggestion": "specific practical physical exercises to build strength in these areas",
            "recommended_focus": "lesson category to focus on next"
        }}
        Do NOT write code blocks or markdown, return ONLY the raw JSON string.
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini API recommendation error: {e}")
        return get_rule_recommendation(user_name, level, weak_areas, completed_count)

# ==========================================
# ENDPOINTS
# ==========================================

@router.get("/courses", response_model=List[CourseOutline])
async def list_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """List courses with dynamic categories, difficulties, lesson counters, and completion percentages."""
    query = db.query(models.Course)
    if category and category != "ALL":
        query = query.filter(models.Course.category == category)
    if difficulty and difficulty != "ALL":
        query = query.filter(models.Course.difficulty == difficulty)
        
    courses = query.all()
    results = []
    
    for course in courses:
        lessons = course.lessons
        lessons_count = len(lessons)
        xp_sum = sum(l.xp_reward for l in lessons)
        
        # Calculate completion percentage for authenticated users
        progress_pct = 0.0
        if current_user and lessons_count > 0:
            completed_count = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.lesson_id.in_([l.id for l in lessons]),
                models.UserProgress.completed == True
            ).count()
            progress_pct = round((completed_count / lessons_count) * 100.0, 1)
            
        results.append(CourseOutline(
            id=str(course.id),
            title=course.title,
            description=course.description,
            category=course.category,
            difficulty=course.difficulty,
            lessons_count=lessons_count,
            xp_reward=xp_sum,
            progress_percent=progress_pct
        ))
        
    return results

@router.get("/courses/{course_id}", response_model=CourseDetail)
async def get_course_detail(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Retrieve detailed course outline and individual lessons."""
    try:
        c_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")
        
    course = db.query(models.Course).filter(models.Course.id == c_uuid).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    lessons_list = []
    for l in course.lessons:
        completed = False
        if current_user:
            up = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.lesson_id == l.id
            ).first()
            if up:
                completed = up.completed
                
        lessons_list.append(LessonOutline(
            id=str(l.id),
            title=l.title,
            difficulty=l.difficulty,
            category=l.category,
            xp_reward=l.xp_reward,
            completed=completed
        ))
        
    return CourseDetail(
        id=str(course.id),
        title=course.title,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        downloadable=course.downloadable,
        content_version=course.content_version,
        last_updated=course.last_updated,
        validation_status=course.validation_status,
        content_source=course.content_source,
        lessons=lessons_list
    )

@router.get("/lessons/{lesson_id}", response_model=LessonDetail)
async def get_lesson_detail(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Retrieve complete details for a lesson including practice prompts and user progress status."""
    try:
        l_uuid = uuid.UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
        
    lesson = db.query(models.Lesson).filter(models.Lesson.id == l_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    res = LessonDetail(
        id=str(lesson.id),
        course_id=str(lesson.course_id),
        title=lesson.title,
        content=lesson.content,
        difficulty=lesson.difficulty,
        category=lesson.category,
        xp_reward=lesson.xp_reward,
        video_url=lesson.video_url,
        images=lesson.images or [],
        meaning=lesson.meaning,
        example_sentence=lesson.example_sentence,
        related_signs=lesson.related_signs or [],
        practice_instructions=lesson.practice_instructions,
        scenario_prompt=lesson.scenario_prompt,
        scenario_options=lesson.scenario_options or [],
        scenario_correct_answer=lesson.scenario_correct_answer,
        scenario_feedback=lesson.scenario_feedback,
        downloadable=lesson.downloadable,
        content_version=lesson.content_version,
        last_updated=lesson.last_updated,
        validation_status=lesson.validation_status,
        content_source=lesson.content_source
    )
    
    if current_user:
        up = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.lesson_id == l_uuid
        ).first()
        if up:
            res.completed = up.completed
            res.quiz_completed = up.quiz_completed
            res.scenario_completed = up.scenario_completed
            res.practice_completed = up.practice_completed
            res.quiz_score = up.quiz_score
            res.scenario_score = up.scenario_score
            
    return res

@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson_intro(
    lesson_id: str,
    req: LessonCompleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark a lesson introduction as completed, updating user progress logs."""
    try:
        l_uuid = uuid.UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
        
    lesson = db.query(models.Lesson).filter(models.Lesson.id == l_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    up = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == l_uuid
    ).first()
    
    if not up:
        up = models.UserProgress(
            user_id=current_user.id,
            lesson_id=l_uuid,
            completed=True,
            completed_at=datetime.utcnow(),
            time_spent_seconds=req.time_spent_seconds,
            attempts=1
        )
        db.add(up)
    else:
        up.completed = True
        up.completed_at = datetime.utcnow()
        up.time_spent_seconds += req.time_spent_seconds
        up.attempts += 1
        
    # Award small XP for completing the reading content
    profile = current_user.profile
    if profile:
        profile.badges = list(profile.badges or [])
        # Increment/Award logic
        
    db.commit()
    return {"status": "success", "message": "Lesson content marked completed"}

@router.post("/lessons/{lesson_id}/submit-quiz")
async def submit_lesson_quiz(
    lesson_id: str,
    submission: AnswerSubmission,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Process quiz submissions and award XP dynamically."""
    try:
        l_uuid = uuid.UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
        
    lesson = db.query(models.Lesson).filter(models.Lesson.id == l_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Find quiz question
    quiz = lesson.quizzes[0] if lesson.quizzes else None
    if not quiz or not quiz.questions:
        raise HTTPException(status_code=404, detail="No quiz configured for this lesson")
        
    question = quiz.questions[0]
    is_correct = submission.answer.strip() == question.correct_option.strip()
    score = 100 if is_correct else 0
    xp_gained = lesson.xp_reward if is_correct else 0
    
    up = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == l_uuid
    ).first()
    
    if not up:
        up = models.UserProgress(
            user_id=current_user.id,
            lesson_id=l_uuid,
            completed=False,
            quiz_completed=True,
            quiz_score=score,
            attempts=1
        )
        db.add(up)
    else:
        up.quiz_completed = True
        up.quiz_score = score
        up.attempts += 1
        
    db.commit()
    trigger_gamification_update(
        user_id=current_user.id,
        lesson_id=l_uuid,
        category=lesson.category,
        quiz_passed=is_correct,
        scenario_passed=False,
        db=db
    )
    return {
        "is_correct": is_correct,
        "score": score,
        "xp_gained": xp_gained,
        "correct_answer": question.correct_option
    }

@router.post("/lessons/{lesson_id}/submit-scenario")
async def submit_lesson_scenario(
    lesson_id: str,
    submission: AnswerSubmission,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Process scenario challenge submissions and return feedback."""
    try:
        l_uuid = uuid.UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
        
    lesson = db.query(models.Lesson).filter(models.Lesson.id == l_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    is_correct = submission.answer.strip() == lesson.scenario_correct_answer.strip()
    score = 100 if is_correct else 0
    
    up = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == l_uuid
    ).first()
    
    if not up:
        up = models.UserProgress(
            user_id=current_user.id,
            lesson_id=l_uuid,
            completed=False,
            scenario_completed=True,
            scenario_score=score,
            attempts=1
        )
        db.add(up)
    else:
        up.scenario_completed = True
        up.scenario_score = score
        up.attempts += 1
        
    # Auto-mark lesson complete if scenario is successfully completed
    if score == 100:
        up.completed = True
        up.completed_at = datetime.utcnow()

    db.commit()
    trigger_gamification_update(
        user_id=current_user.id,
        lesson_id=l_uuid,
        category=lesson.category,
        quiz_passed=False,
        scenario_passed=is_correct,
        db=db
    )
    return {
        "is_correct": is_correct,
        "score": score,
        "feedback": lesson.scenario_feedback or ("Good attempt!" if is_correct else "Incorrect. Let's try again.")
    }

@router.post("/lessons/{lesson_id}/submit-practice")
async def submit_lesson_practice(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Log practice module completions."""
    try:
        l_uuid = uuid.UUID(lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson ID format")
        
    lesson = db.query(models.Lesson).filter(models.Lesson.id == l_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    up = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == l_uuid
    ).first()
    
    if not up:
        up = models.UserProgress(
            user_id=current_user.id,
            lesson_id=l_uuid,
            completed=False,
            practice_completed=True,
            attempts=1
        )
        db.add(up)
    else:
        up.practice_completed = True
        up.attempts += 1
        
    db.commit()
    return {"status": "success", "message": "Practice gesture recorded"}

@router.get("/recommendations", response_model=RecommendationResponse)
async def get_personal_recommendations(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Return personalized recommendations powered by Gemini (or a rules engine fallback if no key is configured)."""
    if not current_user:
        # Default guest recommendations
        default_lesson = db.query(models.Lesson).first()
        return RecommendationResponse(
            weakness_analysis="Welcome to Sanket Setu! Log in to receive AI-driven adaptive recommendations based on your performance.",
            practice_suggestion="Start by practicing finger configurations for alphabets and standard greeting shapes.",
            recommended_focus="Everyday Communication",
            recommended_lesson_id=str(default_lesson.id) if default_lesson else None,
            recommended_lesson_title=default_lesson.title if default_lesson else None
        )
        
    # Analyze user weaknesses: find lessons where quiz or scenario failed
    user_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).all()
    
    weak_areas = []
    completed_lesson_ids = []
    
    for up in user_progress:
        if up.completed:
            completed_lesson_ids.append(up.lesson_id)
        if (up.quiz_completed and up.quiz_score == 0) or (up.scenario_completed and up.scenario_score == 0):
            lesson = db.query(models.Lesson).filter(models.Lesson.id == up.lesson_id).first()
            if lesson:
                weak_areas.append(lesson.title)
                
    display_name = current_user.profile.display_name if current_user.profile else "Learner"
    level = current_user.profile.isl_level if current_user.profile else "1"
    
    rec_data = get_ai_recommendation(display_name, level, weak_areas, len(completed_lesson_ids))
    
    # Identify recommended next lesson
    next_lesson = None
    if weak_areas:
        # Suggest reviewing one of the weak lessons
        next_lesson = db.query(models.Lesson).filter(
            models.Lesson.title.in_(weak_areas)
        ).first()
        
    if not next_lesson:
        # Recommend the first uncompleted lesson in the database
        next_lesson = db.query(models.Lesson).filter(
            ~models.Lesson.id.in_(completed_lesson_ids)
        ).first()
        
    if not next_lesson:
        # Re-recommend the first lesson in the database
        next_lesson = db.query(models.Lesson).first()
        
    return RecommendationResponse(
        weakness_analysis=rec_data["weakness_analysis"],
        practice_suggestion=rec_data["practice_suggestion"],
        recommended_focus=rec_data["recommended_focus"],
        recommended_lesson_id=str(next_lesson.id) if next_lesson else None,
        recommended_lesson_title=next_lesson.title if next_lesson else None
    )


# ==========================================
# PHASE 9: OFFLINE PROGRESS SYNC
# ==========================================

class OfflineProgressPayload(BaseModel):
    lesson_id: str
    course_id: str
    completed: bool
    quiz_score: Optional[int] = None
    scenario_completed: Optional[bool] = None
    time_spent_seconds: Optional[int] = 0
    completed_at: Optional[str] = None

@router.post("/progress", tags=["Phase 9 Offline"])
async def sync_offline_progress(
    payload: OfflineProgressPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Accept a single offline progress record from the frontend sync queue.
    Called automatically when connectivity is restored.
    """
    try:
        lesson_uuid = uuid.UUID(payload.lesson_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lesson_id format")

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_uuid).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    up = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == lesson_uuid
    ).first()

    completed_at_dt = None
    if payload.completed_at:
        try:
            completed_at_dt = datetime.fromisoformat(payload.completed_at.replace("Z", "+00:00"))
        except ValueError:
            completed_at_dt = datetime.utcnow()

    if not up:
        up = models.UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_uuid,
            completed=payload.completed,
            completed_at=completed_at_dt or (datetime.utcnow() if payload.completed else None),
            quiz_completed=payload.quiz_score is not None,
            quiz_score=payload.quiz_score,
            scenario_completed=payload.scenario_completed or False,
            time_spent_seconds=payload.time_spent_seconds or 0,
            attempts=1
        )
        db.add(up)
    else:
        # Always honour completed = True if previously not done
        if payload.completed and not up.completed:
            up.completed = True
            up.completed_at = completed_at_dt or datetime.utcnow()
        if payload.quiz_score is not None:
            up.quiz_completed = True
            up.quiz_score = payload.quiz_score
        if payload.scenario_completed:
            up.scenario_completed = True
        up.time_spent_seconds = (up.time_spent_seconds or 0) + (payload.time_spent_seconds or 0)
        up.attempts += 1

    db.commit()
    return {"status": "synced", "lesson_id": payload.lesson_id}


# ==========================================
# PHASE 9: EMERGENCY PACK (ALWAYS OFFLINE)
# ==========================================

EMERGENCY_SIGNS = [
    {"word": "Help", "description": "Open hands raised rapidly, palms outward.", "icon": "🆘", "priority": 1},
    {"word": "Hospital", "description": "H handshape crossed on opposite arm like a cross symbol.", "icon": "🏥", "priority": 2},
    {"word": "Police", "description": "P handshape tapped on chest badge location.", "icon": "🚔", "priority": 3},
    {"word": "Fire", "description": "Fluttering fingers from waist upward, both hands.", "icon": "🔥", "priority": 4},
    {"word": "Ambulance", "description": "A handshape rotating circles in front of body.", "icon": "🚑", "priority": 5},
    {"word": "Emergency", "description": "E handshape shaken rapidly from side to side.", "icon": "🚨", "priority": 6},
    {"word": "Location / Here", "description": "Index finger pointed down, then circular motion.", "icon": "📍", "priority": 7},
    {"word": "Pain / Hurt", "description": "Two index fingers brought together at the pain area.", "icon": "🤕", "priority": 8},
    {"word": "Water", "description": "W handshape tapped on chin.", "icon": "💧", "priority": 9},
    {"word": "Doctor", "description": "D handshape tapped on opposite wrist (pulse point).", "icon": "👨‍⚕️", "priority": 10},
]

@router.get("/emergency-pack", tags=["Phase 9 Offline"])
async def get_emergency_pack():
    """
    Returns cached emergency ISL signs.
    Always available — cached by Service Worker for offline access.
    No authentication required.
    """
    return {
        "version": 1,
        "description": "Essential emergency Indian Sign Language signs — available offline.",
        "disclaimer": "These are learning references. In a real emergency, always contact official services.",
        "signs": EMERGENCY_SIGNS,
        "cached_at": datetime.utcnow().isoformat()
    }
