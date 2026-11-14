"""Shared dependencies: database session and the signed-in user (pattern from
fastapi/full-stack-fastapi-template, MIT)."""
from collections.abc import Generator
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.models import User

bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SessionDep = Annotated[Session, Depends(get_db)]


def get_current_user(db: SessionDep,
                     creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User:
    if creds is None:
        raise AppError(401, "NOT_AUTHENTICATED", "Please sign in.")
    sub = decode_access_token(creds.credentials)
    user = db.get(User, int(sub)) if sub and sub.isdigit() else None
    if user is None:
        raise AppError(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.")
    if not user.is_active:
        raise AppError(403, "INACTIVE", "This account is disabled.")
    now = datetime.now(timezone.utc)
    last = user.last_active_at
    if last is None or (last.replace(tzinfo=timezone.utc) if last.tzinfo is None else last) < now - timedelta(minutes=5):
        user.last_active_at = now
        db.commit()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise AppError(403, "FORBIDDEN", "Admins only.")
    return user


AdminUser = Annotated[User, Depends(get_admin)]


def get_optional_user(db: SessionDep,
                      creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User | None:
    if creds is None:
        return None
    sub = decode_access_token(creds.credentials)
    return db.get(User, int(sub)) if sub and sub.isdigit() else None


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
