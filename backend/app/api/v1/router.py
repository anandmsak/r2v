# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/api/v1/router.py
# Description: Main v1 API router — mounts all endpoint modules.

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    elections,
    candidates,
    eligibility,
    ballot,
    results,
    verification,
)

api_router = APIRouter()

api_router.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
api_router.include_router(elections.router,    prefix="/elections",    tags=["Elections"])
api_router.include_router(candidates.router,   prefix="/candidates",   tags=["Candidates"])
api_router.include_router(eligibility.router,  prefix="/eligibility",  tags=["Eligibility"])
api_router.include_router(ballot.router,       prefix="/ballot",       tags=["Ballot"])
api_router.include_router(results.router,      prefix="/results",      tags=["Results"])
api_router.include_router(verification.router, prefix="/verify",       tags=["Verification"])
