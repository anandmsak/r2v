# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/candidate.py

import uuid
from sqlalchemy import Column, String, Text, Boolean, SmallInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    election_id   = Column(UUID(as_uuid=True), ForeignKey("elections.id", ondelete="RESTRICT"), nullable=False)
    full_name     = Column(String(255), nullable=False)
    description   = Column(Text,        nullable=True)
    position      = Column(String(100), nullable=True)
    display_order = Column(SmallInteger, nullable=False, default=0)
    is_visible    = Column(Boolean,     nullable=False, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(),
                           onupdate=func.now(), nullable=False)

    election = relationship("Election",  back_populates="candidates")
    ballots  = relationship("Ballot",    back_populates="candidate")
