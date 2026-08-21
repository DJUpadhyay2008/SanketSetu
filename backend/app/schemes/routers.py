import uuid
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
from app.auth.dependencies import get_current_user_optional
from app.core.config import settings

router = APIRouter(prefix="/schemes", tags=["Sanket Schemes & Policy Guide"])

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class SchemeOutline(BaseModel):
    id: str
    title: str
    description: str
    department: str
    state: str
    category: str
    official_url: Optional[str] = None
    source_name: Optional[str] = None
    status: str

class SchemeDetailResponse(SchemeOutline):
    benefits: str
    eligibility: Optional[str] = None
    documents: List[str]
    application_method: str
    last_verified_at: datetime

class EligibilityProfile(BaseModel):
    age: Optional[int] = None
    state: Optional[str] = None
    student: Optional[bool] = None
    employment: Optional[str] = None
    income: Optional[int] = None
    disability_category: Optional[str] = None
    education_level: Optional[str] = None
    gender: Optional[str] = None

class SchemeEvaluationResult(BaseModel):
    scheme_id: str
    title: str
    description: str
    benefits: str
    eligibility_text: Optional[str] = None
    documents: List[str]
    state: str
    category: str
    official_url: Optional[str] = None
    source_name: Optional[str] = None
    status: str  # "eligible", "potentially_eligible", "ineligible"
    matched_criteria: List[str]
    unmatched_criteria: List[str]
    missing_input_criteria: List[str]

class RAGQuestion(BaseModel):
    question: str

class RAGResponse(BaseModel):
    answer: str
    sources: List[str]
    urls: List[str]

# ==========================================
# ELIGIBILITY RULE ENGINE
# ==========================================

def evaluate_scheme_eligibility(profile: dict, rules: list) -> tuple[str, list[str], list[str], list[str]]:
    """
    Evaluates user profile dictionary against a list of db rules.
    Returns: (status, matched, unmatched, missing)
    """
    matched = []
    unmatched = []
    missing = []
    
    for rule in rules:
        key = rule.criteria_key
        val = rule.criteria_value
        
        profile_key = key
        if key == "max_income":
            profile_key = "income"
        elif key in ("min_age", "max_age"):
            profile_key = "age"
            
        user_val = profile.get(profile_key)
        
        if user_val is None:
            missing.append(key)
            continue
            
        if key == "max_income":
            try:
                if int(user_val) <= int(val):
                    matched.append(f"Income (Rs. {user_val}) is within limit (Rs. {val})")
                else:
                    unmatched.append(f"Income (Rs. {user_val}) exceeds limit of Rs. {val}")
            except (ValueError, TypeError):
                missing.append(key)
        elif key == "min_age":
            try:
                if int(user_val) >= int(val):
                    matched.append(f"Age ({user_val}) meets minimum requirement ({val})")
                else:
                    unmatched.append(f"Age ({user_val}) is below minimum requirement ({val})")
            except (ValueError, TypeError):
                missing.append(key)
        elif key == "max_age":
            try:
                if int(user_val) <= int(val):
                    matched.append(f"Age ({user_val}) is within maximum limit ({val})")
                else:
                    unmatched.append(f"Age ({user_val}) exceeds maximum limit ({val})")
            except (ValueError, TypeError):
                missing.append(key)
        elif key == "state":
            # If Central, state matches any, but check if rule matches
            if str(user_val).strip().lower() == str(val).strip().lower() or str(val).strip().lower() == "central":
                matched.append(f"State ({user_val}) matches criteria ({val})")
            else:
                unmatched.append(f"State must be {val}")
        elif key == "student":
            user_bool = str(user_val).lower() in ("true", "1", "yes")
            rule_bool = str(val).lower() in ("true", "1", "yes")
            if user_bool == rule_bool:
                matched.append("Student status matches")
            else:
                unmatched.append("Must be a student" if rule_bool else "Must not be a student")
        elif key == "disability_category":
            if str(user_val).strip().lower() == str(val).strip().lower() or str(val).strip().lower() == "any":
                matched.append(f"Disability category ({user_val}) matches criteria ({val})")
            else:
                unmatched.append(f"Disability category must be {val}")
        elif key == "education_level":
            if str(user_val).strip().lower() == str(val).strip().lower():
                matched.append(f"Education level ({user_val}) matches criteria ({val})")
            else:
                unmatched.append(f"Education level must be {val}")
        elif key == "gender":
            if str(user_val).strip().lower() == str(val).strip().lower() or str(val).strip().lower() == "any":
                matched.append(f"Gender matches criteria ({val})")
            else:
                unmatched.append(f"Gender must be {val}")
                
    if unmatched:
        status_label = "ineligible"
    elif missing:
        status_label = "potentially_eligible"
    else:
        status_label = "eligible"
        
    return status_label, matched, unmatched, missing

# ==========================================
# ENDPOINTS
# ==========================================

@router.get("/", response_model=List[SchemeOutline])
async def list_schemes(
    category: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve verified government schemes with optional category and state filters."""
    query = db.query(models.Scheme).filter(models.Scheme.status == "active")
    if category and category != "ALL":
        query = query.filter(models.Scheme.category == category)
    if state and state != "ALL":
        query = query.filter(models.Scheme.state == state)
        
    schemes = query.all()
    return [
        SchemeOutline(
            id=str(s.id),
            title=s.title,
            description=s.description,
            department=s.department,
            state=s.state,
            category=s.category,
            official_url=s.official_url,
            source_name=s.source_name,
            status=s.status
        )
        for s in schemes
    ]

@router.get("/{scheme_id}", response_model=SchemeDetailResponse)
async def get_scheme_detail(
    scheme_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve high-fidelity verified details of a government scheme."""
    try:
        s_uuid = uuid.UUID(scheme_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scheme ID format")
        
    scheme = db.query(models.Scheme).filter(models.Scheme.id == s_uuid).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    return SchemeDetailResponse(
        id=str(scheme.id),
        title=scheme.title,
        description=scheme.description,
        department=scheme.department,
        benefits=scheme.benefits,
        eligibility=scheme.eligibility,
        documents=scheme.documents or [],
        state=scheme.state,
        category=scheme.category,
        application_method=scheme.application_method,
        official_url=scheme.official_url,
        source_name=scheme.source_name,
        last_verified_at=scheme.last_verified_at,
        status=scheme.status
    )

@router.post("/evaluate-eligibility", response_model=List[SchemeEvaluationResult])
async def evaluate_eligibility(
    profile: EligibilityProfile,
    db: Session = Depends(get_db)
):
    """Evaluate eligibility for all active schemes deterministically based on user demographics."""
    schemes = db.query(models.Scheme).filter(models.Scheme.status == "active").all()
    results = []
    
    # Convert profile pydantic model to dict
    profile_dict = profile.dict()
    
    for s in schemes:
        rules = s.eligibility_rules
        status_label, matched, unmatched, missing = evaluate_scheme_eligibility(profile_dict, rules)
        
        # Central schemes are potentially relevant to any state
        if s.state != "Central" and profile.state and profile.state.lower() != s.state.lower():
            # Override to ineligible if state doesn't match
            status_label = "ineligible"
            unmatched.append(f"State must be {s.state}")
            
        results.append(SchemeEvaluationResult(
            scheme_id=str(s.id),
            title=s.title,
            description=s.description,
            benefits=s.benefits,
            eligibility_text=s.eligibility,
            documents=s.documents or [],
            state=s.state,
            category=s.category,
            official_url=s.official_url,
            source_name=s.source_name,
            status=status_label,
            matched_criteria=matched,
            unmatched_criteria=unmatched,
            missing_input_criteria=missing
        ))
        
    return results

@router.post("/ask", response_model=RAGResponse)
async def ask_schemes_bot(
    question_req: RAGQuestion,
    db: Session = Depends(get_db)
):
    """Hallucination-safe AI assistant using RAG on verified government schemes only."""
    # Fetch all verified schemes from the database to build RAG context
    schemes = db.query(models.Scheme).filter(models.Scheme.status == "active").all()
    
    # Format schemes context for Gemini
    context_blocks = []
    for s in schemes:
        block = f"""
Scheme Name: {s.title}
Department: {s.department}
Category: {s.category}
State: {s.state}
Benefits: {s.benefits}
Eligibility: {s.eligibility or 'Not specified'}
Required Documents: {', '.join(s.documents) if s.documents else 'None'}
Official Source: {s.source_name or 'N/A'}
Official URL: {s.official_url or 'N/A'}
"""
        context_blocks.append(block)
        
    context = "\n---\n".join(context_blocks)
    
    if not settings.GEMINI_API_KEY:
        # Fallback explanation if no Gemini API key is present
        # We search matching keywords in database
        query_lower = question_req.question.lower()
        matched_schemes = []
        for s in schemes:
            if s.category.lower() in query_lower or s.state.lower() in query_lower or "scheme" in query_lower or "help" in query_lower:
                matched_schemes.append(s)
                
        if matched_schemes:
            ans = "Based on our verified database, here are relevant schemes:\n\n"
            sources = []
            urls = []
            for s in matched_schemes:
                ans += f"• **{s.title}**: {s.benefits}\n"
                sources.append(s.source_name or s.title)
                urls.append(s.official_url or "")
            return RAGResponse(answer=ans, sources=sources, urls=urls)
        else:
            return RAGResponse(
                answer="I couldn't verify this from our current government sources.",
                sources=[],
                urls=[]
            )
            
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
You are the Sanket Setu Government Schemes AI Assistant.
Your task is to answer the user's question about government schemes using ONLY the provided verified government schemes data.

Verified Government Schemes Data:
{context}

Guidelines:
1. Answer the user's question accurately and objectively.
2. Rely ONLY on the verified government schemes data provided above. Do NOT use outside knowledge, do NOT invent schemes, and do NOT extrapolate rules.
3. Always list the official source name and official URL for the schemes mentioned in your answer.
4. If the question cannot be answered using ONLY the provided schemes data, or if the answer is not present, you must respond EXACTLY with:
   "I couldn't verify this from our current government sources."
   Do not attempt to explain or add any other text.

User Question: {question_req.question}
Answer:
"""
        response = model.generate_content(prompt)
        answer_text = response.text.strip()
        
        # Enforce exact safeguard check
        if "couldn't verify this" in answer_text.lower() or "not present" in answer_text.lower():
            return RAGResponse(
                answer="I couldn't verify this from our current government sources.",
                sources=[],
                urls=[]
            )
            
        # Parse matching sources and urls
        sources = []
        urls = []
        for s in schemes:
            if s.title.lower() in answer_text.lower() or (s.source_name and s.source_name.lower() in answer_text.lower()):
                sources.append(s.source_name or s.title)
                if s.official_url:
                    urls.append(s.official_url)
                    
        return RAGResponse(
            answer=answer_text,
            sources=list(set(sources)),
            urls=list(set(urls))
        )
    except Exception as e:
        print(f"Gemini API schemes RAG error: {e}")
        return RAGResponse(
            answer="I couldn't verify this from our current government sources.",
            sources=[],
            urls=[]
        )
