import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()

API_PREFIX = os.getenv("API_PREFIX", "/api")

def _build_database_url() -> str:
    driver = os.getenv("DB_DRIVER", "postgresql+psycopg2")
    user = os.getenv("DB_USER", "talleres_user")
    password = os.getenv("DB_PASSWORD", "talleres")
    host = os.getenv("DB_HOST", "192.168.35.232")
    port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "talleres")
    
    return f"{driver}://{user}:{password}@{host}:{port}/{db_name}"


def _load_frontend_origins() -> List[str]:
    origins_raw = os.getenv("FRONTEND_ORIGINS")
    if not origins_raw:
        return ["http://localhost:5173"]
    
    origins: List[str] = []
    for origin in origins_raw.split(","):
        normalized = origin.strip()
        if normalized:
            origins.append(normalized)
            
    return origins or ["http://localhost:5173"]

DATABASE_URL = _build_database_url()
FRONTEND_ORIGINS = _load_frontend_origins()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_FULL_NAME = os.getenv("ADMIN_FULL_NAME")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))