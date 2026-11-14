"""Password hashing (bcrypt), JWT access tokens and one-time tokens."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:72], hashed.encode())
    except ValueError:
        return False


def create_access_token(subject: str | int, minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(subject), "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM]).get("sub")
    except jwt.PyJWTError:
        return None


def new_one_time_token() -> tuple[str, str]:
    """Returns (raw token for the link, sha256 hash stored in the database)."""
    raw = secrets.token_urlsafe(24)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
