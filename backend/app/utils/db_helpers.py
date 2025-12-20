"""
Database Helper Functions

Utilities for managing database sessions and common query patterns.
"""
from contextlib import contextmanager
from typing import Generator, Optional, Any
from sqlalchemy.orm import Session
from app.core.db import SessionLocal


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    Automatically handles session cleanup.
    
    Usage:
        with get_db_session() as db:
            result = db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def execute_with_db(func, *args, **kwargs) -> Any:
    """
    Execute a function with a database session.
    Automatically manages session lifecycle.
    
    Args:
        func: Function that takes db as first parameter
        *args: Additional positional arguments
        **kwargs: Additional keyword arguments
    
    Returns:
        Result from the function
    """
    with get_db_session() as db:
        return func(db, *args, **kwargs)
