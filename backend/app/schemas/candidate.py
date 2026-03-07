# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class CandidateCreateSchema(BaseModel):
    election_id:   uuid.UUID
    full_name:     str           = Field(..., min_length=2, max_length=255)
    description:   Optional[str] = None
    position:      Optional[str] = None
    display_order: int           = 0


class CandidateUpdateSchema(BaseModel):
    full_name:     Optional[str] = None
    description:   Optional[str] = None
    position:      Optional[str] = None
    display_order: Optional[int] = None


class CandidateResponseSchema(BaseModel):
    id:            uuid.UUID
    election_id:   uuid.UUID
    full_name:     str
    description:   Optional[str]
    position:      Optional[str]
    display_order: int
    is_visible:    bool
    created_at:    datetime

    class Config:
        from_attributes = True
