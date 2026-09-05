from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import Base, engine
from app.seed import seed_database
import os

# Ensure uploads directory exists
os.makedirs(settings.AVATAR_UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="CampusFlow — Smart College Student & Academic Management Platform Backend API",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Auto-initialize and seed DB if running on fresh database
    Base.metadata.create_all(bind=engine)
    try:
        from app.models.domain import User
        from app.core.database import SessionLocal
        db = SessionLocal()
        user_count = db.query(User).count()
        db.close()
        if user_count == 0:
            seed_database()
    except Exception as e:
        print(f"Startup DB check error: {e}")

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "Online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)
