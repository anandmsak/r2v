# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/auth_otp.py

import uuid
from sqlalchemy import Column, String, Boolean, SmallInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class AuthOTP(Base):
    __tablename__ = "auth_otps"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp_hash       = Column(String(255), nullable=False)        # SHA-256 only, never plaintext
    expires_at     = Column(DateTime(timezone=True), nullable=False)
    attempts       = Column(SmallInteger, nullable=False, default=0)
    max_attempts   = Column(SmallInteger, nullable=False, default=3)
    is_used        = Column(Boolean, nullable=False, default=False)
    is_invalidated = Column(Boolean, nullable=False, default=False)
    locked_until   = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="otps")