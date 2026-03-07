# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/core/config.py
# Description: Centralised application settings loaded from environment variables.
#              All configuration is read once at startup via pydantic-settings.

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):

    # -------------------------------------------------------------------------
    # Application
    # -------------------------------------------------------------------------
    APP_NAME: str = "R2V - Right to Vote"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    DATABASE_URL: str

    # -------------------------------------------------------------------------
    # JWT Authentication
    # -------------------------------------------------------------------------
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # -------------------------------------------------------------------------
    # OTP Security Parameters
    # These values are non-negotiable per architecture specification.
    # -------------------------------------------------------------------------
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    OTP_LOCKOUT_MINUTES: int = 15
    OTP_LENGTH: int = 6

    # -------------------------------------------------------------------------
    # Email / Notification
    # -------------------------------------------------------------------------
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@r2v.app"

    # -------------------------------------------------------------------------
    # CORS
    # -------------------------------------------------------------------------
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Use this as a FastAPI dependency: Depends(get_settings)
    """
    return Settings()
