"""Outgoing email. Uses SMTP when configured, otherwise logs the message (DEMO_MODE)."""
import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode

from app.core.config import settings

log = logging.getLogger("lumora.email")


def send(to: str, subject: str, body: str) -> bool:
    if not settings.email_enabled:
        log.info("Email to %s | %s\n%s", to, subject, body)
        return False
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = settings.EMAILS_FROM, to, subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as s:
            s.starttls()
            if settings.SMTP_USER:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.send_message(msg)
        return True
    except (OSError, smtplib.SMTPException):
        log.exception("Could not send email to %s", to)
        return False


def verification_email(to: str, token: str) -> bool:
    link = f"{settings.FRONTEND_URL}/verify-email?" + urlencode({"email": to, "token": token})
    return send(to, "Verify your LUMORA email", f"Welcome to LUMORA!\n\nConfirm your email: {link}\n")


def reset_email(to: str, token: str) -> bool:
    link = f"{settings.FRONTEND_URL}/reset-password?" + urlencode({"token": token})
    return send(to, "Reset your LUMORA password",
                f"Someone asked to reset your password. If it was you, open: {link}\n"
                f"The link expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.\n")
