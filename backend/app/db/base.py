# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/db/base.py
# Description: SQLAlchemy declarative base. All models inherit from Base.

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
