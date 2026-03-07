# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/result_service.py

import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ballot import Ballot
from app.models.candidate import Candidate
from app.models.election import Election
from app.models.eligibility import VoterEligibility
from app.models.result_snapshot import ResultSnapshot
from app.models.user import User
from app.services.audit_service import log_event
from app.services.verification_service import verify_chain



class ResultError(Exception):
    pass


def _now():
    return datetime.now(timezone.utc)


def tally_results(db: Session, election_id: str) -> dict:
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise ResultError("Election not found.")

    counts = db.query(
        Ballot.candidate_id,
        func.count(Ballot.id).label("votes")
    ).filter(
        Ballot.election_id == election_id
    ).group_by(Ballot.candidate_id).all()

    vote_map   = {str(row.candidate_id): row.votes for row in counts}
    candidates = db.query(Candidate).filter(
        Candidate.election_id == election_id,
        Candidate.is_visible  == True,
    ).order_by(Candidate.display_order).all()

    total_votes    = sum(vote_map.values())
    total_eligible = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id
    ).count()

    turnout = round((total_votes / total_eligible * 100), 2) if total_eligible > 0 else 0.0
    results = []
    winner  = None
    max_votes = -1

    for c in candidates:
        votes = vote_map.get(str(c.id), 0)
        pct   = round((votes / total_votes * 100), 2) if total_votes > 0 else 0.0
        results.append({
            "candidate_id": str(c.id),
            "full_name":    c.full_name,
            "position":     c.position,
            "votes":        votes,
            "percentage":   pct,
        })
        if votes > max_votes:
            max_votes = votes
            winner    = c.full_name
        elif votes == max_votes:
            winner    = "Draw"

    return {
        "election_id":     election_id,
        "election_title":  election.title,
        "status":          election.status,
        "total_eligible":  total_eligible,
        "total_votes":     total_votes,
        "turnout_percent": turnout,
        "results":         results,
        "winner":          winner if election.status in ("completed", "archived") else None,
        "tallied_at":      _now().isoformat(),
    }


def save_snapshot(
    db: Session,
    election_id: str,
    admin: User,
    ip: str = None,
) -> dict:
    """
    Saves one ResultSnapshot row per candidate.
    DB schema: (election_id, candidate_id) unique per row.
    """
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise ResultError("Election not found.")

    tally        = tally_results(db, election_id)
    chain_result = verify_chain(db, election_id)
    chain_hash   = chain_result.get("message", "")[:64] if chain_result["chain_valid"] else "INVALID"

    total_votes    = tally["total_votes"]
    total_eligible = tally["total_eligible"]

    saved = 0
    for row in tally["results"]:
        # Upsert — delete existing then insert
        existing = db.query(ResultSnapshot).filter(
            ResultSnapshot.election_id  == election_id,
            ResultSnapshot.candidate_id == row["candidate_id"],
        ).first()
        if existing:
            existing.vote_count          = row["votes"]
            existing.total_votes         = total_votes
            existing.total_eligible      = total_eligible
            existing.chain_hash_at_tally = chain_hash
            existing.generated_by        = admin.id
        else:
            snap = ResultSnapshot(
                id                  = uuid.uuid4(),
                election_id         = election_id,
                candidate_id        = row["candidate_id"],
                vote_count          = row["votes"],
                total_votes         = total_votes,
                total_eligible      = total_eligible,
                chain_hash_at_tally = chain_hash,
                generated_by        = admin.id,
            )
            db.add(snap)
        saved += 1

    log_event(
        db          = db,
        event_type  = "result_snapshot_saved",
        actor_id    = admin.id,
        actor_role  = admin.role,
        target_id   = election_id,
        target_type = "election",
        metadata    = {"total_votes": total_votes, "chain_valid": chain_result["chain_valid"]},
        ip_address  = ip,
    )
    db.commit()
    return {"message": f"Snapshot saved for {saved} candidates.", "chain_valid": chain_result["chain_valid"]}


def get_snapshot(db: Session, election_id: str) -> list:
    return db.query(ResultSnapshot).filter(
        ResultSnapshot.election_id == election_id
    ).all()
