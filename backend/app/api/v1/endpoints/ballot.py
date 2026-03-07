# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/endpoints/ballot.py

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_voter
from app.models.user import User
from app.schemas.ballot import (
    TokenRequestSchema, TokenResponseSchema,
    VoteCastSchema, VoteReceiptSchema,
)
from app.services.ballot_service import issue_token, cast_vote, BallotError, TOKEN_EXPIRY_MINUTES

router = APIRouter()


@router.post("/token", response_model=TokenResponseSchema)
def request_token(
    payload: TokenRequestSchema,
    request: Request,
    db: Session  = Depends(get_db),
    voter: User  = Depends(get_current_voter),
):
    """
    Voter requests a one-time ballot token.
    Token is returned once in plaintext — voter must use it immediately.
    """
    try:
        raw_token = issue_token(
            db          = db,
            election_id = payload.election_id,
            voter       = voter,
            ip          = request.client.host if request.client else None,
        )
        return TokenResponseSchema(
            token      = raw_token,
            expires_in = TOKEN_EXPIRY_MINUTES * 60,
            message    = "Token issued. Use it to cast your vote. Valid for 30 minutes.",
        )
    except BallotError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cast", response_model=VoteReceiptSchema, status_code=status.HTTP_201_CREATED)
def cast(
    payload: VoteCastSchema,
    request: Request,
    db: Session  = Depends(get_db),
    voter: User  = Depends(get_current_voter),
):
    """
    Cast a vote using a ballot token.
    Returns a receipt with receipt_id and hash for verification.
    The ballot is stored with NO voter identity — anonymity is structural.
    """
    try:
        result = cast_vote(
            db           = db,
            election_id  = payload.election_id,
            candidate_id = payload.candidate_id,
            raw_token    = payload.token,
            ip           = request.client.host if request.client else None,
        )
        return VoteReceiptSchema(
            receipt_id   = result["receipt_id"],
            sequence     = result["sequence"],
            current_hash = result["current_hash"],
            cast_at      = result["cast_at"],
            message      = "Vote cast successfully. Keep your receipt_id for verification.",
        )
    except BallotError as e:
        raise HTTPException(status_code=400, detail=str(e))
