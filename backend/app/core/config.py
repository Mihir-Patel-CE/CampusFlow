import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "campusflow.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusFlow"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusflow-super-secret-production-key-change-me-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Default to absolute SQLite path if POSTGRES_URL not provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    AVATAR_UPLOAD_DIR: Path = BASE_DIR / "uploads" / "avatars"

    class Config:
        case_sensitive = True

settings = Settings()
