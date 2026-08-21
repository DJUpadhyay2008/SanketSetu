from fastapi import APIRouter

# Import routers from app modules
from app.auth.routers import router as auth_router
from app.users.routers import router as users_router
from app.learning.routers import router as learning_router
from app.schemes.routers import router as schemes_router
from app.services.routers import router as services_router
from app.institutions.routers import router as institutions_router
from app.passport.routers import router as passport_router
from app.community.routers import router as community_router
from app.leaderboard.routers import router as leaderboard_router
from app.notifications.routers import router as notifications_router
from app.ai.routers import router as ai_router
from app.isl_live.routers import router as isl_live_router
from app.policy.routers import router as policy_router

api_router = APIRouter()

# Include feature routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(learning_router)
api_router.include_router(schemes_router)
api_router.include_router(services_router)
api_router.include_router(institutions_router)
api_router.include_router(passport_router)
api_router.include_router(community_router)
api_router.include_router(leaderboard_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_router)
api_router.include_router(isl_live_router)
api_router.include_router(policy_router)

