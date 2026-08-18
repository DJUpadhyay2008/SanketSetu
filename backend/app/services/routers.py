from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/assist", tags=["Sanket Assist"])

class AssistRequestCreate(BaseModel):
    service_type: str  # "medical_emergency", "legal", "education", "general"
    description: str
    location: str
    scheduled_time: datetime

class AssistRequestDetail(BaseModel):
    id: str
    service_type: str
    description: str
    location: str
    scheduled_time: datetime
    status: str  # "pending", "assigned", "completed", "cancelled"
    interpreter_name: str | None
    created_at: datetime

class ServiceDirectoryItem(BaseModel):
    id: str
    name: str
    category: str  # "hospital", "police", "railway_station", "bank"
    address: str
    isl_certified: bool
    rating: float

@router.post("/request", response_model=AssistRequestDetail)
async def request_interpreter(request: AssistRequestCreate):
    """
    Request a human sign language interpreter (remote or on-site).
    TODO: Create request in Supabase and dispatch push notification to nearby certified interpreters.
    """
    return {
        "id": "req-999",
        "service_type": request.service_type,
        "description": request.description,
        "location": request.location,
        "scheduled_time": request.scheduled_time,
        "status": "pending",
        "interpreter_name": None,
        "created_at": datetime.now()
    }

@router.get("/requests", response_model=List[AssistRequestDetail])
async def list_requests():
    """
    List user's active/past interpreter requests.
    TODO: Retrieve from DB.
    """
    return [
        {
            "id": "req-998",
            "service_type": "medical_emergency",
            "description": "Routine dental checkup at City Dental Clinic",
            "location": "Sector 15, Dwarka, New Delhi",
            "scheduled_time": datetime.now(),
            "status": "assigned",
            "interpreter_name": "Rajesh Kumar (Certified ISL Level 3)",
            "created_at": datetime.now()
        }
    ]

@router.get("/directory", response_model=List[ServiceDirectoryItem])
async def list_accessible_services(category: str | None = None, isl_only: bool = False):
    """
    Directory of public services, hospitals, civic centers with ISL interpreters or training.
    TODO: Retrieve certified public entities from database.
    """
    return [
        {
            "id": "inst-1",
            "name": "Metro City Hospital",
            "category": "hospital",
            "address": "Connaught Place, New Delhi",
            "isl_certified": True,
            "rating": 4.8
        },
        {
            "id": "inst-2",
            "name": "Central Police Station",
            "category": "police",
            "address": "Sector 62, Noida",
            "isl_certified": False,
            "rating": 3.5
        }
    ]
