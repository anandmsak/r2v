# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/verification_service.py

from sqlalchemy.orm import Session
from app.models.ballot import Ballot
from app.models.candidate import Candidate
from app.utils.hashing import compute_ballot_hash, generate_ballot_genesis_hash
from datetime import timezone


def _iso(dt) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00")


def verify_receipt(db: Session, receipt_id: str) -> dict:
    """
    Voter-facing: confirm their specific ballot is in the chain.
    Returns position and hash — does NOT reveal candidate chosen.
    """
    ballot = db.query(Ballot).filter(
        Ballot.receipt_id == receipt_id
    ).first()

    if not ballot:
        return {
            "found":      False,
            "receipt_id": receipt_id,
            "message":    "No ballot found with this receipt ID.",
        }

    # Recompute hash to confirm it hasn't been tampered with
    recomputed = compute_ballot_hash(
        ballot_id     = str(ballot.id),
        election_id   = str(ballot.election_id),
        candidate_id  = str(ballot.candidate_id),
        cast_at_iso   = _iso(ballot.cast_at),
        previous_hash = ballot.previous_hash,
    )
    is_valid = recomputed == ballot.current_hash

    return {
        "found":        True,
        "receipt_id":   str(ballot.receipt_id),
        "sequence":     ballot.sequence_number,
        "current_hash": ballot.current_hash,
        "hash_valid":   is_valid,
        "cast_at":      _iso(ballot.cast_at),
        "message":      "Your vote is in the chain and hash is valid." if is_valid
                        else "WARNING: Hash mismatch detected. Chain may be compromised.",
    }


def verify_chain(db: Session, election_id: str) -> dict:
    """
    Admin/auditor: verify full chain integrity for an election.
    Walks every ballot in sequence order, recomputes each hash,
    checks linkage to previous ballot.
    """
    ballots = db.query(Ballot).filter(
        Ballot.election_id == election_id
    ).order_by(Ballot.sequence_number).all()

    if not ballots:
        return {
            "election_id":   election_id,
            "total_ballots": 0,
            "chain_valid":   True,
            "message":       "No ballots cast in this election.",
            "broken_at":     None,
        }

    total        = len(ballots)
    broken_at    = None
    prev_hash    = generate_ballot_genesis_hash(election_id)

    for ballot in ballots:
        # Check previous_hash linkage
        if ballot.previous_hash != prev_hash:
            broken_at = ballot.sequence_number
            break

        # Recompute current hash
        recomputed = compute_ballot_hash(
            ballot_id     = str(ballot.id),
            election_id   = str(ballot.election_id),
            candidate_id  = str(ballot.candidate_id),
            cast_at_iso   = _iso(ballot.cast_at),
            previous_hash = ballot.previous_hash,
        )
        if recomputed != ballot.current_hash:
            broken_at = ballot.sequence_number
            break

        prev_hash = ballot.current_hash

    chain_valid = broken_at is None
    return {
        "election_id":   election_id,
        "total_ballots": total,
        "chain_valid":   chain_valid,
        "broken_at":     broken_at,
        "message":       f"Chain intact. {total} ballots verified." if chain_valid
                         else f"Chain BROKEN at sequence {broken_at}. Tampering detected.",
    }
