"""LUMORA API: FastAPI application entry point.

    uvicorn app.main:app --reload        (from backend/)
    Interactive docs: http://localhost:8000/docs
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.deps import SessionDep
from app.api.routes import admin, auth, catalog, profile, progress, recommendations
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.seed import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db(create_tables=settings.AUTO_CREATE_TABLES, seed=settings.SEED_ON_STARTUP)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend for LUMORA, the AI-Powered Upskilling Recommendation and Automation System for Students.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)

for r in (auth.router, profile.router, catalog.router, recommendations.router, progress.router, admin.router):
    app.include_router(r)


@app.get("/health", tags=["system"])
def health(db: SessionDep):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": db.get_bind().dialect.name}
