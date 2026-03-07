# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/election.py

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Election(Base):
    __tablename__ = "elections"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title        = Column(String(255), nullable=False)
    description  = Column(Text, nullable=True)
    created_by   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status       = Column(String(20), nullable=False, default="draft")
    starts_at    = Column(DateTime(timezone=True), nullable=True)
    ends_at      = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    closed_at    = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(),
                          onupdate=func.now(), nullable=False)

    creator      = relationship("User",            back_populates="created_elections", foreign_keys=[created_by])
    candidates   = relationship("Candidate",       back_populates="election",  cascade="all, delete-orphan")
    eligibilities= relationship("VoterEligibility",back_populates="election")
    ballot_tokens= relationship("BallotToken",     back_populates="election")
    ballots      = relationship("Ballot",          back_populates="election")
    result       = relationship("ResultSnapshot",  back_populates="election",  uselist=False)
