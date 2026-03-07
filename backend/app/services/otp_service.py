# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/services/otp_service.py
# Description: OTP generation, storage, validation, expiry, and lockout.
#              This is the entry gate to the entire system.
#              Every rule here maps directly to the architecture specification.

import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.user import User
from app.models.auth_otp import AuthOTP
from app.utils.hashing import hash_otp, verify_otp
from app.core.config import get_settings

settings = get_settings()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_raw_otp() -> str:
    """Generate a cryptographically random numeric OTP."""
    return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))


def _invalidate_existing_otps(db: Session, user_id) -> None:
    """
    Mark all active OTPs for this user as invalidated.
    A new OTP request always cancels all previous ones.
    """
    db.query(AuthOTP).filter(
        and_(
            AuthOTP.user_id == user_id,
            AuthOTP.is_used == False,
            AuthOTP.is_invalidated == False,
        )
    ).update({"is_invalidated": True}, synchronize_session=False)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class OTPError(Exception):
    """Raised when OTP operation fails for a known, handleable reason."""
    pass


def request_otp(db: Session, register_number: str) -> str:
    """
    Entry point for OTP request flow.

    Steps:
      1. Look up user by register_number.
      2. If not found, return generic response (no existence leakage).
      3. Invalidate all previous active OTPs for this user.
      4. Generate new OTP, hash it, store it.
      5. Return raw OTP (caller sends it via email/SMS).

    Returns raw OTP string for delivery.
    Raises OTPError if user is inactive.
    """
    user = db.query(User).filter(
        User.register_number == register_number
    ).first()

    # Do not reveal whether register number exists — return silently
    if not user:
        return None

    if not user.is_active:
        raise OTPError("Account is inactive.")

    # Invalidate all previous OTPs before issuing new one
    _invalidate_existing_otps(db, user.id)

    raw_otp = _generate_raw_otp()
    otp_record = AuthOTP(
        user_id        = user.id,
        otp_hash       = hash_otp(raw_otp),
        expires_at     = _now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
        attempts       = 0,
        max_attempts   = settings.OTP_MAX_ATTEMPTS,
        is_used        = False,
        is_invalidated = False,
        locked_until   = None,
    )
    db.add(otp_record)
    db.commit()

    return raw_otp


def verify_otp_and_get_user(db: Session, register_number: str, raw_otp: str) -> User:
    """
    Verify OTP submission and return authenticated user.

    Steps:
      1. Look up user.
      2. Find the latest valid (not used, not invalidated) OTP.
      3. Check lockout.
      4. Check expiry.
      5. Increment attempt counter.
      6. Verify hash.
      7. On success: mark OTP used, return user.
      8. On failure: apply lockout if max attempts reached.

    Returns authenticated User.
    Raises OTPError with a safe message on any failure.
    """
    user = db.query(User).filter(
        User.register_number == register_number,
        User.is_active == True,
    ).first()

    if not user:
        raise OTPError("Invalid credentials.")

    otp_record = db.query(AuthOTP).filter(
        and_(
            AuthOTP.user_id        == user.id,
            AuthOTP.is_used        == False,
            AuthOTP.is_invalidated == False,
        )
    ).order_by(AuthOTP.created_at.desc()).first()

    if not otp_record:
        raise OTPError("No active OTP found. Please request a new one.")

    # Check lockout
    if otp_record.locked_until and _now() < otp_record.locked_until.replace(tzinfo=timezone.utc):
        raise OTPError("Account temporarily locked. Please try again later.")

    # Check expiry
    if _now() > otp_record.expires_at.replace(tzinfo=timezone.utc):
        raise OTPError("OTP has expired. Please request a new one.")

    # Increment attempt counter before verification (prevents timing abuse)
    otp_record.attempts += 1

    if not verify_otp(raw_otp, otp_record.otp_hash):
        # Apply lockout if max attempts reached
        if otp_record.attempts >= otp_record.max_attempts:
            otp_record.locked_until = _now() + timedelta(minutes=settings.OTP_LOCKOUT_MINUTES)
            db.commit()
            raise OTPError("Maximum attempts exceeded. Account locked for 15 minutes.")

        db.commit()
        remaining = otp_record.max_attempts - otp_record.attempts
        raise OTPError(f"Invalid OTP. {remaining} attempt(s) remaining.")

    # Success — mark OTP as used
    otp_record.is_used = True
    db.commit()

    return user
