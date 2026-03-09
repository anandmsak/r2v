# Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/auth.py
# UPDATED: Added /check-user endpoint + /admin/register endpoint

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr

from app.db.session import get_db
from app.services.otp_service import request_otp, verify_otp_and_get_user, OTPError
from app.services.audit_service import log_event
from app.core.security import create_access_token
from app.schemas.auth import OTPRequestSchema, OTPVerifySchema, TokenResponseSchema
from app.utils.email import send_otp_email
from app.models.user import User

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# EXISTING: Step 1 — Request OTP
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp_endpoint(
    payload: OTPRequestSchema,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    try:
        raw_otp = request_otp(db, payload.register_number)
        # ── inside request_otp_endpoint ──
        if raw_otp:
            user = db.query(User).filter(
                User.register_number == payload.register_number
            ).first()
            try:
                send_otp_email(user.email, raw_otp, payload.register_number)
            except Exception as e:
                # Even if email fails, OTP is still printed to console
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"OTP email failed: {e}")

            log_event(
                db=db, event_type="otp_requested", actor_id=user.id,
                actor_role=user.role,
                metadata={"register_number": payload.register_number},
                ip_address=ip,
            )
            db.commit()

    except OTPError:
        pass  # Swallow — do not leak reason
    return {"message": "If this register number exists, an OTP has been sent."}


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Check if register number exists in DB — returns role or 404
# Used by frontend login page to decide: proceed to OTP or show "not found"
# ─────────────────────────────────────────────────────────────────────────────
class CheckUserSchema(BaseModel):
    register_number: str = Field(..., min_length=1, max_length=50)


@router.post("/check-user", status_code=status.HTTP_200_OK)
def check_user_endpoint(
    payload: CheckUserSchema,
    db: Session = Depends(get_db),
):
    """
    Checks whether a register number exists in the users table.
    Returns role if found, raises 404 if not.
    Does NOT send OTP — only used for UI routing decision.
    """
    user = db.query(User).filter(
        User.register_number == payload.register_number.upper().strip(),
        User.is_active == True,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this register number.",
        )

    return {"exists": True, "role": user.role}


# ─────────────────────────────────────────────────────────────────────────────
# EXISTING: Step 2 — Verify OTP
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/verify-otp", response_model=TokenResponseSchema, status_code=status.HTTP_200_OK)
def verify_otp_endpoint(
    payload: OTPVerifySchema,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    try:
        user = verify_otp_and_get_user(db, payload.register_number, payload.otp)
    except OTPError as e:
        log_event(
            db=db, event_type="otp_failed",
            metadata={"register_number": payload.register_number, "reason": str(e)},
            ip_address=ip,
        )
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    token = create_access_token({"sub": str(user.id), "role": user.role})
    log_event(db=db, event_type="otp_verified", actor_id=user.id, actor_role=user.role, ip_address=ip)
    db.commit()

    return TokenResponseSchema(
        access_token=token, token_type="bearer",
        role=user.role, user_id=str(user.id), full_name=user.full_name,
    )


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Admin self-registration
# Only works if NO admin exists yet (bootstrap), OR with a secret invite key.
# This prevents random people from creating admin accounts.
# ─────────────────────────────────────────────────────────────────────────────
class AdminRegisterSchema(BaseModel):
    register_number: str        = Field(..., min_length=1, max_length=50)
    full_name:       str        = Field(..., min_length=2, max_length=255)
    email:           EmailStr
    department:      str | None = Field(None, max_length=100)
    # Secret key required — set ADMIN_REGISTER_KEY in backend .env
    invite_key:      str        = Field(..., min_length=6)


@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
def admin_register_endpoint(
    payload: AdminRegisterSchema,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Creates a new admin account.
    Protected by ADMIN_REGISTER_KEY from .env — not open to the public.
    """
    from app.core.config import get_settings
    settings = get_settings()

    # Validate invite key
    expected_key = getattr(settings, "ADMIN_REGISTER_KEY", None)
    if not expected_key or payload.invite_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid invite key. Contact your system administrator.",
        )

    reg = payload.register_number.upper().strip()

    # Check for duplicate register number
    existing = db.query(User).filter(User.register_number == reg).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This register number is already registered.",
        )

    # Check for duplicate email
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered.",
        )

    new_admin = User(
        register_number=reg,
        full_name=payload.full_name,
        email=payload.email,
        department=payload.department,
        role="admin",
        is_active=True,
    )
    db.add(new_admin)

    log_event(
        db=db, event_type="admin_registered",
        metadata={"register_number": reg, "email": payload.email},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return {
        "message": "Admin account created successfully.",
        "register_number": reg,
        "role": "admin",
    }
