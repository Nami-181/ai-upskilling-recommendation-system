import os
import tempfile
import uuid
from pathlib import Path

import pytest

# Point the app at a throwaway database before it is imported.
# CI sets DATABASE_URL to a PostgreSQL service instead.
if "DATABASE_URL" not in os.environ:
    _tmp = Path(tempfile.mkdtemp()) / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.as_posix()}"
os.environ.setdefault("DEMO_MODE", "true")
os.environ.setdefault("SMTP_HOST", "")
os.environ.setdefault("AUTH_RATE_LIMIT_PER_MINUTE", "1000")

from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "Passw0rd!"


@pytest.fixture(scope="session")
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c


def register(client, name="Test Student", password=PASSWORD):
    email = f"{uuid.uuid4().hex[:10]}@example.com"
    r = client.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert r.status_code == 201, r.text
    return email, r.json()["demoToken"]


@pytest.fixture
def student(client):
    """A verified student with a profile. Returns (headers, email)."""
    email, token = register(client)
    r = client.post("/auth/verify-email", json={"email": email, "token": token})
    assert r.status_code == 200, r.text
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.put("/profile", headers=headers, json={
        "program": "B.Tech CSE", "institution": "Test College", "year": 3, "targetRoleId": "data-scientist",
        "weeklyHoursGoal": 8, "preferredResourceType": "course", "onboardingComplete": True,
        "skills": [{"skill_id": "python", "level": 3}, {"skill_id": "sql", "level": 1}]})
    assert r.status_code == 200, r.text
    return headers, email


@pytest.fixture
def admin(client):
    r = client.post("/auth/login", json={"email": "admin@lumora.app", "password": "Admin@2026"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
