# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/elections.py

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.dependencies import get_current_admin, get_current_voter
from app.models.user import User
from app.schemas.election import (
    ElectionCreateSchema,
    ElectionUpdateSchema,
    ElectionResponseSchema,
)
from app.services.election_service import (
    create_election,
    get_election,
    list_elections,
    update_election,
    start_election,
    end_election,
    archive_election,
    ElectionError,
)

router = APIRouter()


@router.post(
    "/", response_model=ElectionResponseSchema, status_code=status.HTTP_201_CREATED
)
def create(
    payload: ElectionCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return create_election(
            db=db,
            title=payload.title,
            description=payload.description,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            admin=admin,
            ip=request.client.host if request.client else None,
        )
    except ElectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ElectionResponseSchema])
def list_all(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return list_elections(db, status)


@router.get("/active", response_model=List[ElectionResponseSchema])
def list_active_for_voter(
    db: Session = Depends(get_db),
    voter: User = Depends(get_current_voter),
):
    """Voter-facing endpoint — returns only active elections."""
    return list_elections(db, status="active")


@router.get("/{election_id}", response_model=ElectionResponseSchema)
def get_one(
    election_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    election = get_election(db, election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found.")
    return election


@router.put("/{election_id}", response_model=ElectionResponseSchema)
def update(
    election_id: str,
    payload: ElectionUpdateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return update_election(
            db=db,
            election_id=election_id,
            title=payload.title,
            description=payload.description,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
            admin=admin,
            ip=request.client.host if request.client else None,
        )
    except ElectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{election_id}/start", response_model=ElectionResponseSchema)
def start(
    election_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return start_election(
            db, election_id, admin, request.client.host if request.client else None
        )
    except ElectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{election_id}/end", response_model=ElectionResponseSchema)
def end(
    election_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return end_election(
            db, election_id, admin, request.client.host if request.client else None
        )
    except ElectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{election_id}/archive", response_model=ElectionResponseSchema)
def archive(
    election_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return archive_election(
            db, election_id, admin, request.client.host if request.client else None
        )
    except ElectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


from fastapi import UploadFile, File
import csv



@router.post("/{election_id}/eligibility/upload")
async def upload_eligibility_csv(
    election_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),  # only admins can upload
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    contents = await file.read()
    decoded = contents.decode("utf-8").splitlines()
    reader = csv.reader(decoded)

    inserted, skipped = 0, 0
    for row in reader:
        if not row:
            continue
        register_number = row[0].strip()
        try:
            entry = Eligibility(
                election_id=election_id, register_number=register_number
            )
            db.add(entry)
            inserted += 1
        except Exception:
            skipped += 1
    db.commit()

    return {"inserted": inserted, "skipped": skipped}
