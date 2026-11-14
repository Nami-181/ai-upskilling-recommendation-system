"""Learning-path generation (FR-19..31): prerequisite ordering, resource ranking, weekly schedule."""
import heapq
import math
from datetime import date, timedelta

from .gap import compute_gap

HOURS_PER_LEVEL = 8      # study hours estimated per level of shortfall
PREREQ_MIN_LEVEL = 2     # a prerequisite counts as known from this level
RESOURCES_PER_MODULE = 3


def prereq_map(conn):
    out = {}
    for r in conn.execute("SELECT skill_id, prereq_skill_id FROM skill_prereqs"):
        out.setdefault(r["skill_id"], []).append(r["prereq_skill_id"])
    return out


def target_difficulty(have):
    return 1 if have <= 1 else 2 if have == 2 else 3


def score_resource(res, have, preferred_type):
    """score = 0.5 level match + 0.2 rating + 0.15 free + 0.15 type match."""
    level_match = max(0.0, 1 - abs(res["level"] - target_difficulty(have)) / 2)
    type_match = 1.0 if preferred_type in ("any", None, "") or res["type"] == preferred_type else 0.0
    return round(0.5 * level_match + 0.2 * (res["rating"] or 0) / 5 + 0.15 * res["is_free"] + 0.15 * type_match, 4)


def rank_resources(resources, have, preferred_type, exclude_ids=(), limit=RESOURCES_PER_MODULE):
    cands = [r for r in resources if r["id"] not in exclude_ids]
    cands.sort(key=lambda r: (-score_resource(r, have, preferred_type), r["duration_hrs"], r["id"]))
    return cands[:limit]


def pick_project(projects, have):
    if not projects:
        return None
    tgt = target_difficulty(have)
    return sorted(projects, key=lambda p: (abs(p["level"] - tgt), p["est_hours"]))[0]


def collect_skills(levels, role_reqs, prereqs):
    """Missing role skills plus any unknown prerequisites they depend on.

    Returns {skill_id: {"gap", "target", "reason"}}.
    """
    gap = compute_gap(levels, role_reqs)
    needed = {}
    for row in gap["rows"]:
        if row["gap"] > 0:
            needed[row["skill_id"]] = {
                "gap": row["gap"], "target": row["required"],
                "reason": f"{row['severity']} gap: you are at level {row['have']}, the role needs {row['required']}"}
    stack = list(needed)
    while stack:
        sid = stack.pop()
        for p in prereqs.get(sid, []):
            if p not in needed and levels.get(p, 0) < PREREQ_MIN_LEVEL:
                needed[p] = {"gap": 1, "target": PREREQ_MIN_LEVEL, "reason": f"Prerequisite for {sid}"}
                stack.append(p)
    return needed


def order_skills(needed, prereqs):
    """Topological order (prerequisites first), larger gaps first among available skills."""
    indeg = {s: 0 for s in needed}
    children = {s: [] for s in needed}
    for s in needed:
        for p in prereqs.get(s, []):
            if p in needed:
                indeg[s] += 1
                children[p].append(s)
    heap = [(-needed[s]["gap"], s) for s in needed if indeg[s] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        _, s = heapq.heappop(heap)
        order.append(s)
        for c in children[s]:
            indeg[c] -= 1
            if indeg[c] == 0:
                heapq.heappush(heap, (-needed[c]["gap"], c))
    if len(order) != len(needed):  # cycle in admin-edited data: append the rest
        order += sorted(set(needed) - set(order))
    return order


def schedule(modules, hours_per_week, start):
    """Assign week numbers and due dates; modules marked Done keep their dates."""
    hpw = max(1, hours_per_week or 1)
    cum = 0.0
    for m in modules:
        if m.get("status") == "Done":
            continue
        cum += m["hours"]
        m["week_no"] = max(1, math.ceil(cum / hpw))
        m["due_date"] = (start + timedelta(days=7 * m["week_no"])).isoformat()
    open_dates = [m["due_date"] for m in modules if m.get("due_date")]
    return max(open_dates) if open_dates else start.isoformat()


def build_plan(levels, role_reqs, prereqs, resources_by_skill, projects_by_skill,
               hours_per_week, preferred_type="any", start=None):
    start = start or date.today()
    needed = collect_skills(levels, role_reqs, prereqs)
    modules = []
    for i, sid in enumerate(order_skills(needed, prereqs), start=1):
        have = levels.get(sid, 0)
        res = rank_resources(resources_by_skill.get(sid, []), have, preferred_type)
        proj = pick_project(projects_by_skill.get(sid, []), have)
        shortfall = max(1, needed[sid]["target"] - have)
        hours = shortfall * HOURS_PER_LEVEL + (proj["est_hours"] if proj else 0)
        modules.append({"skill_id": sid, "order_no": i, "hours": hours, "status": "Not started",
                        "reason": needed[sid]["reason"], "resources": res, "project": proj})
    finish = schedule(modules, hours_per_week, start)
    return {"modules": modules, "est_finish": finish}


def load_catalog(conn):
    res, proj = {}, {}
    for r in conn.execute("SELECT * FROM resources"):
        res.setdefault(r["skill_id"], []).append(dict(r))
    for p in conn.execute("SELECT * FROM projects_catalog"):
        proj.setdefault(p["skill_id"], []).append(dict(p))
    return res, proj


def resource_reason(res, skill_name, have):
    bits = [f"teaches {skill_name}", f"level {res['level']} suits your level {have}"]
    if res["is_free"]:
        bits.append("is free")
    bits.append(f"is rated {res['rating']}/5")
    return "Recommended because it " + ", ".join(bits) + "."


def generate_path(conn, user_id, start=None):
    """Build and save a new active path for the student's target role. Returns path id or None."""
    from .db import log, skill_names
    from .gap import role_requirements
    from .skills import student_levels

    prof = conn.execute("SELECT * FROM student_profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not prof or not prof["target_role_id"]:
        return None
    levels = student_levels(conn, user_id)
    reqs = role_requirements(conn, prof["target_role_id"])
    res, proj = load_catalog(conn)
    plan = build_plan(levels, reqs, prereq_map(conn), res, proj,
                      prof["hours_per_week"], prof["preferred_type"], start)
    names = skill_names(conn)

    conn.execute("UPDATE learning_paths SET status = 'replaced' WHERE user_id = ? AND status = 'active'", (user_id,))
    pid = conn.execute("INSERT INTO learning_paths (user_id, role_id, est_finish) VALUES (?, ?, ?)",
                       (user_id, prof["target_role_id"], plan["est_finish"])).lastrowid
    for m in plan["modules"]:
        mid = conn.execute(
            "INSERT INTO path_modules (path_id, skill_id, order_no, week_no, hours, due_date, status, reason) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (pid, m["skill_id"], m["order_no"], m["week_no"], m["hours"], m["due_date"], m["status"], m["reason"])
        ).lastrowid
        have = levels.get(m["skill_id"], 0)
        for r in m["resources"]:
            why = resource_reason(r, names.get(m["skill_id"], m["skill_id"]), have)
            conn.execute("INSERT INTO path_items (module_id, item_type, item_id, reason, link) "
                         "VALUES (?, 'resource', ?, ?, ?)", (mid, r["id"], why, r["url"]))
        if m["project"]:
            conn.execute("INSERT INTO path_items (module_id, item_type, item_id, reason) VALUES (?, 'project', ?, ?)",
                         (mid, m["project"]["id"], f"Hands-on practice for {names.get(m['skill_id'])}."))
    log(conn, user_id, f"path {pid}", f"{len(plan['modules'])} modules, finish {plan['est_finish']}", "generated")
    conn.commit()
    return pid


def active_path(conn, user_id):
    return conn.execute("SELECT * FROM learning_paths WHERE user_id = ? AND status = 'active' "
                        "ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()


def reschedule_path(conn, path_id, hours_per_week, start=None):
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM path_modules WHERE path_id = ? ORDER BY order_no", (path_id,))]
    finish = schedule(rows, hours_per_week, start or date.today())
    for m in rows:
        conn.execute("UPDATE path_modules SET week_no = ?, due_date = ? WHERE id = ?",
                     (m["week_no"], m["due_date"], m["id"]))
    conn.execute("UPDATE learning_paths SET est_finish = ? WHERE id = ?", (finish, path_id))
    return finish
