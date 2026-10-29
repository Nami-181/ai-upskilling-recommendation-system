"""Render every page for each role with Streamlit's AppTest and check there are no exceptions."""
import pytest
from streamlit.testing.v1 import AppTest

from upskill import auth, db


@pytest.fixture
def app(tmp_path, monkeypatch):
    monkeypatch.setenv("UPSKILL_DB", str(tmp_path / "app.db"))
    at = AppTest.from_file("app.py", default_timeout=60)
    at.run()
    return at


def login_as(at, email):
    conn = db.connect()
    db.init_db(conn)
    at.session_state["user"] = auth.login(conn, email, email.split("@")[0] + "123")
    at.run()
    return at


def visit_all(at):
    pages = at.sidebar.radio[0].options
    for page in pages:
        at.sidebar.radio[0].set_value(page).run()
        assert not at.exception, f"{page}: {at.exception}"
    return pages


def test_login_page_renders(app):
    assert not app.exception
    assert "SkillPath AI" in app.title[0].value


def test_student_flow(app):
    at = login_as(app, "student@demo.com")
    at.sidebar.radio[0].set_value("Learning path").run()
    gen = next(b for b in at.button if b.label in ("Generate my path", "Regenerate path"))
    gen.click().run()
    assert not at.exception
    assert any("Estimated finish" == m.label for m in at.metric)
    visit_all(at)


def test_mentor_and_admin_pages(app):
    visit_all(login_as(app, "mentor@demo.com"))
    at = AppTest.from_file("app.py", default_timeout=60)
    at.run()
    visit_all(login_as(at, "admin@demo.com"))
