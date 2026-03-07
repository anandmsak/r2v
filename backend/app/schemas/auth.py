# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/schemas/auth.py

from pydantic import BaseModel, Field


class OTPRequestSchema(BaseModel):
    register_number: str = Field(..., min_length=3, max_length=50)


class OTPVerifySchema(BaseModel):
    register_number: str = Field(..., min_length=3, max_length=50)
    otp:             str = Field(..., min_length=4, max_length=10)


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    user_id:      str
    full_name:    str
