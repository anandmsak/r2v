# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class ElectionCreateSchema(BaseModel):
    title:       str            = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    starts_at:   Optional[datetime] = None
    ends_at:     Optional[datetime] = None


class ElectionUpdateSchema(BaseModel):
    title:       Optional[str]      = None
    description: Optional[str]      = None
    starts_at:   Optional[datetime] = None
    ends_at:     Optional[datetime] = None


class ElectionResponseSchema(BaseModel):
    id:           uuid.UUID
    title:        str
    description:  Optional[str]
    status:       str
    starts_at:    Optional[datetime]
    ends_at:      Optional[datetime]
    published_at: Optional[datetime]
    closed_at:    Optional[datetime]
    created_at:   datetime

    class Config:
        from_attributes = True
