import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database import models
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ReadNotificationRequest(BaseModel):
    notification_ids: List[str]

@router.get("/", response_model=List[NotificationItem])
async def list_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get notifications for the logged in user from database.
    """
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

    return [
        NotificationItem(
            id=str(n.id),
            title=n.title,
            message=n.message,
            read=n.is_read,
            created_at=n.created_at
        ) for n in notifs
    ]

@router.post("/read")
async def mark_as_read(
    request: ReadNotificationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark one or more notifications as read in the database.
    """
    for nid in request.notification_ids:
        try:
            n_uuid = uuid.UUID(nid)
            notif = db.query(models.Notification).filter(
                models.Notification.id == n_uuid,
                models.Notification.user_id == current_user.id
            ).first()
            if notif:
                notif.is_read = True
        except ValueError:
            continue
            
    db.commit()
    return {"status": "success", "marked_read": request.notification_ids}
