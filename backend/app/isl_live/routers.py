from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/isl-live", tags=["Sanket Live"])

class RecognizeRequest(BaseModel):
    frame_data: str  # Base64 encoded frame
    target_sign: Optional[str] = None  # Expected sign for Learning Mode
    device_rotation: Optional[int] = 0
    aspect_ratio: Optional[float] = 1.33

class RecognizeResponse(BaseModel):
    recognized_sign: str
    confidence: float
    feedback: str

@router.post("/recognize", response_model=RecognizeResponse)
async def recognize_sign(payload: RecognizeRequest):
    """
    Classify a webcam frame to identify Indian Sign Language signs.
    The CV classification model is modular and easily replaceable.
    """
    # A mock prediction engine for testing and live frontend demos
    # If a target sign is provided, simulate a successful match with high confidence (or low if string has 'fail')
    if payload.target_sign:
        target = payload.target_sign.strip().lower()
        if "fail" in target:
            return RecognizeResponse(
                recognized_sign="Unknown Sign",
                confidence=0.34,
                feedback="Please try again. Hand coordinates are unclear — check your lighting and keep your hand steady in the frame."
            )
        else:
            return RecognizeResponse(
                recognized_sign=payload.target_sign,
                confidence=0.92,
                feedback="Perfect gesture! Keep your fingers aligned and transition smoothly."
            )
    
    # General Communication mode fallback
    return RecognizeResponse(
        recognized_sign="Namaste",
        confidence=0.88,
        feedback="Spotted 'Namaste' sign. Good palm orientation."
    )
