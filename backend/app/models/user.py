# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/user.py

import uuid
from sqlalchemy import Column, String, Boolean, SmallInteger, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    register_number = Column(String(50),  nullable=False, unique=True, index=True)
    full_name       = Column(String(255), nullable=False)
    email           = Column(String(255), nullable=False, unique=True)
    department      = Column(String(100), nullable=True)
    year            = Column(SmallInteger, nullable=True)
    role            = Column(String(20),  nullable=False, default="voter")
    is_active       = Column(Boolean,     nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(),
                             onupdate=func.now(), nullable=False)

    # Relationships
    otps              = relationship("AuthOTP",         back_populates="user",     cascade="all, delete-orphan")
    eligibilities     = relationship("VoterEligibility", back_populates="user",    foreign_keys="VoterEligibility.user_id")
    ballot_tokens     = relationship("BallotToken",      back_populates="user")
    created_elections = relationship("Election",         back_populates="creator", foreign_keys="Election.created_by")
