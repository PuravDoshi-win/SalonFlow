import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "SalonFlow"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security
    SECRET_KEY: str = "salonflow-super-secret-production-grade-jwt-key-minimum-32-chars-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/salonflow"
    SQLITE_FALLBACK_URL: str = "sqlite:///./salonflow.db"

    # Salon operational settings
    SALON_NAME: str = "SalonFlow Luxury Studio"
    SALON_TAGLINE: str = "Smart Salon. Zero Waiting."
    SALON_OPENING_TIME: str = "09:00:00"
    SALON_CLOSING_TIME: str = "21:00:00"
    ONLINE_QUEUE_CUTOFF_MINUTES: int = 30
    MAX_ONLINE_QUEUE_CAPACITY: int = 30

settings = Settings()
