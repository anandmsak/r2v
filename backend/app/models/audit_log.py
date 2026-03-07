# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/models/audit_log.py
# Append-only. Every record is chained with SHA-256.

import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    actor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_role = Column(String(20), nullable=True)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    target_type = Column(String(50), nullable=True)
    event_metadata = Column(
        "metadata", JSONB, nullable=True
    )  # column name in DB stays "metadata"
    ip_address = Column(INET, nullable=True)
    sequence_number = Column(BigInteger, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True)
    event_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    actor = relationship("User", foreign_keys=[actor_id])
