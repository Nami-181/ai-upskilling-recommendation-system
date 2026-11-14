"""Skill-gap analysis (FR-14..17).

gap_s = weight_s * max(0, required_s - level_s)
readiness = 100 * sum(w * min(level, required)) / sum(w * required)
"""


def severity(gap):
    if gap >= 6:
        return "High"
    if gap >= 3:
        return "Medium"
    if gap > 0:
        return "Low"
    return "None"


def compute_gap(levels, role_reqs):
    """levels: {skill_id: 0-5}; role_reqs: [(skill_id, weight, required_level)].

    Returns {"rows": [...sorted by gap desc], "readiness": float}.
    """
    rows, have_sum, need_sum = [], 0, 0
    for skill_id, weight, required in role_reqs:
        have = levels.get(skill_id, 0)
        gap = weight * max(0, required - have)
        have_sum += weight * min(have, required)
        need_sum += weight * required
        rows.append({"skill_id": skill_id, "weight": weight, "required": required,
                     "have": have, "gap": gap, "severity": severity(gap)})
    rows.sort(key=lambda r: (-r["gap"], -r["weight"], r["skill_id"]))
    readiness = round(100 * have_sum / need_sum, 1) if need_sum else 0.0
    return {"rows": rows, "readiness": readiness}


def role_requirements(conn, role_id):
    return [(r["skill_id"], r["weight"], r["required_level"]) for r in conn.execute(
        "SELECT skill_id, weight, required_level FROM role_skills WHERE role_id = ?", (role_id,))]
