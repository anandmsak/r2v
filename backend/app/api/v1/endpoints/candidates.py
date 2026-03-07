# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/candidates.py

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.candidate import CandidateCreateSchema, CandidateUpdateSchema, CandidateResponseSchema
from app.services.candidate_service import (
    add_candidate, list_candidates, update_candidate,
    disable_candidate, CandidateError,
)

router = APIRouter()


@router.post("/", response_model=CandidateResponseSchema, status_code=status.HTTP_201_CREATED)
def create(
    payload: CandidateCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return add_candidate(
            db            = db,
            election_id   = payload.election_id,
            full_name     = payload.full_name,
            description   = payload.description,
            position      = payload.position,
            display_order = payload.display_order,
            admin         = admin,
            ip            = request.client.host if request.client else None,
        )
    except CandidateError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{election_id}", response_model=List[CandidateResponseSchema])
def list_for_election(
    election_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return list_candidates(db, election_id)


@router.put("/{candidate_id}", response_model=CandidateResponseSchema)
def update(
    candidate_id: str,
    payload: CandidateUpdateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return update_candidate(
            db            = db,
            candidate_id  = candidate_id,
            full_name     = payload.full_name,
            description   = payload.description,
            position      = payload.position,
            display_order = payload.display_order,
            admin         = admin,
            ip            = request.client.host if request.client else None,
        )
    except CandidateError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{candidate_id}", response_model=CandidateResponseSchema)
def disable(
    candidate_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return disable_candidate(
            db           = db,
            candidate_id = candidate_id,
            admin        = admin,
            ip           = request.client.host if request.client else None,
        )
    except CandidateError as e:
        raise HTTPException(status_code=400, detail=str(e))
