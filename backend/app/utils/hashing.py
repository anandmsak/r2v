# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/utils/hashing.py
# Description: SHA-256 hashing utilities used across ballot chain,
#              audit chain, OTP hashing, and token anonymization.
#              All hash inputs are deterministically serialised before hashing.

import hashlib
import secrets


def sha256_hex(value: str) -> str:
    """
    Returns lowercase hex SHA-256 digest of a UTF-8 string.
    This is the single hashing function used everywhere in R2V.
    """
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hash_otp(otp: str) -> str:
    """Hash a raw OTP for storage. Never store raw OTP."""
    return sha256_hex(otp)


def verify_otp(raw_otp: str, stored_hash: str) -> bool:
    """Constant-time comparison to verify OTP against stored hash."""
    return secrets.compare_digest(sha256_hex(raw_otp), stored_hash)


def hash_token(raw_token: str) -> str:
    """
    Hash a raw ballot token for storage and reference.
    token_hash stored in ballot_tokens.token_hash
    token_ref stored in ballots.token_ref
    Both are SHA-256(raw_token) — linking them requires deliberate action.
    """
    return sha256_hex(raw_token)


def generate_ballot_genesis_hash(election_id: str) -> str:
    """
    Computes the genesis previous_hash for the first ballot in an election.
    Spec: SHA-256('R2V_GENESIS_' || election_id)
    """
    return sha256_hex(f"R2V_GENESIS_{election_id}")


def compute_ballot_hash(
    ballot_id: str,
    election_id: str,
    candidate_id: str,
    cast_at_iso: str,
    previous_hash: str,
) -> str:
    """
    Computes current_hash for a ballot record.
    Spec: SHA-256(ballot_id || election_id || candidate_id || cast_at_iso || previous_hash)
    Fields joined with '|' separator to prevent collision between field values.
    """
    payload = "|".join([ballot_id, election_id, candidate_id, cast_at_iso, previous_hash])
    return sha256_hex(payload)


def generate_audit_genesis_hash() -> str:
    """
    Computes the genesis previous_hash for the first audit log record.
    Spec: SHA-256('R2V_AUDIT_GENESIS')
    """
    return sha256_hex("R2V_AUDIT_GENESIS")


def compute_audit_hash(
    log_id: str,
    event_type: str,
    actor_id: str,
    target_id: str,
    event_at_iso: str,
    previous_hash: str,
) -> str:
    """
    Computes current_hash for an audit log record.
    Spec: SHA-256(log_id || event_type || actor_id || target_id || event_at_iso || previous_hash)
    Empty actor/target represented as empty string, not NULL, for determinism.
    """
    payload = "|".join([log_id, event_type, actor_id, target_id, event_at_iso, previous_hash])
    return sha256_hex(payload)
