"""Skill-gap analysis and skill-importance ranking.

For each skill s required by a role:
    shortfall_s = max(0, required_s - current_s)
    gap_s       = weight_s * shortfall_s                      (weight 1-3, levels 0-5)
    readiness   = 100 * sum(w * min(current, required)) / sum(w * required)

Importance (used to rank which gap to close first):
    importance_s = 0.5 * weight_s / 3 + 0.45 * shortfall_s / 5 + 0.05 * min(unlocks_s, 3) / 3

where unlocks_s is how many other missing role skills depend on s (directly or
transitively) through the prerequisite graph.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .catalog import Catalog


def severity(gap: float) -> str:
    if gap >= 6:
        return "High"
    if gap >= 3:
        return "Medium"
    if gap > 0:
        return "Low"
    return "None"


def _ancestors(skill: str, prereqs: dict[str, list[str]]) -> set[str]:
    seen, stack = set(), list(prereqs.get(skill, []))
    while stack:
        p = stack.pop()
        if p not in seen:
            seen.add(p)
            stack.extend(prereqs.get(p, []))
    return seen


def unlock_counts(missing: list[str], prereqs: dict[str, list[str]]) -> dict[str, int]:
    """How many missing skills each missing skill is a (transitive) prerequisite of."""
    counts = dict.fromkeys(missing, 0)
    for s in missing:
        for anc in _ancestors(s, prereqs):
            if anc in counts:
                counts[anc] += 1
    return counts


def analyze_gap(levels: dict[str, int], requirements: pd.DataFrame,
                prereqs: dict[str, list[str]] | None = None, names: dict[str, str] | None = None) -> dict:
    """levels: {skill_id: 0-5}; requirements: DataFrame[skill_id, weight, required_level]."""
    prereqs = prereqs or {}
    names = names or {}
    if requirements.empty:
        return {"readiness": 0.0, "rows": [], "missing": 0, "strengths": []}
    df = requirements.copy()
    df["current"] = df.skill_id.map(levels).fillna(0).astype(int).clip(0, 5)
    df["shortfall"] = (df.required_level - df.current).clip(lower=0)
    df["gap"] = df.weight * df.shortfall
    df["severity"] = df.gap.map(severity)
    missing = df.loc[df.gap > 0, "skill_id"].tolist()
    unlocks = unlock_counts(missing, prereqs)
    df["unlocks"] = df.skill_id.map(unlocks).fillna(0).astype(int)
    df["importance"] = np.where(
        df.gap > 0,
        0.5 * df.weight / 3
        + 0.45 * df.shortfall / 5
        + 0.05 * np.minimum(df.unlocks, 3) / 3,
        0.0,
    ).round(3)
    df["name"] = df.skill_id.map(lambda s: names.get(s, s))
    df = df.sort_values(["importance", "gap", "weight", "skill_id"], ascending=[False, False, False, True])
    df["rank"] = np.where(df.gap > 0, np.arange(1, len(df) + 1), 0)
    need = float((df.weight * df.required_level).sum())
    have = float((df.weight * np.minimum(df.current, df.required_level)).sum())
    readiness = round(100 * have / need, 1) if need else 0.0
    rows = df[["skill_id", "name", "weight", "required_level", "current", "shortfall", "gap",
               "severity", "unlocks", "importance", "rank"]].to_dict("records")
    rows = [{k: (v.item() if hasattr(v, "item") else v) for k, v in r.items()} for r in rows]
    return {
        "readiness": readiness,
        "rows": rows,
        "missing": len(missing),
        "strengths": [r["skill_id"] for r in rows if r["gap"] == 0 and r["current"] > 0],
    }


def career_readiness(levels: dict[str, int], catalog: Catalog) -> list[dict]:
    """Readiness for every role, best match first (career explorer)."""
    out = []
    prereqs, names = catalog.prereq_map(), catalog.skill_names()
    for role in catalog.roles.itertuples():
        g = analyze_gap(levels, catalog.role_requirements(role.role_id), prereqs, names)
        out.append({"role_id": role.role_id, "title": role.title, "description": role.description,
                    "readiness": g["readiness"], "missing": g["missing"],
                    "top_gaps": [r["name"] for r in g["rows"] if r["gap"] > 0][:3]})
    return sorted(out, key=lambda r: (-r["readiness"], r["title"]))
