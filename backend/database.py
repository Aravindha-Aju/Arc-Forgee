"""
database.py
-----------
PostgreSQL/SQLite connection setup using SQLAlchemy.
Defaults to SQLite for easy local development.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use SQLite by default for frictionless local development.
# If DATABASE_URL is set (e.g., in Docker), it will use that instead.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./markx.db"
)

# SQLite requires check_same_thread=False for FastAPI async compatibility
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Auto-reconnect on stale connections (Postgres)
    echo=False               # Set True for SQL query debugging
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base for all models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create all tables in the database.
    Call this once at application startup.
    """
    # Import models to ensure they're registered with Base
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

