# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# Import all models here so SQLAlchemy and Alembic can discover them.

from app.models.user import User
from app.models.auth_otp import AuthOTP
from app.models.election import Election
from app.models.candidate import Candidate
from app.models.eligibility import VoterEligibility
from app.models.ballot_token import BallotToken
from app.models.ballot import Ballot
from app.models.audit_log import AuditLog
from app.models.result_snapshot import ResultSnapshot
