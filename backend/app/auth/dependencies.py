import uuid
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.core.supabase import supabase_client

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header. Please log in.",
        )
    
    token = credentials.credentials
    try:
        # Call Supabase to get the user from this token
        res = supabase_client.auth.get_user(token)
        supabase_user = res.user
        if not supabase_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token",
            )
            
        user_uuid = uuid.UUID(supabase_user.id)
        
        # Check if user exists in the local database
        user = db.query(models.User).filter(models.User.id == user_uuid).first()
        if not user:
            # Sync user
            user = models.User(
                id=user_uuid,
                email=supabase_user.email,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Sync public profile from metadata
            user_metadata = supabase_user.user_metadata or {}
            display_name = user_metadata.get("full_name") or user_metadata.get("name") or supabase_user.email.split("@")[0]
            avatar_url = user_metadata.get("avatar_url")
            
            profile = models.Profile(
                id=user_uuid,
                display_name=display_name,
                avatar_url=avatar_url,
                isl_level="1",
                badges=[],
                interests=[]
            )
            
            # Assign default role: learner
            default_role = models.UserRole(
                user_id=user_uuid,
                role="learner"
            )
            
            db.add(profile)
            db.add(default_role)
            db.commit()
            db.refresh(user)
            
        return user
        
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User | None:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        res = supabase_client.auth.get_user(token)
        supabase_user = res.user
        if not supabase_user:
            return None
        user_uuid = uuid.UUID(supabase_user.id)
        user = db.query(models.User).filter(models.User.id == user_uuid).first()
        return user
    except Exception:
        return None
