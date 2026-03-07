# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/auth.py
# Description: OTP request and verification endpoints.
#              These are the only public endpoints — all others require JWT.

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.otp_service import request_otp, verify_otp_and_get_user, OTPError
from app.services.audit_service import log_event
from app.core.security import create_access_token
from app.schemas.auth import OTPRequestSchema, OTPVerifySchema, TokenResponseSchema
from app.utils.email import send_otp_email

router = APIRouter()


@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp_endpoint(
    payload: OTPRequestSchema,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Step 1 of authentication.
    Accepts register_number, sends OTP to registered email.
    Always returns the same response regardless of whether
    the register number exists (prevents user enumeration).
    """
    ip = request.client.host if request.client else None

    try:
        raw_otp = request_otp(db, payload.register_number)

        if raw_otp:
            # Get user email for delivery
            from app.models.user import User
            user = db.query(User).filter(
                User.register_number == payload.register_number
            ).first()

            send_otp_email(to_email=user.email, otp=raw_otp, register_number=user.register_number)

            log_event(
                db          = db,
                event_type  = "otp_requested",
                actor_id    = user.id,
                actor_role  = user.role,
                metadata    = {"register_number": payload.register_number},
                ip_address  = ip,
            )
            db.commit()

    except OTPError:
        pass  # Swallow — do not leak reason

    # Always return the same message
    return {"message": "If this register number exists, an OTP has been sent."}


@router.post("/verify-otp", response_model=TokenResponseSchema, status_code=status.HTTP_200_OK)
def verify_otp_endpoint(
    payload: OTPVerifySchema,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Step 2 of authentication.
    Verifies OTP, returns signed JWT on success.
    Returns 401 on any failure without revealing specific reason.
    """
    ip = request.client.host if request.client else None

    try:
        user = verify_otp_and_get_user(db, payload.register_number, payload.otp)
    except OTPError as e:
        log_event(
            db         = db,
            event_type = "otp_failed",
            metadata   = {"register_number": payload.register_number, "reason": str(e)},
            ip_address = ip,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})

    log_event(
        db         = db,
        event_type = "otp_verified",
        actor_id   = user.id,
        actor_role = user.role,
        ip_address = ip,
    )
    db.commit()

    return TokenResponseSchema(
        access_token = token,
        token_type   = "bearer",
        role         = user.role,
        user_id      = str(user.id),
        full_name    = user.full_name,
    )
