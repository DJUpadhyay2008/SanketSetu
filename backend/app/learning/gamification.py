import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import models

def calculate_user_total_xp(user_id: uuid.UUID, db: Session) -> int:
    """Sum up user XP based on completed lessons, perfect quizzes, and perfect scenarios."""
    progress_records = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id
    ).all()
    
    total_xp = 0
    for up in progress_records:
        lesson = up.lesson
        if not lesson:
            continue
        # Base completion XP
        if up.completed:
            total_xp += lesson.xp_reward
        # Extra quiz XP
        if up.quiz_completed and up.quiz_score == 100:
            total_xp += 50  # 50 bonus XP for perfect quiz
        # Extra scenario XP
        if up.scenario_completed and up.scenario_score == 100:
            total_xp += 100 # 100 bonus XP for perfect scenario
            
    return total_xp

def check_and_award_badges(user_id: uuid.UUID, db: Session) -> List[str]:
    """Check user progress achievements and award corresponding badges dynamically."""
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not profile:
        return []
        
    current_badges = set(profile.badges or [])
    new_badges = []
    
    user_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id
    ).all()
    
    completed_lessons = [up for up in user_progress if up.completed]
    perfect_quizzes = [up for up in user_progress if up.quiz_completed and up.quiz_score == 100]
    perfect_scenarios = [up for up in user_progress if up.scenario_completed and up.scenario_score == 100]
    
    # Badge 1: Sanket Pioneer (first lesson completed)
    if len(completed_lessons) >= 1 and "Sanket Pioneer" not in current_badges:
        new_badges.append("Sanket Pioneer")
        
    # Badge 2: Quiz Whiz (3 perfect quizzes)
    if len(perfect_quizzes) >= 3 and "Quiz Whiz" not in current_badges:
        new_badges.append("Quiz Whiz")
        
    # Badge 3: Scenario Hero (3 perfect scenarios)
    if len(perfect_scenarios) >= 3 and "Scenario Hero" not in current_badges:
        new_badges.append("Scenario Hero")
        
    # Badge 4: Vocabulary Master (10 completed lessons)
    if len(completed_lessons) >= 10 and "Vocabulary Master" not in current_badges:
        new_badges.append("Vocabulary Master")
        
    # Badge 5: ISL Scholar (all lessons of any course completed)
    courses = db.query(models.Course).all()
    for course in courses:
        course_lesson_ids = {l.id for l in course.lessons}
        if course_lesson_ids:
            completed_in_course = {up.lesson_id for up in completed_lessons if up.lesson_id in course_lesson_ids}
            if course_lesson_ids.issubset(completed_in_course):
                if "ISL Scholar" not in current_badges:
                    new_badges.append("ISL Scholar")
                break
                
    if new_badges:
        updated_badges = list(current_badges.union(new_badges))
        profile.badges = updated_badges
        db.commit()
        
    return list(profile.badges)

def update_user_skill_progress(user_id: uuid.UUID, category: str, score_delta: int, db: Session):
    """Increment/update user skill progress score for the given lesson category."""
    skill_progress = db.query(models.UserSkillProgress).filter(
        models.UserSkillProgress.user_id == user_id,
        models.UserSkillProgress.skill == category
    ).first()
    
    if not skill_progress:
        skill_progress = models.UserSkillProgress(
            user_id=user_id,
            skill=category,
            score=score_delta
        )
        db.add(skill_progress)
    else:
        skill_progress.score += score_delta
        
    db.commit()

def trigger_gamification_update(
    user_id: uuid.UUID,
    lesson_id: uuid.UUID,
    category: str,
    quiz_passed: bool,
    scenario_passed: bool,
    db: Session
):
    """Orchestrates XP, skill progress, and badge checks upon interactive step completion."""
    # Update Category Skill progress
    score_delta = 0
    if quiz_passed:
        score_delta += 15
    if scenario_passed:
        score_delta += 25
        
    if score_delta > 0:
        update_user_skill_progress(user_id, category, score_delta, db)
        
    # Award and check badges
    check_and_award_badges(user_id, db)
