# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/ballot_token.py
# ANONYMIZATION: user_id stored here for issuance control ONLY.
#                This table must NEVER be joined to ballots in result queries.

import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class BallotToken(Base):
    __tablename__ = "ballot_tokens"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    election_id = Column(UUID(as_uuid=True), ForeignKey("elections.id", ondelete="RESTRICT"), nullable=False)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id",     ondelete="RESTRICT"), nullable=False)
    token_hash  = Column(String(255), nullable=False, unique=True)  # SHA-256(raw_token) only
    is_used     = Column(Boolean,     nullable=False, default=False)
    issued_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    used_at     = Column(DateTime(timezone=True), nullable=True)
    expires_at  = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("election_id", "user_id", name="uq_ballot_token_election_user"),
    )

    election = relationship("Election", back_populates="ballot_tokens")
    user     = relationship("User",     back_populates="ballot_tokens")
