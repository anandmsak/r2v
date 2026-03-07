# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/candidate_service.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.election import Election
from app.models.user import User
from app.services.audit_service import log_event


class CandidateError(Exception):
    pass


def _get_active_election(db: Session, election_id) -> Election:
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise CandidateError("Election not found.")
    return election


def add_candidate(
    db: Session,
    election_id,
    full_name: str,
    description: Optional[str],
    position: Optional[str],
    display_order: int,
    admin: User,
    ip: Optional[str] = None,
) -> Candidate:
    election = _get_active_election(db, election_id)
    if election.status == "active":
        raise CandidateError("Cannot add candidates to an active election.")
    if election.status in ("completed", "archived"):
        raise CandidateError("Election is already closed.")

    candidate = Candidate(
        election_id   = election_id,
        full_name     = full_name,
        description   = description,
        position      = position,
        display_order = display_order,
        is_visible    = True,
    )
    db.add(candidate)
    db.flush()

    log_event(
        db          = db,
        event_type  = "candidate_added",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = candidate.id,
        target_type = "candidate",
        metadata    = {"election_id": str(election_id), "name": full_name},
        ip_address  = ip,
    )
    db.commit()
    db.refresh(candidate)
    return candidate


def list_candidates(db: Session, election_id) -> List[Candidate]:
    return db.query(Candidate).filter(
        Candidate.election_id == election_id,
        Candidate.is_visible  == True,
    ).order_by(Candidate.display_order).all()


def update_candidate(
    db: Session,
    candidate_id,
    full_name: Optional[str],
    description: Optional[str],
    position: Optional[str],
    display_order: Optional[int],
    admin: User,
    ip: Optional[str] = None,
) -> Candidate:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise CandidateError("Candidate not found.")

    election = _get_active_election(db, candidate.election_id)
    if election.status == "active":
        raise CandidateError("Cannot edit candidates in an active election.")

    if full_name:     candidate.full_name     = full_name
    if description is not None: candidate.description = description
    if position:      candidate.position      = position
    if display_order is not None: candidate.display_order = display_order

    log_event(
        db          = db,
        event_type  = "candidate_updated",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = candidate.id,
        target_type = "candidate",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(candidate)
    return candidate


def disable_candidate(
    db: Session,
    candidate_id,
    admin: User,
    ip: Optional[str] = None,
) -> Candidate:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise CandidateError("Candidate not found.")

    election = _get_active_election(db, candidate.election_id)
    if election.status == "active":
        raise CandidateError("Cannot disable candidates in an active election.")

    candidate.is_visible = False
    log_event(
        db          = db,
        event_type  = "candidate_disabled",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = candidate.id,
        target_type = "candidate",
        ip_address  = ip,
    )
    db.commit()
    db.refresh(candidate)
    return candidate
