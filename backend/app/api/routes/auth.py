"""Registration, login, email verification and password reset."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.errors import AppError
from app.core.ratelimit import auth_rate_limit
from app.core.security import create_access_token, hash_password, hash_token, new_one_time_token, verify_password
from app.models import AuthToken, StudentProfile, User
from app.schemas import (AuthOut, ChangePasswordIn, EmailIn, LoginIn, Message, RegisterIn, RegisterOut,
                         ResetPasswordIn, UserOut, VerifyEmailIn)
from app.services import email as mailer
from app.services.students import user_out

router = APIRouter(prefix="/auth", tags=["auth"])
limited = [Depends(auth_rate_limit)]


def _issue(db, user: User, purpose: str, expires: timedelta) -> str:
    raw, hashed = new_one_time_token()
    db.add(AuthToken(user_id=user.id, purpose=purpose, token_hash=hashed,
                     expires_at=datetime.now(timezone.utc) + expires))
    db.commit()
    return raw


def _consume(db, raw: str, purpose: str) -> User:
    tok = db.scalar(select(AuthToken).where(AuthToken.token_hash == hash_token(raw), AuthToken.purpose == purpose))
    now = datetime.now(timezone.utc)
    expires = tok.expires_at if tok is None or tok.expires_at.tzinfo else tok.expires_at.replace(tzinfo=timezone.utc)
    if tok is None or tok.used_at is not None or expires < now:
        raise AppError(400, "INVALID_TOKEN", "This link is invalid or has expired. Please request a new one.")
    tok.used_at = now
    return db.get(User, tok.user_id)


def _demo(token: str, sent: bool) -> str | None:
    return token if settings.DEMO_MODE and not sent else None


def _session(user: User) -> dict:
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": user_out(user)}


@router.post("/register", response_model=RegisterOut, status_code=201, dependencies=limited)
def register(body: RegisterIn, db: SessionDep):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise AppError(409, "EMAIL_TAKEN", "An account with this email already exists. Try signing in instead.")
    first, _, last = body.name.partition(" ")
    user = User(email=email, hashed_password=hash_password(body.password), first_name=first, last_name=last)
    user.profile = StudentProfile(interests=[])
    db.add(user)
    db.commit()
    token = _issue(db, user, "verify_email", timedelta(hours=settings.VERIFY_TOKEN_EXPIRE_HOURS))
    sent = mailer.verification_email(user.email, token)
    return {"user": user_out(user), "message": "Account created. Please verify your email.",
            "demoToken": _demo(token, sent)}


@router.post("/login", response_model=AuthOut, dependencies=limited)
def login(body: LoginIn, db: SessionDep):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.hashed_password):
        raise AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.")
    if not user.is_active:
        raise AppError(403, "INACTIVE", "This account is disabled.")
    if not user.is_verified:
        raise AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email address before signing in.")
    user.last_active_at = datetime.now(timezone.utc)
    db.commit()
    return _session(user)


@router.post("/verify-email", response_model=AuthOut, dependencies=limited)
def verify_email(body: VerifyEmailIn, db: SessionDep):
    user = _consume(db, body.token, "verify_email")
    if user.email != body.email.lower():
        raise AppError(400, "INVALID_TOKEN", "This link does not match that email address.")
    user.is_verified = True
    db.commit()
    return _session(user)


@router.post("/resend-verification", response_model=Message, dependencies=limited)
def resend_verification(body: EmailIn, db: SessionDep):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    msg = f"If {body.email} needs verifying, we sent a new link."
    if user is None or user.is_verified:
        return {"message": msg}
    token = _issue(db, user, "verify_email", timedelta(hours=settings.VERIFY_TOKEN_EXPIRE_HOURS))
    return {"message": msg, "demoToken": _demo(token, mailer.verification_email(user.email, token))}


@router.post("/forgot-password", response_model=Message, dependencies=limited)
def forgot_password(body: EmailIn, db: SessionDep):
    """Always 200 with the same message, so it never reveals whether an email is registered."""
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    msg = "If an account exists for this email, a reset link is on its way."
    if user is None:
        return {"message": msg}
    token = _issue(db, user, "reset_password", timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES))
    return {"message": msg, "demoToken": _demo(token, mailer.reset_email(user.email, token))}


@router.post("/reset-password", response_model=Message, dependencies=limited)
def reset_password(body: ResetPasswordIn, db: SessionDep):
    user = _consume(db, body.token, "reset_password")
    user.hashed_password = hash_password(body.password)
    user.is_verified = True  # they proved they own the inbox
    db.commit()
    return {"message": "Your password has been reset."}


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user_out(user)


@router.post("/change-password", response_model=Message)
def change_password(body: ChangePasswordIn, user: CurrentUser, db: SessionDep):
    if not verify_password(body.current_password, user.hashed_password):
        raise AppError(400, "WRONG_PASSWORD", "Your current password is incorrect.")
    user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated."}
