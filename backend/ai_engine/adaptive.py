"""Adaptive rules: update skill levels and recommendations from quizzes,
feedback and activity.

Quiz score -> decision
    >= 80 %  complete   skill level becomes 4, module marked completed, later modules move earlier
    50-79 %  continue   skill level at least 2, keep the module
    <  50 %  remediate  level 1, add the easiest unused resource, give the module one more study week
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pandas as pd

from .recommender import FAIL, PASS, score_resources

INACTIVE_DAYS = 7


def grade_quiz(answer_key: list[int], answers: list[int]) -> float:
    if not answer_key:
        return 0.0
    correct = sum(1 for i, a in enumerate(answer_key) if i < len(answers) and answers[i] == a)
    return round(100 * correct / len(answer_key), 1)


def level_from_quiz(score: float) -> int:
    return 4 if score >= PASS else 2 if score >= FAIL else 1


def quiz_decision(score: float, hours_per_week: int = 8) -> dict:
    if score >= PASS:
        return {"action": "complete", "new_level": 4, "extra_hours": 0,
                "message": f"Scored {score:.0f}%: skill marked as acquired (level 4) and the module is complete."}
    if score < FAIL:
        return {"action": "remediate", "new_level": 1, "extra_hours": max(1, hours_per_week),
                "message": (f"Scored {score:.0f}%: added easier material and one more study week "
                            "for this module.")}
    return {"action": "continue", "new_level": 2, "extra_hours": 0,
            "message": f"Scored {score:.0f}%: good progress. Finish the module and retake to reach {PASS}%."}


def easier_resource(resources: pd.DataFrame, exclude: set) -> dict | None:
    pool = resources[~resources.resource_id.isin(exclude)]
    if pool.empty:
        return None
    r = pool.sort_values(["level", "rating"], ascending=[True, False]).iloc[0].to_dict()
    return {k: (v.item() if hasattr(v, "item") else v) for k, v in r.items()}


def feedback_replacement(resources: pd.DataFrame, current: dict, value: str, exclude: set,
                         preferred_type: str = "any") -> dict | None:
    """value: too_easy | too_hard | not_relevant. Returns the replacement resource or None."""
    pool = resources[~resources.resource_id.isin(exclude | {current["resource_id"]})]
    if value == "too_easy":
        pool = pool[pool.level.astype(int) > int(current["level"])]
    elif value == "too_hard":
        pool = pool[pool.level.astype(int) < int(current["level"])]
    if pool.empty:
        return None
    best = score_resources(pool, int(current["level"]), preferred_type).sort_values("score", ascending=False)
    r = best.iloc[0].to_dict()
    return {k: (v.item() if hasattr(v, "item") else v) for k, v in r.items()}


def is_inactive(last_active: datetime | None, now: datetime | None = None, days: int = INACTIVE_DAYS) -> bool:
    if not last_active:
        return False
    now = now or datetime.now(timezone.utc)
    if last_active.tzinfo is None:
        last_active = last_active.replace(tzinfo=timezone.utc)
    return now - last_active > timedelta(days=days)


def risk_flag(readiness: float, progress_pct: float, last_quiz: float | None, inactive: bool) -> str:
    points = (2 if inactive else 0) + (1 if progress_pct < 20 else 0)
    points += 1 if last_quiz is not None and last_quiz < FAIL else 0
    points += 1 if readiness < 40 else 0
    return "High" if points >= 3 else "Medium" if points >= 2 else "Low"
