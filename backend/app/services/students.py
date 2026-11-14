"""Student profile helpers: serialisation, completion %, skill levels."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_engine.taxonomy import dictionary, infer_levels
from app.models import StudentProfile, StudentSkill, User, iso
from app.services.catalog import get_catalog

SOURCE_RANK = {"self": 0, "course": 1, "project": 2, "quiz": 3}


def ensure_profile(db: Session, user: User) -> StudentProfile:
    if user.profile is None:
        user.profile = StudentProfile(user_id=user.id, interests=[])
        db.flush()
    return user.profile


def profile_completion(user: User) -> int:
    p = user.profile
    checks = [
        bool(user.first_name),
        bool(p and p.program),
        bool(p and p.institution),
        bool(p and p.year),
        bool(p and p.target_role_id),
        len(user.skills) >= 3,
        len(user.courses) >= 1,
        len(user.projects) >= 1,
        bool(p and p.interests),
        bool(p and p.bio),
    ]
    return round(100 * sum(checks) / len(checks))


def user_out(user: User) -> dict:
    p = user.profile
    return {
        "id": user.id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email,
        "role": user.role, "verified": user.is_verified,
        "onboarding_complete": bool(p and p.onboarding_complete),
        "profile_completion": profile_completion(user),
        "target_role": p.target_role.title if p and p.target_role else None,
        "target_role_id": p.target_role_id if p else None,
        "program": p.program if p else "", "year": p.year if p else None,
        "weekly_hours_goal": p.hours_per_week if p else 8, "created_at": iso(user.created_at),
    }


def profile_out(user: User) -> dict:
    p = user.profile
    out = user_out(user)
    out.update({
        "institution": p.institution if p else "", "bio": p.bio if p else "",
        "preferred_resource_type": p.preferred_type if p else "any",
        "interests": list(p.interests or []) if p else [],
        "skills": sorted(({"skill_id": s.skill_id, "name": s.skill.name, "category": s.skill.category,
                           "level": s.level, "source": s.source} for s in user.skills),
                         key=lambda s: (-s["level"], s["name"])),
        "courses": [{"id": c.id, "title": c.title, "provider": c.provider, "status": c.status,
                     "completed_on": c.completed_on} for c in user.courses],
        "projects": [{"id": pr.id, "title": pr.title, "description": pr.description, "tech_stack": pr.tech_stack,
                      "url": pr.url} for pr in user.projects],
    })
    return out


def set_skill(db: Session, user: User, skill_id: str, level: int, source: str, force: bool = False) -> None:
    """Record a skill level. Self-ratings overwrite; evidence (course/project/quiz) only raises
    the level, except quizzes which set it (force=True) so failed quizzes lower it."""
    row = db.get(StudentSkill, (user.id, skill_id))
    if row is None:
        db.add(StudentSkill(user_id=user.id, skill_id=skill_id, level=level, source=source))
    elif force or source == "self" or level > row.level:
        row.level, row.source = level, source
    db.flush()


def infer_skills_from_history(db: Session, user: User) -> None:
    """Add skills found in course titles and project descriptions (taxonomy synonyms)."""
    vocab = dictionary(get_catalog(db))
    courses = [c.title for c in user.courses]
    projects = [" ".join([p.title, p.description, p.tech_stack]) for p in user.projects]
    for sid, level in infer_levels(vocab, courses, projects).items():
        row = db.get(StudentSkill, (user.id, sid))
        if row is None:
            db.add(StudentSkill(user_id=user.id, skill_id=sid, level=level,
                                source="project" if level >= 3 else "course"))
    db.flush()


def levels(db: Session, user_id: int) -> dict[str, int]:
    return {s.skill_id: s.level for s in db.scalars(select(StudentSkill).where(StudentSkill.user_id == user_id))}
