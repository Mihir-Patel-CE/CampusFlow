from fastapi import APIRouter
from app.api.v1.endpoints import auth, student, faculty, admin, analytics, ai

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(student.router, prefix="/student", tags=["Student Portal"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["Faculty Portal"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Institution Analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & ML Engines"])
