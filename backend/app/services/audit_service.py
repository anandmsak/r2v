# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/audit_service.py

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.models.audit_log import AuditLog
from app.utils.hashing import compute_audit_hash, generate_audit_genesis_hash


def _now_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00")


def _get_next_sequence(db: Session) -> int:
    result = db.query(func.max(AuditLog.sequence_number)).scalar()
    return 1 if result is None else result + 1


def _get_previous_hash(db: Session) -> str:
    last = db.query(AuditLog).order_by(AuditLog.sequence_number.desc()).first()
    if last is None:
        return generate_audit_genesis_hash()
    return last.current_hash


def log_event(
    db: Session,
    event_type: str,
    actor_id=None,
    actor_role: Optional[str] = None,
    target_id=None,
    target_type: Optional[str] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    event_at = datetime.now(timezone.utc)
    sequence = _get_next_sequence(db)
    prev_hash = _get_previous_hash(db)
    log_id = uuid.uuid4()

    current_hash = compute_audit_hash(
        log_id=str(log_id),
        event_type=event_type,
        actor_id=str(actor_id) if actor_id else "",
        target_id=str(target_id) if target_id else "",
        event_at_iso=_now_iso(event_at),
        previous_hash=prev_hash,
    )

    log = AuditLog(
        id=log_id,
        event_type=event_type,
        actor_id=actor_id,
        actor_role=actor_role,
        target_id=target_id,
        target_type=target_type,
        event_metadata=metadata,  # maps to "event_metadata" Python attr → "metadata" DB col
        ip_address=ip_address,
        sequence_number=sequence,
        previous_hash=prev_hash,
        current_hash=current_hash,
        event_at=event_at,
    )
    db.add(log)
    return log
