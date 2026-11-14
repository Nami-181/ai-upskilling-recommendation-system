"""Bridge between the database catalogue and the AI engine's Catalog."""
from __future__ import annotations

import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_engine import Catalog
from app.models import (CareerRole, Certification, ProjectIdea, QuizQuestion, Resource, RoleSkill, Skill,
                        SkillPrereq)

_lock = threading.Lock()
_cache: dict[str, Catalog] = {}


def invalidate() -> None:
    with _lock:
        _cache.clear()


def get_catalog(db: Session) -> Catalog:
    """Catalog built from the database; cached until an admin edits the catalogue."""
    key = str(db.get_bind().url)
    with _lock:
        if key in _cache:
            return _cache[key]
    cat = Catalog.from_records(
        skills=[{"skill_id": s.id, "name": s.name, "category": s.category, "synonyms": s.synonyms}
                for s in db.scalars(select(Skill))],
        prereqs=[{"skill_id": p.skill_id, "prereq_skill_id": p.prereq_skill_id} for p in db.scalars(select(SkillPrereq))],
        roles=[{"role_id": r.id, "title": r.title, "description": r.description} for r in db.scalars(select(CareerRole))],
        role_skills=[{"role_id": r.role_id, "skill_id": r.skill_id, "weight": r.weight, "required_level": r.required_level}
                     for r in db.scalars(select(RoleSkill))],
        resources=[{"resource_id": r.id, "skill_id": r.skill_id, "title": r.title, "provider": r.provider, "url": r.url,
                    "type": r.type, "level": r.level, "duration_hrs": r.duration_hrs, "is_free": int(r.is_free),
                    "rating": r.rating} for r in db.scalars(select(Resource))],
        projects=[{"project_id": p.id, "skill_id": p.skill_id, "title": p.title, "level": p.level,
                   "est_hours": p.est_hours, "description": p.description} for p in db.scalars(select(ProjectIdea))],
        certifications=[{"cert_id": c.id, "role_id": c.role_id, "title": c.title, "provider": c.provider,
                         "cost": c.cost, "url": c.url, "is_free": int(c.is_free), "level": c.level}
                        for c in db.scalars(select(Certification))],
        quiz=[{"question_id": q.id, "skill_id": q.skill_id, "question": q.question, "options": q.options,
               "answer_index": q.answer_index} for q in db.scalars(select(QuizQuestion))],
    )
    with _lock:
        _cache[key] = cat
    return cat


def resolve_role(db: Session, value: str | None) -> CareerRole | None:
    """Accept a role id ('data-scientist') or title ('Data Scientist')."""
    if not value:
        return None
    role = db.get(CareerRole, value)
    if role is None:
        role = db.scalar(select(CareerRole).where(CareerRole.title.ilike(value.strip())))
    return role


def resolve_skill(db: Session, value: str) -> Skill | None:
    skill = db.get(Skill, value)
    if skill is None:
        skill = db.scalar(select(Skill).where(Skill.name.ilike(value.strip())))
    return skill
