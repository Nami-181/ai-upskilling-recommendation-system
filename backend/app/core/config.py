"""Settings read from environment variables (or backend/.env)."""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    PROJECT_NAME: str = "LUMORA API"
    ENVIRONMENT: str = "local"  # local | test | production

    # PostgreSQL in production, e.g. postgresql+psycopg2://lumora:lumora@localhost:5432/lumora
    # SQLite works for quick local runs and unit tests.
    DATABASE_URL: str = "sqlite:///./lumora.db"

    SECRET_KEY: str = "change-me-in-production-please-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    VERIFY_TOKEN_EXPIRE_HOURS: int = 48
    RESET_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    FRONTEND_URL: str = "http://localhost:5173"

    # Without an SMTP server, DEMO_MODE returns verification/reset tokens in the API
    # response so the flow can be demonstrated. Turn it off once SMTP is configured.
    DEMO_MODE: bool = True
    # NFR-011: attempts per client IP per minute on public auth endpoints (0 disables)
    AUTH_RATE_LIMIT_PER_MINUTE: int = 20
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM: str = "no-reply@lumora.app"

    AUTO_CREATE_TABLES: bool = True  # create tables on startup (tests / quick start); use Alembic in production
    SEED_ON_STARTUP: bool = True

    FIRST_ADMIN_EMAIL: str = "admin@lumora.app"
    FIRST_ADMIN_PASSWORD: str = "Admin@2026"

    @field_validator("DATABASE_URL")
    @classmethod
    def normalise_db_url(cls, v: str) -> str:
        # Render / Heroku give postgres://... ; SQLAlchemy needs a driver name.
        if v.startswith("postgres://"):
            v = "postgresql+psycopg2://" + v[len("postgres://"):]
        elif v.startswith("postgresql://"):
            v = "postgresql+psycopg2://" + v[len("postgresql://"):]
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def email_enabled(self) -> bool:
        return bool(self.SMTP_HOST)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
