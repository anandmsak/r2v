# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/election_service.py
# Description: Election lifecycle management — create, update, start, end, archive.
#              Every state transition is audit-logged.

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.election import Election
from app.models.user import User
from app.services.audit_service import log_event


class ElectionError(Exception):
    pass


def _now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create_election(
    db: Session,
    title: str,
    description: Optional[str],
    starts_at: Optional[datetime],
    ends_at: Optional[datetime],
    admin: User,
    ip: Optional[str] = None,
) -> Election:
    if ends_at and starts_at and ends_at <= starts_at:
        raise ElectionError("End time must be after start time.")

    election = Election(
        title       = title,
        description = description,
        created_by  = admin.id,
        status      = "draft",
        starts_at   = starts_at,
        ends_at     = ends_at,
    )
    db.add(election)
    db.flush()  # get election.id before audit log

    log_event(
        db          = db,
        event_type  = "election_created",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election.id,
        target_type = "election",
        metadata    = {"title": title},
        ip_address  = ip,
    )
    db.commit()
    db.refresh(election)
    return election


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

def get_election(db: Session, election_id) -> Optional[Election]:
    return db.query(Election).filter(Election.id == election_id).first()


def list_elections(db: Session, status: Optional[str] = None) -> List[Election]:
    q = db.query(Election)
    if status:
        q = q.filter(Election.status == status)
    return q.order_by(Election.created_at.desc()).all()


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

def update_election(
    db: Session,
    election_id,
    title: Optional[str],
    description: Optional[str],
    starts_at: Optional[datetime],
    ends_at: Optional[datetime],
    admin: User,
    ip: Optional[str] = None,
) -> Election:
    election = get_election(db, election_id)
    if not election:
        raise ElectionError("Election not found.")
    if election.status not in ("draft", "scheduled"):
        raise ElectionError("Only draft or scheduled elections can be updated.")

    if title:        election.title       = title
    if description is not None: election.description = description
    if starts_at:    election.starts_at   = starts_at
    if ends_at:      election.ends_at     = ends_at

    log_event(
        db          = db,
        event_type  = "election_updated",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election.id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(election)
    return election


# ---------------------------------------------------------------------------
# State transitions
# ---------------------------------------------------------------------------

def start_election(db: Session, election_id, admin: User, ip=None) -> Election:
    election = get_election(db, election_id)
    if not election:
        raise ElectionError("Election not found.")
    if election.status not in ("draft", "scheduled"):
        raise ElectionError(f"Cannot start election in '{election.status}' status.")

    election.status      = "active"
    election.published_at = _now()

    log_event(
        db          = db,
        event_type  = "election_started",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election.id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(election)
    return election


def end_election(db: Session, election_id, admin: User, ip=None) -> Election:
    election = get_election(db, election_id)
    if not election:
        raise ElectionError("Election not found.")
    if election.status != "active":
        raise ElectionError("Only active elections can be ended.")

    election.status    = "completed"
    election.closed_at = _now()

    log_event(
        db          = db,
        event_type  = "election_ended",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election.id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(election)
    return election


def archive_election(db: Session, election_id, admin: User, ip=None) -> Election:
    election = get_election(db, election_id)
    if not election:
        raise ElectionError("Election not found.")
    if election.status != "completed":
        raise ElectionError("Only completed elections can be archived.")

    election.status = "archived"

    log_event(
        db          = db,
        event_type  = "election_archived",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election.id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(election)
    return election
