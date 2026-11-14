"""Catalogue datasets used by the recommendation engine.

The CSV files in ``data/`` are the source datasets (skill taxonomy, career roles,
role -> skill requirements, resources, project ideas, certifications, quiz bank).
The backend seeds PostgreSQL from them; at run time the backend rebuilds a
``Catalog`` from database rows so admin edits are picked up.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "data"

COLUMNS = {
    "skills": ["skill_id", "name", "category", "synonyms"],
    "prereqs": ["skill_id", "prereq_skill_id"],
    "roles": ["role_id", "title", "description"],
    "role_skills": ["role_id", "skill_id", "weight", "required_level"],
    "resources": ["resource_id", "skill_id", "title", "provider", "url", "type", "level",
                  "duration_hrs", "is_free", "rating"],
    "projects": ["project_id", "skill_id", "title", "level", "est_hours", "description"],
    "certifications": ["cert_id", "role_id", "title", "provider", "cost", "url", "is_free", "level"],
    "quiz": ["question_id", "skill_id", "question", "options", "answer_index"],
}

FILES = {
    "skills": "skills.csv",
    "prereqs": "skill_prereqs.csv",
    "roles": "career_roles.csv",
    "role_skills": "role_skills.csv",
    "resources": "resources.csv",
    "projects": "project_ideas.csv",
    "certifications": "certifications.csv",
    "quiz": "quiz_questions.csv",
}


def _frame(records, name):
    df = pd.DataFrame(list(records))
    if df.empty:
        return pd.DataFrame(columns=COLUMNS[name])
    return df


@dataclass
class Catalog:
    skills: pd.DataFrame
    prereqs: pd.DataFrame
    roles: pd.DataFrame
    role_skills: pd.DataFrame
    resources: pd.DataFrame
    projects: pd.DataFrame
    certifications: pd.DataFrame
    quiz: pd.DataFrame = field(default_factory=lambda: pd.DataFrame(columns=COLUMNS["quiz"]))

    # ---------- construction ----------
    @classmethod
    def from_csv(cls, data_dir: Path | str = DATA_DIR) -> "Catalog":
        data_dir = Path(data_dir)
        frames = {name: pd.read_csv(data_dir / file, keep_default_na=False) for name, file in FILES.items()}
        return cls(**frames)

    @classmethod
    def from_records(cls, **records) -> "Catalog":
        """Build from lists of dicts (e.g. database rows). Missing tables become empty frames."""
        return cls(**{name: _frame(records.get(name, []), name) for name in COLUMNS})

    # ---------- lookups ----------
    def skill_name(self, skill_id: str) -> str:
        row = self.skills.loc[self.skills.skill_id == skill_id, "name"]
        return row.iloc[0] if len(row) else skill_id

    def skill_names(self) -> dict[str, str]:
        return dict(zip(self.skills.skill_id, self.skills.name))

    def prereq_map(self) -> dict[str, list[str]]:
        out: dict[str, list[str]] = {}
        for sid, pre in zip(self.prereqs.skill_id, self.prereqs.prereq_skill_id):
            out.setdefault(sid, []).append(pre)
        return out

    def role_requirements(self, role_id: str) -> pd.DataFrame:
        req = self.role_skills[self.role_skills.role_id == role_id][["skill_id", "weight", "required_level"]]
        return req.astype({"weight": int, "required_level": int}).reset_index(drop=True)

    def role_title(self, role_id: str) -> str:
        row = self.roles.loc[self.roles.role_id == role_id, "title"]
        return row.iloc[0] if len(row) else role_id

    def resources_for(self, skill_id: str) -> pd.DataFrame:
        return self.resources[self.resources.skill_id == skill_id].reset_index(drop=True)

    def projects_for(self, skill_id: str) -> pd.DataFrame:
        return self.projects[self.projects.skill_id == skill_id].reset_index(drop=True)
