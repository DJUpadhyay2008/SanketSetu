import time
import json
import httpx
from collections import defaultdict
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database import models
from app.core.config import settings

router = APIRouter(prefix="/policy", tags=["Policy AI Assistant (OpenRouter GLM 5.2)"])

# ==========================================
# RATE LIMITER (IN-MEMORY)
# ==========================================
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 120
_ip_request_timestamps = defaultdict(list)

def is_rate_limited(client_ip: str) -> bool:
    if client_ip in ("127.0.0.1", "localhost", "testclient", "::1"):
        return False
    now = time.time()
    timestamps = [ts for ts in _ip_request_timestamps[client_ip] if now - ts < RATE_LIMIT_WINDOW_SECONDS]
    _ip_request_timestamps[client_ip] = timestamps
    if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
        return True
    _ip_request_timestamps[client_ip].append(now)
    return False

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class PolicyChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    user_api_key: Optional[str] = None
    user_provider: Optional[str] = "openrouter" # "openrouter" | "google"

class SchemeSource(BaseModel):
    title: str
    url: str

class PolicyChatResponse(BaseModel):
    answer: str
    eligibility: List[str] = []
    benefits: List[str] = []
    documents: List[str] = []
    application_steps: List[str] = []
    sources: List[SchemeSource] = []
    verification_status: str = "verified"  # "verified" | "partially_verified" | "not_verified"

# ==========================================
# SYSTEM PROMPT FOR GLM 5.2 & LLMs
# ==========================================
SYSTEM_PROMPT = """You are the Sanket Setu Policy Assistant.

You explain Indian government schemes and disability-related public services using ONLY the verified information provided in CONTEXT.

Rules:
1. Never invent a government scheme.
2. Never invent eligibility requirements.
3. Never invent benefit amounts.
4. Never invent deadlines.
5. Never invent application procedures.
6. Never claim that a user is definitely eligible unless the supplied context supports it.
7. If information is missing or the scheme requested does NOT exist in context, set verification_status to "not_verified" and return answer: "I couldn't verify this from our current government sources."
8. Prefer official government sources.
9. Always provide relevant official sources from context.
10. Clearly distinguish verified information from possible applicability.
11. Do not present yourself as a government authority.
12. Do not claim Sanket Setu guarantees eligibility.
13. Explain information in simple, accessible language.

OUTPUT FORMAT:
You MUST output ONLY a JSON object matching this schema:
{
  "answer": "A clear, direct text answer summarizing the scheme or answering the user's question.",
  "eligibility": ["Criteria 1", "Criteria 2"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "documents": ["Required Doc 1", "Required Doc 2"],
  "application_steps": ["Step 1", "Step 2"],
  "sources": [
    {
      "title": "Official Portal Name",
      "url": "https://official.gov.in/link"
    }
  ],
  "verification_status": "verified"
}

If no schemes in CONTEXT match the user query or the scheme requested does NOT exist in CONTEXT, respond EXACTLY with:
{
  "answer": "I couldn't verify this from our current government sources.",
  "eligibility": [],
  "benefits": [],
  "documents": [],
  "application_steps": [],
  "sources": [],
  "verification_status": "not_verified"
}
"""

def get_verified_schemes_context(db: Session):
    schemes = db.query(models.Scheme).filter(models.Scheme.status == "active").all()
    context_blocks = []
    official_urls_map = {}
    valid_urls = set()

    for s in schemes:
        url = s.official_url or ""
        if url:
            valid_urls.add(url)
            official_urls_map[s.title] = url
            if s.source_name:
                official_urls_map[s.source_name] = url

        block = f"""SCHEME: {s.title}
Department: {s.department}
State/Jurisdiction: {s.state}
Category: {s.category}
Description: {s.description}
Benefits: {s.benefits}
Eligibility: {s.eligibility or 'Not specified'}
Required Documents: {', '.join(s.documents) if s.documents else 'None'}
Application Method: {s.application_method}
Official Source Name: {s.source_name or 'Government Portal'}
Official Source URL: {url}"""
        context_blocks.append(block)

    context_str = "\n\n---\n\n".join(context_blocks)
    return context_str, valid_urls, official_urls_map

@router.post("/chat", response_model=PolicyChatResponse)
async def policy_chat(
    req: PolicyChatRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    RAG policy assistant supporting server fallback & dynamic custom user API keys (OpenRouter or Google Gemini).
    Strictly answers using verified Supabase scheme data.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if is_rate_limited(client_ip):
        return PolicyChatResponse(
            answer="Please wait a moment before sending another question.",
            verification_status="not_verified"
        )

    user_query = req.message.strip()
    if not user_query:
        return PolicyChatResponse(
            answer="Please enter a valid question about government policy or schemes.",
            verification_status="not_verified"
        )

    user_api_key = (req.user_api_key or "").strip()
    user_provider = (req.user_provider or "openrouter").lower().strip()

    context_text, valid_urls, official_urls_map = get_verified_schemes_context(db)

    raw_content = ""

    # ----------------------------------------------------
    # PATH A: GOOGLE GEMINI CUSTOM KEY
    # ----------------------------------------------------
    if user_api_key and user_provider in ("google", "gemini"):
        gemini_prompt = f"{SYSTEM_PROMPT}\n\nVERIFIED CONTEXT:\n{context_text}\n\nCONVERSATION HISTORY:\n"
        if req.history:
            for msg in req.history[-6:]:
                if msg.role in ("user", "assistant") and msg.content:
                    gemini_prompt += f"{msg.role.upper()}: {msg.content}\n"
        gemini_prompt += f"\nUSER QUERY: {user_query}\n\nReturn response ONLY as valid raw JSON object matching the exact schema."

        gemini_payload = {
            "contents": [
                {
                    "parts": [{"text": gemini_prompt}]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={user_api_key}"
                resp = await client.post(g_url, json=gemini_payload)
                if resp.status_code != 200:
                    g_url_fallback = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={user_api_key}"
                    resp = await client.post(g_url_fallback, json=gemini_payload)

                if resp.status_code != 200:
                    print(f"Gemini custom key error {resp.status_code}: {resp.text}")
                    return PolicyChatResponse(
                        answer="Invalid Google Gemini API Key or quota limit reached. Please check your key.",
                        verification_status="not_verified"
                    )

                res_data = resp.json()
                raw_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API Exception: {e}")
            return PolicyChatResponse(
                answer="Failed to connect with provided Google Gemini API Key.",
                verification_status="not_verified"
            )

    # ----------------------------------------------------
    # PATH B: OPENROUTER (CUSTOM KEY OR SERVER DEFAULT)
    # ----------------------------------------------------
    else:
        effective_key = user_api_key if user_api_key else settings.OPENROUTER_API_KEY
        if not effective_key:
            return PolicyChatResponse(
                answer="Policy Assistant API key is not configured. Please enter your OpenRouter or Google Gemini API key above.",
                verification_status="not_verified"
            )

        messages = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nVERIFIED CONTEXT:\n{context_text}"}
        ]

        if req.history:
            for msg in req.history[-6:]:
                if msg.role in ("user", "assistant") and msg.content:
                    messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": user_query})

        headers = {
            "Authorization": f"Bearer {effective_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sanketsetu.in",
            "X-Title": "Sanket Setu Policy Assistant"
        }

        candidate_models = [
            settings.OPENROUTER_MODEL,
            "openai/gpt-oss-20b:free",
            "nvidia/nemotron-3-nano-30b-a3b:free",
            "google/gemma-4-31b-it:free"
        ]

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            resp = None
            async with httpx.AsyncClient(timeout=30.0) as client:
                for model in candidate_models:
                    payload["model"] = model
                    resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    print(f"OPENROUTER ({model}) RESP:", resp.status_code)
                    if resp.status_code == 200:
                        break
                    elif resp.status_code in (401, 403) and user_api_key:
                        return PolicyChatResponse(
                            answer="Invalid OpenRouter API Key provided. Please check your key or clear it to use server defaults.",
                            verification_status="not_verified"
                        )
                    elif resp.status_code == 429:
                        import asyncio
                        await asyncio.sleep(1.0)

            if not resp or resp.status_code == 429:
                return PolicyChatResponse(
                    answer="Please wait a moment before sending another question.",
                    verification_status="not_verified"
                )
            elif resp.status_code != 200:
                print(f"OpenRouter API error {resp.status_code}: {resp.text}")
                return PolicyChatResponse(
                    answer="Policy Assistant is temporarily unavailable. Please try again.",
                    verification_status="not_verified"
                )

            res_data = resp.json()
            if not res_data.get("choices") or len(res_data["choices"]) == 0:
                return PolicyChatResponse(
                    answer="Policy Assistant is temporarily unavailable. Please try again.",
                    verification_status="not_verified"
                )

            raw_content = res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenRouter API Exception: {e}")
            return PolicyChatResponse(
                answer="Policy Assistant is temporarily unavailable. Please try again.",
                verification_status="not_verified"
            )

        cleaned_content = raw_content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        if cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
        cleaned_content = cleaned_content.strip()

        data = json.loads(cleaned_content)

        answer = data.get("answer", "")
        verification_status = data.get("verification_status", "verified")

        # Enforce check on hallucinated or non-existent scheme answers
        if "couldn't verify" in answer.lower() or verification_status == "not_verified":
            return PolicyChatResponse(
                answer="I couldn't verify this from our current government sources.",
                eligibility=[],
                benefits=[],
                documents=[],
                application_steps=[],
                sources=[],
                verification_status="not_verified"
            )

        # Fallback for answer string if missing but benefits/eligibility exist
        if not answer:
            benefits_list = data.get("benefits", [])
            if benefits_list:
                answer = f"Based on verified government sources: {benefits_list[0]}"
            else:
                answer = "Here are the verified policy details matching your request."

        raw_sources = data.get("sources", [])
        clean_sources = []
        for src in raw_sources:
            stitle = src.get("title", "") if isinstance(src, dict) else str(src)
            surl = src.get("url", "") if isinstance(src, dict) else ""

            if surl not in valid_urls:
                surl = official_urls_map.get(stitle, "")

            clean_sources.append(SchemeSource(title=stitle, url=surl))

        if not clean_sources:
            for title, url in official_urls_map.items():
                if title.lower() in answer.lower():
                    clean_sources.append(SchemeSource(title=title, url=url))

        return PolicyChatResponse(
            answer=answer,
            eligibility=data.get("eligibility", []),
            benefits=data.get("benefits", []),
            documents=data.get("documents", []),
            application_steps=data.get("application_steps", []),
            sources=clean_sources,
            verification_status=verification_status
        )

    except json.JSONDecodeError:
        return PolicyChatResponse(
            answer="I couldn't verify this from our current government sources.",
            verification_status="not_verified"
        )
    except httpx.TimeoutException:
        return PolicyChatResponse(
            answer="Policy Assistant is temporarily unavailable. Please try again.",
            verification_status="not_verified"
        )
    except Exception as e:
        print(f"Policy Assistant unexpected error: {e}")
        return PolicyChatResponse(
            answer="Policy Assistant is temporarily unavailable. Please try again.",
            verification_status="not_verified"
        )
