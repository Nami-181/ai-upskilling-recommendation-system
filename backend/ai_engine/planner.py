"""Personalised learning-path generation.

1. Collect missing role skills plus unknown prerequisites they depend on.
2. Order them topologically (prerequisites first), most important gap first.
3. Attach the top resources and one project per skill (see recommender.py).
4. Estimate hours (8 h per missing level + project hours) and pack them into
   the student's weekly study hours to get week numbers and due dates.
"""
from __future__ import annotations

import heapq
import math
from datetime import date, timedelta

from .catalog import Catalog
from .gap import analyze_gap
from .recommender import recommend_certifications, recommend_project, recommend_resources

HOURS_PER_LEVEL = 8
PREREQ_MIN_LEVEL = 2


def collect_skills(levels: dict[str, int], gap: dict, prereqs: dict[str, list[str]]) -> dict[str, dict]:
    needed = {}
    for row in gap["rows"]:
        if row["gap"] > 0:
            needed[row["skill_id"]] = {
                "importance": row["importance"], "target": row["required_level"],
                "reason": (f"{row['severity']} gap, priority #{row['rank']}: you are at level {row['current']}, "
                           f"the role needs {row['required_level']}")}
    stack = list(needed)
    while stack:
        sid = stack.pop()
        for p in prereqs.get(sid, []):
            if p not in needed and levels.get(p, 0) < PREREQ_MIN_LEVEL:
                needed[p] = {"importance": needed[sid]["importance"] + 0.001, "target": PREREQ_MIN_LEVEL,
                             "reason": f"Prerequisite for {sid}"}
                stack.append(p)
    return needed


def order_skills(needed: dict[str, dict], prereqs: dict[str, list[str]]) -> list[str]:
    indeg = dict.fromkeys(needed, 0)
    children: dict[str, list[str]] = {s: [] for s in needed}
    for s in needed:
        for p in prereqs.get(s, []):
            if p in needed:
                indeg[s] += 1
                children[p].append(s)
    heap = [(-needed[s]["importance"], s) for s in needed if indeg[s] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        _, s = heapq.heappop(heap)
        order.append(s)
        for c in children[s]:
            indeg[c] -= 1
            if indeg[c] == 0:
                heapq.heappush(heap, (-needed[c]["importance"], c))
    if len(order) != len(needed):  # cycle in edited data: append the rest
        order += sorted(set(needed) - set(order))
    return order


def schedule(modules: list[dict], hours_per_week: int, start: date) -> str:
    """Assign week numbers and due dates in place. Completed modules keep theirs."""
    hpw = max(1, int(hours_per_week or 1))
    cum = 0.0
    for m in modules:
        if m.get("status") == "completed":
            continue
        cum += m["hours"]
        m["week_no"] = max(1, math.ceil(cum / hpw))
        m["due_date"] = (start + timedelta(days=7 * m["week_no"])).isoformat()
    dates = [m["due_date"] for m in modules if m.get("due_date")]
    return max(dates) if dates else start.isoformat()


def build_learning_path(catalog: Catalog, levels: dict[str, int], role_id: str, hours_per_week: int = 8,
                        preferred_type: str = "any", quiz_scores: dict[str, float] | None = None,
                        disliked: set | None = None, start: date | None = None) -> dict:
    start = start or date.today()
    quiz_scores = quiz_scores or {}
    prereqs = catalog.prereq_map()
    gap = analyze_gap(levels, catalog.role_requirements(role_id), prereqs, catalog.skill_names())
    needed = collect_skills(levels, gap, prereqs)
    modules = []
    for i, sid in enumerate(order_skills(needed, prereqs), start=1):
        cur = levels.get(sid, 0)
        q = quiz_scores.get(sid)
        resources = recommend_resources(catalog, sid, cur, preferred_type, q, disliked=disliked)
        project = recommend_project(catalog, sid, cur, q)
        shortfall = max(1, needed[sid]["target"] - cur)
        hours = shortfall * HOURS_PER_LEVEL + (int(project["est_hours"]) if project else 0)
        modules.append({"skill_id": sid, "skill_name": catalog.skill_name(sid), "order_no": i,
                        "current_level": cur, "target_level": needed[sid]["target"], "hours": hours,
                        "status": "not_started", "reason": needed[sid]["reason"],
                        "importance": round(needed[sid]["importance"], 3),
                        "resources": resources, "project": project})
    finish = schedule(modules, hours_per_week, start)
    return {"role_id": role_id, "role_title": catalog.role_title(role_id), "readiness": gap["readiness"],
            "gap": gap, "modules": modules, "total_hours": sum(m["hours"] for m in modules),
            "est_finish": finish,
            "certifications": recommend_certifications(catalog, role_id, gap["readiness"])}
