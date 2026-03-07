# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/ballot.py
# ANONYMIZATION: NO voter_id column. Identity separation is structural.
# HASH CHAIN: sequence_number, previous_hash, current_hash enforce tamper evidence.

import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Ballot(Base):
    __tablename__ = "ballots"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    election_id     = Column(UUID(as_uuid=True), ForeignKey("elections.id",  ondelete="RESTRICT"), nullable=False)
    candidate_id    = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="RESTRICT"), nullable=False)
    token_ref       = Column(String(255), nullable=False, unique=True)  # SHA-256(raw_token), NOT a FK
    receipt_id      = Column(UUID(as_uuid=True), nullable=False, unique=True, default=uuid.uuid4)
    sequence_number = Column(BigInteger,  nullable=False)
    previous_hash   = Column(String(64),  nullable=False)
    current_hash    = Column(String(64),  nullable=False, unique=True)
    cast_at         = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    election  = relationship("Election",  back_populates="ballots")
    candidate = relationship("Candidate", back_populates="ballots")
