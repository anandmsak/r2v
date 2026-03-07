# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/result_snapshot.py

import uuid
from sqlalchemy import Column, Boolean, Integer, Numeric, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


class ResultSnapshot(Base):
    __tablename__ = "result_snapshots"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    election_id        = Column(UUID(as_uuid=True), ForeignKey("elections.id", ondelete="RESTRICT"), nullable=False)
    generated_by       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_eligible     = Column(Integer,     nullable=False, default=0)
    total_votes_cast   = Column(Integer,     nullable=False, default=0)
    turnout_percent    = Column(Numeric(5,2), nullable=True)
    results            = Column(JSONB,       nullable=False)
    ballot_chain_valid = Column(Boolean,     nullable=False, default=False)
    audit_chain_valid  = Column(Boolean,     nullable=False, default=False)
    generated_at       = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("election_id", name="uq_result_snapshot_election"),
    )

    election  = relationship("Election", back_populates="result")
    generator = relationship("User",     foreign_keys=[generated_by])
