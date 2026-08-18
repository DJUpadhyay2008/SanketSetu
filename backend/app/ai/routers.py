from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["Centralized AI Service"])

class TranslationRequest(BaseModel):
    text: str
    target_language: str = "ISL"

class TranslationResponse(BaseModel):
    text: str
    target_language: str
    video_avatar_url: str  # Generated sign avatar animation URL

class GeneralAIQuery(BaseModel):
    prompt: str

class GeneralAIResponse(BaseModel):
    response: str

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text to Indian Sign Language (avatar animation paths).
    TODO: Integrate with translation model or avatar animation generator.
    """
    return {
        "text": request.text,
        "target_language": request.target_language,
        "video_avatar_url": "https://supabase-storage/avatar-animations/hello.mp4"
    }

@router.post("/query", response_model=GeneralAIResponse)
async def query_ai(request: GeneralAIQuery):
    """
    General AI query utilizing provider-agnostic Gemini system prompt.
    TODO: Implement Gemini API client and custom system prompt.
    """
    return {
        "response": "Hello! I am Sanket Setu's accessibility AI. How can I help you learn or use Indian Sign Language today?"
    }
