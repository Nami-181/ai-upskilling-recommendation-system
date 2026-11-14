"""Regenerate docs/database.md (ER diagram + data dictionary) from the SQLAlchemy models.

    python scripts/gen_db_docs.py        (from backend/)
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import models  # noqa: E402,F401
from app.core.db import Base  # noqa: E402

PURPOSE = {
    "users": "Accounts for students and admins (bcrypt password hash, verification flag, last activity).",
    "auth_tokens": "One-time email-verification and password-reset tokens, stored only as SHA-256 hashes.",
    "skills": "Skill taxonomy: 33 skills with category and synonyms used for extraction.",
    "skill_prereqs": "Prerequisite graph between skills (used to order the learning path).",
    "career_roles": "Target career roles (9) with description and demand notes.",
    "role_skills": "Skills each role needs, with required level (1-5) and weight (1-3).",
    "resources": "Curated learning resources (course, video, article, docs, book, podcast) per skill.",
    "project_ideas": "Hands-on project ideas per skill with difficulty and estimated hours.",
    "certifications": "Industry certifications per role with provider, cost, level and prep time.",
    "quiz_questions": "Multiple-choice questions (3 per skill) for skill verification.",
    "student_profiles": "One-to-one profile: programme, institution, year, goal role, weekly hours, preferences.",
    "student_skills": "Current skill levels per student and where each came from (self/course/project/quiz).",
    "student_courses": "Courses the student has completed or is taking.",
    "student_projects": "Projects the student has built (title, description, tech stack, link).",
    "learning_paths": "Generated roadmaps (one active per student; older ones kept as 'replaced').",
    "path_modules": "Ordered skill modules of a path with week, hours, due date, reason and status.",
    "recommendations": "Stored recommendations (resource / project / certification) with score, reason, status.",
    "quiz_attempts": "Quiz scores and the adaptive action taken (complete / continue / remediate).",
    "progress_events": "Study-time and status-change events used for streaks and analytics.",
    "feedback": "Recommendation feedback (helpful / too easy / too hard / not relevant) and contact messages.",
    "adaptation_log": "Audit log of every AI decision (generated, completed, remediated, replaced, removed).",
}


def col_type(c) -> str:
    try:
        return str(c.type.compile()).lower()
    except Exception:  # noqa: BLE001
        return type(c.type).__name__.lower()


def main() -> None:
    tables = Base.metadata.sorted_tables
    lines = ["# Database design", "",
             "_Generated from `backend/app/models.py` by `backend/scripts/gen_db_docs.py`. Do not edit by hand._", "",
             "PostgreSQL 16 in production (Render), SQLite for local runs and tests. Schema migrations are managed "
             "with Alembic (`backend/alembic/versions`). "
             f"**{len(tables)} tables**: catalogue (reference data seeded from `ai_engine/data/*.csv`), "
             "student data, and stored AI output.", "", "## ER diagram", "", "```mermaid", "erDiagram"]
    rels = []
    for t in tables:
        for fk in t.foreign_keys:
            parent = fk.column.table.name
            unique = any(c.primary_key and len(t.primary_key.columns) == 1 for c in fk.parent.table.columns
                         if c is fk.parent) or fk.parent.unique
            rels.append(f"    {parent} ||--{'o|' if unique else 'o{'} {t.name} : \"{fk.parent.name}\"")
    lines += sorted(set(rels))
    for t in tables:
        lines.append(f"    {t.name} {{")
        for c in t.columns:
            key = " PK" if c.primary_key else (" FK" if c.foreign_keys else "")
            lines.append(f"        {col_type(c).split('(')[0].replace(' ', '_')} {c.name}{key}")
        lines.append("    }")
    lines += ["```", "", "## Data dictionary", ""]
    for t in tables:
        lines += [f"### `{t.name}`", "", PURPOSE.get(t.name, ""), "",
                  "| Column | Type | Null | Key / constraint | Default |", "| --- | --- | --- | --- | --- |"]
        for c in t.columns:
            key = []
            if c.primary_key:
                key.append("PK")
            for fk in c.foreign_keys:
                ondelete = f" on delete {fk.ondelete.lower()}" if fk.ondelete else ""
                key.append(f"FK → {fk.column.table.name}.{fk.column.name}{ondelete}")
            if c.unique:
                key.append("unique")
            if c.index:
                key.append("indexed")
            default = ""
            if c.default is not None:
                arg = c.default.arg
                default = getattr(arg, "__name__", None) or repr(arg)
                default = "now (UTC)" if default in ("utcnow", "<lambda>") else default
                default = {"''": "empty string", "dict": "{}", "list": "[]"}.get(default, default)
            lines.append(f"| {c.name} | {col_type(c)} | {'yes' if c.nullable else 'no'} | {', '.join(key)} | {default} |")
        extra = [con for con in t.constraints if con.__class__.__name__ in ("UniqueConstraint", "CheckConstraint")]
        for con in extra:
            cols = ", ".join(col.name for col in getattr(con, "columns", []))
            lines.append("")
            lines.append(f"Constraint `{con.name or con.__class__.__name__}`: "
                         + (f"unique ({cols})" if cols else str(getattr(con, "sqltext", ""))))
        lines.append("")
    out = Path(__file__).resolve().parents[2] / "docs" / "database.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {out} ({len(tables)} tables)")


if __name__ == "__main__":
    main()
