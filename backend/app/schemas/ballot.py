# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/schemas/ballot.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class TokenRequestSchema(BaseModel):
    election_id: uuid.UUID


class TokenResponseSchema(BaseModel):
    token:      str
    expires_in: int   # seconds
    message:    str


class VoteCastSchema(BaseModel):
    election_id:  uuid.UUID
    candidate_id: uuid.UUID
    token:        str


class VoteReceiptSchema(BaseModel):
    receipt_id:   str
    sequence:     int
    current_hash: str
    cast_at:      str
    message:      str
