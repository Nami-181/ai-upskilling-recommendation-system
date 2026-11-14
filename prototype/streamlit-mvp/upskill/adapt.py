"""Adaptation rules (FR-35..38). Every change is written to recommendation_log (NFR-19)."""
from datetime import datetime, timedelta, timezone

from .db import log
from .planner import active_path, rank_resources, reschedule_path
from .skills import merge_skill

PASS = 80
FAIL = 50
INACTIVE_DAYS = 7


def _profile(conn, user_id):
    return conn.execute("SELECT * FROM student_profiles WHERE user_id = ?", (user_id,)).fetchone()


def _module_for(conn, path_id, skill_id):
    return conn.execute("SELECT * FROM path_modules WHERE path_id = ? AND skill_id = ?",
                        (path_id, skill_id)).fetchone()


def _module_resource_ids(conn, module_id):
    return {r["item_id"] for r in conn.execute(
        "SELECT item_id FROM path_items WHERE module_id = ? AND item_type = 'resource'", (module_id,))}


def record_quiz(conn, user_id, skill_id, score, today=None):
    """Store a quiz score and apply the pass / fail rules. Returns a list of messages."""
    conn.execute("INSERT INTO quiz_attempts (user_id, skill_id, score) VALUES (?, ?, ?)",
                 (user_id, skill_id, score))
    msgs = []
    path = active_path(conn, user_id)
    module = _module_for(conn, path["id"], skill_id) if path else None
    prof = _profile(conn, user_id)
    hpw = prof["hours_per_week"] if prof and prof["hours_per_week"] else 8

    if score >= PASS:
        merge_skill(conn, user_id, skill_id, 4, "quiz")
        msgs.append(f"Scored {score:.0f}%: skill marked as acquired (level 4).")
        if module and module["status"] != "Done":
            conn.execute("UPDATE path_modules SET status = 'Done', reason = reason || ? WHERE id = ?",
                         (" | completed: passed quiz", module["id"]))
            log(conn, user_id, f"module {skill_id}", f"quiz {score:.0f}% >= {PASS}%", "skipped")
            msgs.append("This module is complete and the rest of your path moved earlier.")
    elif score < FAIL:
        merge_skill(conn, user_id, skill_id, 1, "quiz")
        if module and module["status"] != "Done":
            existing = _module_resource_ids(conn, module["id"])
            res = [dict(r) for r in conn.execute("SELECT * FROM resources WHERE skill_id = ?", (skill_id,))]
            easier = sorted([r for r in res if r["id"] not in existing], key=lambda r: (r["level"], -r["rating"]))
            if easier:
                r = easier[0]
                conn.execute("INSERT INTO path_items (module_id, item_type, item_id, reason, link) "
                             "VALUES (?, 'resource', ?, ?, ?)",
                             (module["id"], r["id"], f"Added after a {score:.0f}% quiz: easier material.", r["url"]))
                log(conn, user_id, f"resource {r['id']}", f"quiz {score:.0f}% < {FAIL}%", "added")
                msgs.append(f"Added an easier resource: {r['title']}.")
            conn.execute("UPDATE path_modules SET hours = hours + ?, status = 'In progress' WHERE id = ?",
                         (hpw, module["id"]))
            log(conn, user_id, f"module {skill_id}", f"quiz {score:.0f}% < {FAIL}%: +{hpw} h", "rescheduled")
            msgs.append("Gave this module one more week; later due dates moved back.")
        else:
            msgs.append(f"Scored {score:.0f}%: review the basics and try again.")
    else:
        merge_skill(conn, user_id, skill_id, 2, "quiz")
        msgs.append(f"Scored {score:.0f}%: good progress. Finish the module and retake to reach {PASS}%.")

    if path and module:
        reschedule_path(conn, path["id"], hpw, today)
    conn.commit()
    return msgs


def give_feedback(conn, user_id, path_item_id, value):
    """value: too_easy | too_hard | not_relevant. Replaces the resource when possible."""
    item = conn.execute(
        "SELECT pi.*, pm.skill_id FROM path_items pi JOIN path_modules pm ON pm.id = pi.module_id "
        "WHERE pi.id = ?", (path_item_id,)).fetchone()
    if not item:
        return "Item not found."
    conn.execute("INSERT INTO feedback (user_id, item_type, item_id, value) VALUES (?, ?, ?, ?)",
                 (user_id, item["item_type"], item["item_id"], value))
    if item["item_type"] != "resource":
        conn.commit()
        return "Thanks, feedback saved."
    cur = conn.execute("SELECT * FROM resources WHERE id = ?", (item["item_id"],)).fetchone()
    existing = _module_resource_ids(conn, item["module_id"])
    pool = [dict(r) for r in conn.execute("SELECT * FROM resources WHERE skill_id = ?", (item["skill_id"],))
            if r["id"] not in existing]
    if value == "too_easy":
        pool = [r for r in pool if r["level"] > cur["level"]]
    elif value == "too_hard":
        pool = [r for r in pool if r["level"] < cur["level"]]
    prof = _profile(conn, user_id)
    repl = rank_resources(pool, cur["level"], prof["preferred_type"] if prof else "any", limit=1)
    if repl:
        r = repl[0]
        conn.execute("UPDATE path_items SET item_id = ?, link = ?, status = 'Not started', reason = ? WHERE id = ?",
                     (r["id"], r["url"], f"Replaced '{cur['title']}' after feedback: {value.replace('_', ' ')}.",
                      path_item_id))
        log(conn, user_id, f"resource {cur['id']} -> {r['id']}", f"feedback {value}", "replaced")
        msg = f"Replaced with: {r['title']}."
    elif value == "not_relevant":
        conn.execute("DELETE FROM path_items WHERE id = ?", (path_item_id,))
        log(conn, user_id, f"resource {cur['id']}", "feedback not_relevant", "removed")
        msg = "Removed from your path."
    else:
        msg = "Feedback saved; no alternative at that level yet."
    conn.commit()
    return msg


def is_inactive(last_active, now=None, days=INACTIVE_DAYS):
    if not last_active:
        return False
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    return now - datetime.fromisoformat(str(last_active)) > timedelta(days=days)


def risk_flag(readiness, progress_pct, last_quiz, inactive):
    """Mentor view risk: High / Medium / Low."""
    points = 2 if inactive else 0
    points += 1 if progress_pct < 20 else 0
    points += 1 if last_quiz is not None and last_quiz < FAIL else 0
    points += 1 if readiness < 40 else 0
    return "High" if points >= 3 else "Medium" if points >= 2 else "Low"
