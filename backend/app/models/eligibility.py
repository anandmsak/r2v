# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/eligibility.py

import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class VoterEligibility(Base):
    __tablename__ = "voter_eligibility"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    election_id = Column(UUID(as_uuid=True), ForeignKey("elections.id", ondelete="RESTRICT"), nullable=False)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id",     ondelete="RESTRICT"), nullable=False)
    has_voted   = Column(Boolean,     nullable=False, default=False)
    voted_at    = Column(DateTime(timezone=True), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        # DB-level duplicate vote prevention
        UniqueConstraint("election_id", "user_id", name="uq_eligibility_election_user"),
    )

    election = relationship("Election", back_populates="eligibilities", foreign_keys=[election_id])
    user     = relationship("User",     back_populates="eligibilities", foreign_keys=[user_id])
    uploader = relationship("User",                                     foreign_keys=[uploaded_by])
