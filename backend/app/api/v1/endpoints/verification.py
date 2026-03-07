# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/verification.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_voter, get_current_admin
from app.models.user import User
from app.services.verification_service import verify_receipt, verify_chain

router = APIRouter()


@router.get("/receipt/{receipt_id}")
def check_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    voter: User = Depends(get_current_voter),
):
    """Voter checks their own vote is in the chain."""
    return verify_receipt(db, receipt_id)


@router.get("/chain/{election_id}")
def check_chain(
    election_id: str,
    db: Session  = Depends(get_db),
    admin: User  = Depends(get_current_admin),
):
    """Admin/auditor verifies full chain integrity."""
    return verify_chain(db, election_id)
