# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/results.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.services.result_service import tally_results, save_snapshot, get_snapshot, ResultError

router = APIRouter()


@router.get("/{election_id}")
def get_results(
    election_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return tally_results(db, election_id)
    except ResultError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{election_id}/public")
def get_public_results(
    election_id: str,
    db: Session = Depends(get_db),
):
    try:
        from app.models.election import Election
        election = db.query(Election).filter(Election.id == election_id).first()
        if not election:
            raise HTTPException(status_code=404, detail="Election not found.")
        if election.status not in ("completed", "archived"):
            raise HTTPException(status_code=403, detail="Results not yet available.")
        return tally_results(db, election_id)
    except ResultError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{election_id}/snapshot")
def create_snapshot(
    election_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return save_snapshot(
            db          = db,
            election_id = election_id,
            admin       = admin,
            ip          = request.client.host if request.client else None,
        )
    except ResultError as e:
        raise HTTPException(status_code=400, detail=str(e))
