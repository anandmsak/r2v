# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/ballot_service.py
# Description: Core voting engine.
#              1. issue_token()  — gives eligible voter a one-time token
#              2. cast_vote()    — records anonymous ballot in hash chain
#
# ANONYMIZATION GUARANTEE:
#   - ballot_tokens links user_id ↔ token_hash (issuance control only)
#   - ballots stores token_ref (same hash) with NO user_id column
#   - Linking voter to vote requires deliberate joining of both tables
#   - Result queries MUST NOT join ballot_tokens

import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ballot_token import BallotToken
from app.models.ballot import Ballot
from app.models.candidate import Candidate
from app.models.election import Election
from app.models.eligibility import VoterEligibility
from app.models.user import User
from app.utils.hashing import (
    hash_token,
    generate_ballot_genesis_hash,
    compute_ballot_hash,
)
from app.services.audit_service import log_event


class BallotError(Exception):
    pass


TOKEN_EXPIRY_MINUTES = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f+00:00")


# ---------------------------------------------------------------------------
# Step 1 — Issue token to eligible voter
# ---------------------------------------------------------------------------

def issue_token(
    db: Session,
    election_id,
    voter: User,
    ip: Optional[str] = None,
) -> str:
    """
    Issues a one-time ballot token to an eligible voter.
    Returns the RAW token (shown to voter once, never stored raw).
    Raises BallotError on any ineligibility condition.
    """
    # 1. Election must be active
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise BallotError("Election not found.")
    if election.status != "active":
        raise BallotError("Election is not currently active.")

    # 2. Voter must be enrolled
    eligibility = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id,
        VoterEligibility.user_id    == voter.id,
    ).first()
    if not eligibility:
        raise BallotError("You are not eligible to vote in this election.")

    # 3. Voter must not have already voted
    if eligibility.has_voted:
        raise BallotError("You have already cast your vote in this election.")

    # 4. Check for existing unused token (reissue same one)
    # 4. Check for existing unused token
    existing_token = db.query(BallotToken).filter(
        BallotToken.election_id == election_id,
        BallotToken.user_id     == voter.id,
        BallotToken.is_used     == False,
    ).first()
    if existing_token:
        if existing_token.expires_at > _now():
            # Valid unexpired token exists — deny reissue
            raise BallotError("A ballot token has already been issued. Use it to cast your vote.")
        else:
            # Expired token — delete it and allow reissue
            db.delete(existing_token)
            db.commit()

    # 5. Generate raw token, store only hash
    raw_token  = secrets.token_hex(32)   # 64-char hex = 256 bits entropy
    token_hash = hash_token(raw_token)
    expires_at = _now() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)

    token_record = BallotToken(
        election_id = election_id,
        user_id     = voter.id,
        token_hash  = token_hash,
        is_used     = False,
        expires_at  = expires_at,
    )
    db.add(token_record)

    log_event(
        db          = db,
        event_type  = "ballot_token_issued",
        actor_id    = voter.id,
        actor_role  = voter.role,
        target_id   = election_id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()

    # Return RAW token — this is the only time it exists in plaintext
    return raw_token


# ---------------------------------------------------------------------------
# Step 2 — Cast vote using token
# ---------------------------------------------------------------------------

def cast_vote(
    db: Session,
    election_id,
    candidate_id,
    raw_token: str,
    ip: Optional[str] = None,
) -> dict:
    """
    Casts an anonymous ballot.
    - Validates raw_token against stored hash
    - Marks token as used
    - Inserts ballot into hash chain
    - Returns receipt_id for voter's records
    NO voter identity is stored in the ballot record.
    """
    # 1. Election must be active
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise BallotError("Election not found.")
    if election.status != "active":
        raise BallotError("Election is not currently active.")

    # 2. Candidate must exist and belong to this election
    candidate = db.query(Candidate).filter(
        Candidate.id          == candidate_id,
        Candidate.election_id == election_id,
        Candidate.is_visible  == True,
    ).first()
    if not candidate:
        raise BallotError("Candidate not found in this election.")

    # 3. Validate token
    token_hash   = hash_token(raw_token)
    token_record = db.query(BallotToken).filter(
        BallotToken.token_hash  == token_hash,
        BallotToken.election_id == election_id,
    ).first()

    if not token_record:
        raise BallotError("Invalid ballot token.")
    if token_record.is_used:
        raise BallotError("This ballot token has already been used.")
    if token_record.expires_at < _now():
        raise BallotError("Ballot token has expired. Request a new one.")

    # 4. Mark token as used
    token_record.is_used = True
    token_record.used_at = _now()

    # 5. Mark voter as having voted (in eligibility table)
    eligibility = db.query(VoterEligibility).filter(
        VoterEligibility.election_id == election_id,
        VoterEligibility.user_id    == token_record.user_id,
    ).first()
    if eligibility:
        eligibility.has_voted = True
        eligibility.voted_at  = _now()

    # 6. Build hash chain
    cast_at  = _now()
    sequence = _get_next_ballot_sequence(db, election_id)
    prev_hash = _get_previous_ballot_hash(db, election_id)

    import uuid
    ballot_id = uuid.uuid4()

    current_hash = compute_ballot_hash(
        ballot_id    = str(ballot_id),
        election_id  = str(election_id),
        candidate_id = str(candidate_id),
        cast_at_iso  = _iso(cast_at),
        previous_hash= prev_hash,
    )

    # 7. Insert ballot — NO voter_id, anonymity is structural
    ballot = Ballot(
        id              = ballot_id,
        election_id     = election_id,
        candidate_id    = candidate_id,
        token_ref       = token_hash,   # links to token but NOT to user
        sequence_number = sequence,
        previous_hash   = prev_hash,
        current_hash    = current_hash,
        cast_at         = cast_at,
    )
    db.add(ballot)
    db.flush()

    log_event(
        db          = db,
        event_type  = "vote_cast",
        actor_id    = None,            # deliberately anonymous
        actor_role  = "voter",
        target_id   = election_id,
        target_type = "election",
        ip_address  = ip,
    )
    db.commit()

    return {
        "receipt_id":    str(ballot.receipt_id),
        "sequence":      sequence,
        "current_hash":  current_hash,
        "cast_at":       _iso(cast_at),
    }


# ---------------------------------------------------------------------------
# Hash chain helpers
# ---------------------------------------------------------------------------

def _get_next_ballot_sequence(db: Session, election_id) -> int:
    result = db.query(func.max(Ballot.sequence_number)).filter(
        Ballot.election_id == election_id
    ).scalar()
    return 1 if result is None else result + 1


def _get_previous_ballot_hash(db: Session, election_id) -> str:
    last = db.query(Ballot).filter(
        Ballot.election_id == election_id
    ).order_by(Ballot.sequence_number.desc()).first()
    if last is None:
        return generate_ballot_genesis_hash(str(election_id))
    return last.current_hash
