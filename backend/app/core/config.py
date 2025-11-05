from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = Field("sqlite+aiosqlite:///./app.db", env="DATABASE_URL")
    UPLOAD_DIR: str = Field("./uploads", env="UPLOAD_DIR")
    ENV: str = Field("local", env="ENV")


class Config:
    env_file = ".env.local"


settings = Settings()
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)