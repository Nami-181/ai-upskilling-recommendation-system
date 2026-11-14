"""Content-based ranking of courses/resources, projects and certifications.

Resource score (0-1):
    0.45 * level_match      1 - |resource_level - target_difficulty| / 2
  + 0.20 * rating / 5
  + 0.15 * is_free
  + 0.15 * type_match       1 if the student's preferred type (or "any")
  + 0.05 * brevity          1 - duration / max duration in the candidate set
  - 0.30 * disliked         student said "not relevant" / "too easy" / "too hard" before

target_difficulty (1-3) follows the student's current level and is adjusted by
their latest quiz score on that skill (adaptive: < 50 % -> one step easier,
>= 80 % -> one step harder).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .catalog import Catalog

PASS, FAIL = 80, 50
RESOURCES_PER_SKILL = 3


def target_difficulty(current: int, quiz_score: float | None = None) -> int:
    base = 1 if current <= 1 else 2 if current == 2 else 3
    if quiz_score is not None:
        if quiz_score < FAIL:
            base -= 1
        elif quiz_score >= PASS:
            base += 1
    return int(min(3, max(1, base)))


def score_resources(resources: pd.DataFrame, current: int, preferred_type: str | None = "any",
                    quiz_score: float | None = None, disliked: set | None = None) -> pd.DataFrame:
    if resources.empty:
        return resources.assign(score=pd.Series(dtype=float))
    df = resources.copy()
    tgt = target_difficulty(current, quiz_score)
    level = df.level.astype(float)
    level_match = (1 - (level - tgt).abs() / 2).clip(lower=0)
    rating = df.rating.astype(float).fillna(0) / 5
    free = df.is_free.astype(float)
    pref = (preferred_type or "any").lower()
    type_match = np.where((pref == "any") | (df.type.str.lower() == pref), 1.0, 0.0)
    hours = df.duration_hrs.astype(float)
    brevity = 1 - hours / hours.max() if hours.max() > 0 else 0.0
    dis = df.resource_id.isin(disliked or set()).astype(float)
    df["score"] = (0.45 * level_match + 0.2 * rating + 0.15 * free + 0.15 * type_match
                   + 0.05 * brevity - 0.3 * dis).round(4)
    df["target_level"] = tgt
    return df


def resource_reason(res: dict, skill_name: str, current: int, target: int) -> str:
    level_word = {1: "beginner", 2: "intermediate", 3: "advanced"}.get(int(res["level"]), "")
    bits = [f"teaches {skill_name}", f"is {level_word} level, matching your level {current} (target {target})"]
    if int(res["is_free"]):
        bits.append("is free")
    bits.append(f"is rated {res['rating']}/5")
    return "Recommended because it " + ", ".join(bits) + "."


def recommend_resources(catalog: Catalog, skill_id: str, current: int, preferred_type: str = "any",
                        quiz_score: float | None = None, exclude: set | None = None,
                        disliked: set | None = None, k: int = RESOURCES_PER_SKILL) -> list[dict]:
    cands = catalog.resources_for(skill_id)
    if exclude:
        cands = cands[~cands.resource_id.isin(exclude)]
    scored = score_resources(cands, current, preferred_type, quiz_score, disliked)
    if scored.empty:
        return []
    scored = scored.sort_values(["score", "duration_hrs", "resource_id"], ascending=[False, True, True]).head(k)
    name = catalog.skill_name(skill_id)
    out = []
    for r in scored.to_dict("records"):
        r = {key: (v.item() if hasattr(v, "item") else v) for key, v in r.items()}
        r["reason"] = resource_reason(r, name, current, r["target_level"])
        out.append(r)
    return out


def recommend_project(catalog: Catalog, skill_id: str, current: int, quiz_score: float | None = None) -> dict | None:
    projects = catalog.projects_for(skill_id)
    if projects.empty:
        return None
    tgt = target_difficulty(current, quiz_score)
    projects = projects.assign(dist=(projects.level.astype(int) - tgt).abs())
    best = projects.sort_values(["dist", "est_hours", "project_id"]).iloc[0].to_dict()
    best.pop("dist")
    best = {k: (v.item() if hasattr(v, "item") else v) for k, v in best.items()}
    best["reason"] = f"Hands-on practice for {catalog.skill_name(skill_id)} at level {best['level']}."
    return best


def recommend_certifications(catalog: Catalog, role_id: str, readiness: float, k: int = 3) -> list[dict]:
    """Free and entry-level certifications first while readiness is low; advanced ones later."""
    certs = catalog.certifications[catalog.certifications.role_id == role_id].copy()
    if certs.empty:
        return []
    tgt = 1 if readiness < 40 else 2 if readiness < 75 else 3
    certs["score"] = (1 - (certs.level.astype(int) - tgt).abs() / 2).clip(lower=0) * 0.8 + certs.is_free.astype(int) * 0.2
    certs = certs.sort_values(["score", "cert_id"], ascending=[False, True]).head(k)
    out = []
    for c in certs.to_dict("records"):
        c = {key: (v.item() if hasattr(v, "item") else v) for key, v in c.items()}
        when = "now" if c["level"] <= tgt else "after you close your main gaps"
        c["reason"] = (f"Level {c['level']} certification for {catalog.role_title(role_id)}; "
                       f"you are {readiness:.0f}% ready, so aim for it {when}.")
        out.append(c)
    return out
