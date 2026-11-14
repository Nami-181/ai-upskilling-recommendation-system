"""SQLAlchemy engine, session factory and declarative base."""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def make_engine(url: str):
    kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    eng = create_engine(url, **kwargs)
    if url.startswith("sqlite"):
        @event.listens_for(eng, "connect")
        def _fk_on(dbapi_conn, _):  # enforce foreign keys like PostgreSQL does
            dbapi_conn.execute("PRAGMA foreign_keys=ON")
    return eng


engine = make_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
