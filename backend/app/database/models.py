import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Float, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    skill_progress = relationship("UserSkillProgress", back_populates="user", cascade="all, delete-orphan")
    institution_memberships = relationship("InstitutionMember", back_populates="user", cascade="all, delete-orphan")
    practice_requests = relationship("PracticeRequest", back_populates="user", foreign_keys="[PracticeRequest.user_id]", cascade="all, delete-orphan")
    mentorship = relationship("Mentor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    credentials = relationship("Credential", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    isl_level = Column(String(50), default="1", nullable=False)
    badges = Column(JSON, default=list, nullable=False) # list of badge names/IDs
    interests = Column(JSON, default=list, nullable=False) # list of strings
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=False) # e.g. learner, isl_user, mentor, institution_member, institution_admin
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="roles")

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Everyday Communication", nullable=False) # Everyday Communication, Healthcare, Education, Workplace, Government Services, Emergency, Travel
    difficulty = Column(String(100), default="Beginner", nullable=False) # Beginner, Intermediate, Advanced
    downloadable = Column(Boolean, default=False, nullable=False)
    content_version = Column(Integer, default=1, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    validation_status = Column(String(50), default="draft", nullable=False) # draft, review, validated, published
    content_source = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    credentials = relationship("Credential", back_populates="course", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    difficulty = Column(String(100), nullable=False) # Beginner, Intermediate, Advanced
    category = Column(String(100), nullable=False)
    xp_reward = Column(Integer, default=0, nullable=False)
    
    # Sanket Learn detailed fields
    video_url = Column(String(500), nullable=True)
    images = Column(JSON, default=list, nullable=False) # list of step-by-step visual URLs/descriptions
    meaning = Column(Text, nullable=True)
    example_sentence = Column(Text, nullable=True)
    related_signs = Column(JSON, default=list, nullable=False) # list of related sign words/IDs
    practice_instructions = Column(Text, nullable=True)
    scenario_prompt = Column(Text, nullable=True)
    scenario_options = Column(JSON, default=list, nullable=False) # multiple choice options for scenarios
    scenario_correct_answer = Column(String(255), nullable=True)
    scenario_feedback = Column(Text, nullable=True)
    
    # Offline fields
    downloadable = Column(Boolean, default=False, nullable=False)
    content_version = Column(Integer, default=1, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Admin fields
    validation_status = Column(String(50), default="draft", nullable=False) # draft, review, validated, published
    content_source = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="lessons")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")

class Sign(Base):
    __tablename__ = "signs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    word = Column(String(255), nullable=False, index=True)
    video_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # list of choices/options
    correct_option = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Integer, nullable=True) # overall score (could be quiz/scenario)
    
    # Phase 4 Progress metrics
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    quiz_completed = Column(Boolean, default=False, nullable=False)
    quiz_score = Column(Integer, nullable=True)
    scenario_completed = Column(Boolean, default=False, nullable=False)
    scenario_score = Column(Integer, nullable=True)
    practice_completed = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="user_progress")

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(100), nullable=False) # e.g. fingerspelling, phrases
    score = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="skill_progress")

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    department = Column(String(255), nullable=False)
    benefits = Column(Text, nullable=False)
    eligibility = Column(Text, nullable=True) # Textual summary of eligibility
    documents = Column(JSON, default=list, nullable=False) # list of required documents
    state = Column(String(100), default="Central", nullable=False) # Central, Gujarat, etc.
    category = Column(String(100), default="Financial Aid", nullable=False) # Education, Financial Aid, Travel, etc.
    application_method = Column(String(100), default="Online", nullable=False) # Online, Offline
    official_url = Column(String(500), nullable=True)
    source_name = Column(String(255), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    eligibility_rules = relationship("SchemeEligibility", back_populates="scheme", cascade="all, delete-orphan")

class SchemeEligibility(Base):
    __tablename__ = "scheme_eligibility"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id = Column(UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    criteria_key = Column(String(255), nullable=False) # e.g. min_age, max_age, state, student, max_income, disability_category, education_level, gender
    criteria_value = Column(String(255), nullable=False)

    # Relationships
    scheme = relationship("Scheme", back_populates="eligibility_rules")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False) # healthcare, education, civic, etc.
    city = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    members = relationship("InstitutionMember", back_populates="institution", cascade="all, delete-orphan")
    metrics = relationship("InstitutionMetric", back_populates="institution", cascade="all, delete-orphan")
    scores = relationship("InstitutionScore", back_populates="institution", cascade="all, delete-orphan")

class InstitutionMember(Base):
    __tablename__ = "institution_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=False) # member, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="members")
    user = relationship("User", back_populates="institution_memberships")

class InstitutionMetric(Base):
    __tablename__ = "institution_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    has_isl_interpreters = Column(Boolean, default=False, nullable=False)
    staff_trained_percentage = Column(Integer, default=0, nullable=False)
    has_video_relay_services = Column(Boolean, default=False, nullable=False)
    signage_accessibility_score = Column(Integer, default=1, nullable=False)
    isl_resources_score = Column(Integer, default=0, nullable=False)
    emergency_readiness_score = Column(Integer, default=0, nullable=False)
    learning_participation_score = Column(Integer, default=0, nullable=False)
    user_feedback_score = Column(Integer, default=0, nullable=False)
    accessibility_audit_score = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="metrics")

class InstitutionScore(Base):
    __tablename__ = "institution_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    calculated_score = Column(Integer, nullable=False)
    assigned_tier = Column(String(50), nullable=False)
    recommendations = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="scores")

class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    certification_details = Column(Text, nullable=True)
    rating = Column(Float, default=5.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    assessment_score = Column(Integer, default=0, nullable=False)
    reviews_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="mentorship")
    practice_requests = relationship("PracticeRequest", back_populates="mentor", foreign_keys="[PracticeRequest.mentor_id]")

class PracticeRequest(Base):
    __tablename__ = "practice_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("mentors.id", ondelete="SET NULL"), nullable=True, index=True)
    service_type = Column(String(100), nullable=False) # e.g. medical_emergency, legal, education, general, practice
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, accepted, declined, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="practice_requests", foreign_keys=[user_id])
    mentor = relationship("Mentor", back_populates="practice_requests", foreign_keys=[mentor_id])

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    content_type = Column(String(50), nullable=False) # user, post, comment
    content_id = Column(String(255), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, resolved, dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Badge(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    xp_threshold = Column(Integer, default=0, nullable=False)

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="SET NULL"), nullable=True, index=True)
    issue_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    grade = Column(String(50), nullable=False)
    credential_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="credentials")
    course = relationship("Course", back_populates="credentials")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
