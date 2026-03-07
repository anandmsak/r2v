# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/eligibility_service.py

import csv
import io
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.eligibility import VoterEligibility
from app.models.election import Election
from app.services.audit_service import log_event


class EligibilityError(Exception):
    pass


def add_voter(
    db: Session,
    election_id,
    register_number: str,
    admin: User,
    ip: Optional[str] = None,
) -> VoterEligibility:
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise EligibilityError("Election not found.")
    if election.status in ("completed", "archived"):
        raise EligibilityError("Cannot add voters to a closed election.")

    voter = db.query(User).filter(User.register_number == register_number.strip().upper()).first()
    if not voter:
        raise EligibilityError(f"User '{register_number}' not found.")

    existing = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id,
        VoterEligibility.user_id    == voter.id,
    ).first()
    if existing:
        raise EligibilityError(f"Voter '{register_number}' already enrolled.")

    entry = VoterEligibility(
        election_id = election_id,
        user_id     = voter.id,
        uploaded_by = admin.id,
        has_voted   = False,
    )
    db.add(entry)
    db.flush()

    log_event(
        db          = db,
        event_type  = "voter_enrolled",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = voter.id,
        target_type = "user",
        metadata    = {"election_id": str(election_id), "register_number": register_number},
        ip_address  = ip,
    )
    db.commit()
    db.refresh(entry)
    return entry


def upload_voters_csv(
    db: Session,
    election_id,
    csv_content: bytes,
    admin: User,
    ip: Optional[str] = None,
) -> dict:
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise EligibilityError("Election not found.")
    if election.status in ("completed", "archived"):
        raise EligibilityError("Cannot add voters to a closed election.")

    text   = csv_content.decode("utf-8-sig").strip()
    reader = csv.DictReader(io.StringIO(text))
    rows   = list(reader)

    if not rows:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        rows  = [{"register_number": l} for l in lines]

    enrolled           = 0
    skipped_duplicate  = 0
    skipped_not_found  = 0
    error_rows         = []

    for i, row in enumerate(rows, start=1):
        reg = (row.get("register_number") or row.get("Register Number") or "").strip().upper()
        if not reg:
            error_rows.append({"row": i, "reason": "Empty register number"})
            continue

        voter = db.query(User).filter(User.register_number == reg).first()
        if not voter:
            skipped_not_found += 1
            error_rows.append({"row": i, "register_number": reg, "reason": "User not found"})
            continue

        existing = db.query(VoterEligibility).filter(
            VoterEligibility.election_id == election_id,
            VoterEligibility.user_id    == voter.id,
        ).first()
        if existing:
            skipped_duplicate += 1
            continue

        entry = VoterEligibility(
            election_id = election_id,
            user_id     = voter.id,
            uploaded_by = admin.id,
            has_voted   = False,
        )
        db.add(entry)
        try:
            db.flush()
            enrolled += 1
        except IntegrityError:
            db.rollback()
            skipped_duplicate += 1
            continue

    log_event(
        db          = db,
        event_type  = "voters_csv_uploaded",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election_id,
        target_type = "election",
        metadata    = {
            "enrolled":          enrolled,
            "skipped_duplicate": skipped_duplicate,
            "skipped_not_found": skipped_not_found,
        },
        ip_address  = ip,
    )
    db.commit()

    return {
        "enrolled":          enrolled,
        "skipped_duplicate": skipped_duplicate,
        "skipped_not_found": skipped_not_found,
        "errors":            error_rows,
    }


def list_eligible_voters(db: Session, election_id) -> list:
    return db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id
    ).all()


def is_voter_eligible(db: Session, election_id, user_id) -> bool:
    entry = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id,
        VoterEligibility.user_id    == user_id,
    ).first()
    return entry is not None and not entry.has_voted


def remove_voter(
    db: Session,
    election_id,
    register_number: str,
    admin: User,
    ip: Optional[str] = None,
) -> None:
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise EligibilityError("Election not found.")
    if election.status == "active":
        raise EligibilityError("Cannot remove voters from an active election.")

    voter = db.query(User).filter(User.register_number == register_number.strip().upper()).first()
    if not voter:
        raise EligibilityError(f"User '{register_number}' not found.")

    entry = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id,
        VoterEligibility.user_id    == voter.id,
    ).first()
    if not entry:
        raise EligibilityError("Voter not enrolled in this election.")

    db.delete(entry)
    log_event(
        db          = db,
        event_type  = "voter_removed",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = voter.id,
        target_type = "user",
        metadata    = {"election_id": str(election_id), "register_number": register_number},
        ip_address  = ip,
    )
    db.commit()
