"""Skill taxonomy: categories, synonyms and skill extraction from free text.

The taxonomy has two levels: category (Programming, Web, Data, AI, DevOps,
Security, Mobile, Design, Tools) -> skill. Each skill has synonyms used to find
it in resumes, course titles and project descriptions.
"""
from __future__ import annotations

import re

from .catalog import Catalog

# Evidence level given to a skill depending on where it was found
SOURCE_LEVEL = {"resume": 2, "course": 2, "project": 3}


def taxonomy_tree(catalog: Catalog) -> dict[str, list[dict]]:
    """{category: [{skill_id, name}, ...]} sorted by category then name."""
    tree: dict[str, list[dict]] = {}
    for row in catalog.skills.sort_values(["category", "name"]).itertuples():
        tree.setdefault(row.category, []).append({"skill_id": row.skill_id, "name": row.name})
    return tree


def dictionary(catalog: Catalog) -> dict[str, list[str]]:
    """skill_id -> lowercase synonyms (longest first), including the display name."""
    out = {}
    for row in catalog.skills.itertuples():
        syns = {s.strip().lower() for s in str(row.synonyms or "").split("|") if s.strip()}
        syns.add(row.name.lower())
        out[row.skill_id] = sorted(syns, key=len, reverse=True)
    return out


def _pattern(term: str) -> re.Pattern:
    # word boundaries that also work for "node.js", "ci/cd", "c++"
    return re.compile(r"(?<![\w])" + re.escape(term) + r"(?![\w])", re.IGNORECASE)


def extract_skills(text: str, vocab: dict[str, list[str]]) -> set[str]:
    text = text or ""
    return {sid for sid, syns in vocab.items() if any(_pattern(s).search(text) for s in syns)}


def infer_levels(vocab: dict[str, list[str]], courses: list[str], projects: list[str]) -> dict[str, int]:
    """Evidence-based levels from course titles (2) and project descriptions (3)."""
    found: dict[str, int] = {}
    for text in projects:
        for sid in extract_skills(text, vocab):
            found[sid] = max(found.get(sid, 0), SOURCE_LEVEL["project"])
    for text in courses:
        for sid in extract_skills(text, vocab):
            found.setdefault(sid, SOURCE_LEVEL["course"])
    return found
