"""Seed the catalogue from ai_engine/data/*.csv and create demo accounts.

Run:  python -m app.seed      (idempotent: existing rows are left alone)
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_engine.catalog import Catalog
from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import (CareerRole, Certification, ProjectIdea, QuizQuestion, Resource, RoleSkill, Skill,
                        SkillPrereq, StudentCourse, StudentProfile, StudentProject, StudentSkill, User)

log = logging.getLogger("lumora.seed")

DEMO_STUDENT = {"email": settings.DEMO_STUDENT_EMAIL, "password": settings.DEMO_STUDENT_PASSWORD}


def seed_catalog(db: Session) -> int:
    if db.scalar(select(Skill).limit(1)):
        return 0
    c = Catalog.from_csv()
    rows = []
    rows += [Skill(id=r.skill_id, name=r.name, category=r.category, synonyms=r.synonyms) for r in c.skills.itertuples()]
    rows += [CareerRole(id=r.role_id, title=r.title, description=r.description) for r in c.roles.itertuples()]
    db.add_all(rows)
    db.flush()
    db.add_all([SkillPrereq(skill_id=r.skill_id, prereq_skill_id=r.prereq_skill_id) for r in c.prereqs.itertuples()])
    db.add_all([RoleSkill(role_id=r.role_id, skill_id=r.skill_id, weight=int(r.weight),
                          required_level=int(r.required_level)) for r in c.role_skills.itertuples()])
    db.add_all([Resource(id=r.resource_id, skill_id=r.skill_id, title=r.title, provider=r.provider, url=r.url,
                         type=r.type, level=int(r.level), duration_hrs=float(r.duration_hrs),
                         is_free=bool(int(r.is_free)), rating=float(r.rating)) for r in c.resources.itertuples()])
    db.add_all([ProjectIdea(id=r.project_id, skill_id=r.skill_id, title=r.title, level=int(r.level),
                            est_hours=int(r.est_hours), description=r.description) for r in c.projects.itertuples()])
    db.add_all([Certification(id=r.cert_id, role_id=r.role_id, title=r.title, provider=r.provider, cost=r.cost,
                              url=r.url, is_free=bool(int(r.is_free)), level=int(r.level))
                for r in c.certifications.itertuples()])
    db.add_all([QuizQuestion(id=r.question_id, skill_id=r.skill_id, question=r.question,
                             options=r.options.split("|"), answer_index=int(r.answer_index))
                for r in c.quiz.itertuples()])
    db.commit()
    return len(c.skills)


def _user(db: Session, email: str, password: str, first: str, last: str, role: str = "student") -> tuple[User, bool]:
    u = db.scalar(select(User).where(User.email == email))
    if u:
        return u, False
    u = User(email=email, hashed_password=hash_password(password), first_name=first, last_name=last, role=role,
             is_verified=True)
    db.add(u)
    db.flush()
    return u, True


def seed_users(db: Session) -> None:
    _user(db, settings.FIRST_ADMIN_EMAIL, settings.FIRST_ADMIN_PASSWORD, "Admin", "", role="admin")
    demo, created = _user(db, DEMO_STUDENT["email"], DEMO_STUDENT["password"], "Aanya", "Sharma")
    if created:
        demo.profile = StudentProfile(program="B.Tech, Computer Science", institution="Demo Institute of Technology",
                                      year=3, target_role_id="data-scientist", hours_per_week=10,
                                      preferred_type="course", interests=["AI & ML", "Data"],
                                      bio="Third-year student aiming for a data science internship.",
                                      onboarding_complete=True)
        for sid, lvl in {"python": 4, "sql": 2, "statistics": 2, "pandas": 1, "git": 2, "html": 2}.items():
            db.add(StudentSkill(user_id=demo.id, skill_id=sid, level=lvl, source="self"))
        db.add(StudentCourse(user_id=demo.id, title="Python for Everybody", provider="Coursera"))
        db.add(StudentProject(user_id=demo.id, title="Movie ratings analysis",
                              description="Cleaned a CSV of movie ratings with Python and plotted trends.",
                              tech_stack="Python, matplotlib"))
    db.commit()


def init_db(create_tables: bool = True, seed: bool = True) -> None:
    if create_tables:
        Base.metadata.create_all(engine)
    if seed:
        with SessionLocal() as db:
            n = seed_catalog(db)
            seed_users(db)
            if n:
                log.info("Seeded catalogue with %s skills", n)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db(create_tables=False)
    print("Seed complete.")
