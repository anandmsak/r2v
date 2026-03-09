# Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/core/config.py
# UPDATED: Added ADMIN_REGISTER_KEY

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):

    APP_NAME:    str = "R2V - Right to Vote"
    APP_VERSION: str = "1.0.0"
    DEBUG:       bool = False

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM:  str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS:   int = 3
    OTP_LOCKOUT_MINUTES: int = 15
    OTP_LENGTH:         int = 6

    SMTP_HOST:     str = "smtp.gmail.com"
    SMTP_PORT:     int = 587
    SMTP_USER:     str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM:    str = "noreply@r2v.app"

    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── Admin self-registration protection key ──────────────────────────────
    # Set this in your .env file. Without it, /auth/admin/register is blocked.
    # Example .env entry:  ADMIN_REGISTER_KEY=MySecretKey@2026
    ADMIN_REGISTER_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
