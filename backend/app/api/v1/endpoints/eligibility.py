# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/eligibility.py

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.eligibility import (
    VoterAddSchema, VoterRemoveSchema,
    EligibilityResponseSchema, CSVUploadResultSchema,
)
from app.services.eligibility_service import (
    add_voter, remove_voter, upload_voters_csv,
    list_eligible_voters, EligibilityError,
)

router = APIRouter()


@router.post("/add", response_model=EligibilityResponseSchema, status_code=status.HTTP_201_CREATED)
def add_single_voter(
    payload: VoterAddSchema,
    request: Request,
    db: Session  = Depends(get_db),
    admin: User  = Depends(get_current_admin),
):
    try:
        return add_voter(
            db              = db,
            election_id     = payload.election_id,
            register_number = payload.register_number,
            admin           = admin,
            ip              = request.client.host if request.client else None,
        )
    except EligibilityError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload/{election_id}", response_model=CSVUploadResultSchema)
def upload_csv(
    election_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session      = Depends(get_db),
    admin: User      = Depends(get_current_admin),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files accepted.")
    try:
        content = file.file.read()
        return upload_voters_csv(
            db          = db,
            election_id = election_id,
            csv_content = content,
            admin       = admin,
            ip          = request.client.host if request.client else None,
        )
    except EligibilityError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{election_id}", response_model=List[EligibilityResponseSchema])
def list_voters(
    election_id: str,
    db: Session  = Depends(get_db),
    admin: User  = Depends(get_current_admin),
):
    return list_eligible_voters(db, election_id)


@router.delete("/remove", status_code=status.HTTP_204_NO_CONTENT)
def remove_single_voter(
    payload: VoterRemoveSchema,
    request: Request,
    db: Session  = Depends(get_db),
    admin: User  = Depends(get_current_admin),
):
    try:
        remove_voter(
            db              = db,
            election_id     = payload.election_id,
            register_number = payload.register_number,
            admin           = admin,
            ip              = request.client.host if request.client else None,
        )
    except EligibilityError as e:
        raise HTTPException(status_code=400, detail=str(e))
