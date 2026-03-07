# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/schemas/eligibility.py

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid


class VoterAddSchema(BaseModel):
    election_id:     uuid.UUID
    register_number: str


class VoterRemoveSchema(BaseModel):
    election_id:     uuid.UUID
    register_number: str


class EligibilityResponseSchema(BaseModel):
    id:          uuid.UUID
    election_id: uuid.UUID
    user_id:     uuid.UUID
    has_voted:   bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


class CSVUploadResultSchema(BaseModel):
    enrolled:          int
    skipped_duplicate: int
    skipped_not_found: int
    errors:            List[dict]
