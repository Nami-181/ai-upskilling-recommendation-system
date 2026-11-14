from datetime import date, datetime, timedelta

import pytest

from upskill import adapt, auth, db, planner
from upskill.gap import compute_gap, role_requirements, severity
from upskill.skills import extract_skills, load_dictionary, parse_resume, student_levels

START = date(2026, 11, 2)


@pytest.fixture
def conn(tmp_path):
    c = db.connect(tmp_path / "test.db")
    db.init_db(c)
    yield c
    c.close()


def role_id(conn, title):
    return conn.execute("SELECT id FROM roles WHERE title = ?", (title,)).fetchone()[0]


def make_student(conn, role="Data Scientist", hours=10, skills=None):
    uid, err = auth.register(conn, "Test Student", f"t{datetime.now().timestamp()}@x.com", "secret1")
    assert err is None
    conn.execute("UPDATE student_profiles SET target_role_id = ?, hours_per_week = ? WHERE user_id = ?",
                 (role_id(conn, role), hours, uid))
    for s, lv in (skills or {}).items():
        conn.execute("INSERT INTO student_skills VALUES (?, ?, ?, 'self')", (uid, s, lv))
    conn.commit()
    return uid


# ---- gap ----

def test_readiness_zero_when_no_skills():
    res = compute_gap({}, [("python", 3, 4), ("sql", 2, 3)])
    assert res["readiness"] == 0
    assert [r["skill_id"] for r in res["rows"]] == ["python", "sql"]


def test_readiness_full_and_capped():
    res = compute_gap({"python": 5, "sql": 3}, [("python", 3, 4), ("sql", 2, 3)])
    assert res["readiness"] == 100
    assert all(r["gap"] == 0 for r in res["rows"])


def test_gap_formula_and_severity():
    row = compute_gap({"python": 1}, [("python", 3, 4)])["rows"][0]
    assert row["gap"] == 9 and row["severity"] == "High"
    assert severity(3) == "Medium" and severity(1) == "Low" and severity(0) == "None"


# ---- planner ----

def test_prerequisites_come_first(conn):
    reqs = role_requirements(conn, role_id(conn, "Machine Learning Engineer"))
    needed = planner.collect_skills({}, reqs, planner.prereq_map(conn))
    order = planner.order_skills(needed, planner.prereq_map(conn))
    pos = {s: i for i, s in enumerate(order)}
    for skill, pre in planner.prereq_map(conn).items():
        for p in pre:
            if skill in pos and p in pos:
                assert pos[p] < pos[skill], f"{p} must come before {skill}"
    # statistics is not an ML Engineer skill but is a prerequisite of machine_learning
    assert "statistics" in needed and needed["statistics"]["reason"].startswith("Prerequisite")


def test_known_skills_are_skipped(conn):
    reqs = role_requirements(conn, role_id(conn, "Data Analyst"))
    levels = {s: 5 for s, _, _ in reqs}
    plan = planner.build_plan(levels, reqs, planner.prereq_map(conn), *planner.load_catalog(conn), 10, start=START)
    assert plan["modules"] == []


def test_schedule_respects_hours_per_week():
    mods = [{"hours": 10}, {"hours": 10}, {"hours": 5}]
    finish = planner.schedule(mods, 10, START)
    assert [m["week_no"] for m in mods] == [1, 2, 3]
    assert finish == (START + timedelta(days=21)).isoformat()


def test_resource_ranking_prefers_level_free_and_type():
    res = [{"id": 1, "level": 3, "rating": 5, "is_free": 1, "type": "docs", "duration_hrs": 5},
           {"id": 2, "level": 1, "rating": 4.5, "is_free": 1, "type": "course", "duration_hrs": 5},
           {"id": 3, "level": 1, "rating": 4.5, "is_free": 0, "type": "course", "duration_hrs": 5}]
    assert [r["id"] for r in planner.rank_resources(res, have=0, preferred_type="course")] == [2, 3, 1]


def test_generate_path_saves_modules_items_and_reasons(conn):
    uid = make_student(conn, skills={"python": 3})
    pid = planner.generate_path(conn, uid, start=START)
    mods = conn.execute("SELECT * FROM path_modules WHERE path_id = ?", (pid,)).fetchall()
    assert len(mods) > 0
    assert "python" in {m["skill_id"] for m in mods}  # level 3 < required 4
    items = conn.execute("SELECT pi.* FROM path_items pi JOIN path_modules pm ON pm.id = pi.module_id "
                         "WHERE pm.path_id = ?", (pid,)).fetchall()
    assert items and all(i["reason"] for i in items)
    assert {"resource", "project"} <= {i["item_type"] for i in items}


def test_regenerate_replaces_active_path(conn):
    uid = make_student(conn)
    first = planner.generate_path(conn, uid, start=START)
    second = planner.generate_path(conn, uid, start=START)
    assert planner.active_path(conn, uid)["id"] == second != first


# ---- adaptation ----

def test_quiz_pass_completes_module_and_moves_finish_earlier(conn):
    uid = make_student(conn)
    pid = planner.generate_path(conn, uid, start=START)
    before = conn.execute("SELECT est_finish FROM learning_paths WHERE id = ?", (pid,)).fetchone()[0]
    adapt.record_quiz(conn, uid, "python", 100, today=START)
    m = conn.execute("SELECT status FROM path_modules WHERE path_id = ? AND skill_id = 'python'", (pid,)).fetchone()
    after = conn.execute("SELECT est_finish FROM learning_paths WHERE id = ?", (pid,)).fetchone()[0]
    assert m["status"] == "Done"
    assert after < before
    assert student_levels(conn, uid)["python"] == 4


def test_quiz_fail_adds_easier_resource_and_extends(conn):
    uid = make_student(conn)
    pid = planner.generate_path(conn, uid, start=START)
    m = conn.execute("SELECT * FROM path_modules WHERE path_id = ? AND skill_id = 'python'", (pid,)).fetchone()
    n_before = conn.execute("SELECT COUNT(*) FROM path_items WHERE module_id = ?", (m["id"],)).fetchone()[0]
    adapt.record_quiz(conn, uid, "python", 0, today=START)
    m2 = conn.execute("SELECT * FROM path_modules WHERE id = ?", (m["id"],)).fetchone()
    n_after = conn.execute("SELECT COUNT(*) FROM path_items WHERE module_id = ?", (m["id"],)).fetchone()[0]
    assert m2["hours"] == m["hours"] + 10
    assert m2["due_date"] > m["due_date"]
    assert n_after == n_before + 1
    assert conn.execute("SELECT COUNT(*) FROM recommendation_log WHERE action = 'rescheduled'").fetchone()[0] == 1


def test_feedback_too_hard_swaps_to_lower_level(conn):
    uid = make_student(conn, role="Data Scientist", skills={"python": 3})
    pid = planner.generate_path(conn, uid, start=START)
    item = conn.execute(
        "SELECT pi.id, r.level FROM path_items pi JOIN path_modules pm ON pm.id = pi.module_id "
        "JOIN resources r ON r.id = pi.item_id WHERE pm.path_id = ? AND pi.item_type = 'resource' "
        "ORDER BY r.level DESC LIMIT 1", (pid,)).fetchone()
    adapt.give_feedback(conn, uid, item["id"], "too_hard")
    new_level = conn.execute("SELECT r.level FROM path_items pi JOIN resources r ON r.id = pi.item_id "
                             "WHERE pi.id = ?", (item["id"],)).fetchone()
    assert conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0] == 1
    assert new_level is None or new_level[0] <= item["level"]


def test_inactivity_and_risk():
    now = datetime(2026, 11, 20)
    assert adapt.is_inactive("2026-11-10 10:00:00", now)
    assert not adapt.is_inactive("2026-11-18 10:00:00", now)
    assert adapt.risk_flag(20, 5, 30, True) == "High"
    assert adapt.risk_flag(90, 80, 90, False) == "Low"


# ---- skills / auth ----

def test_extract_skills_uses_boundaries(conn):
    d = load_dictionary(conn)
    found = extract_skills("Built a REST API with Flask, Pandas and JavaScript; deployed with Docker on AWS.", d)
    assert {"rest_api", "pandas", "javascript", "docker", "aws"} <= found
    assert "java" not in found  # 'JavaScript' must not match Java
    assert extract_skills("I took the rest of the week off", d) == set()


def test_parse_resume_fields(conn):
    text = "Asha Rao\nasha.rao@mail.com\nB.Tech Computer Science, 2027\nSkills: Python, SQL, Git, Tableau"
    out = parse_resume(text, load_dictionary(conn))
    assert out["name"] == "Asha Rao" and out["email"] == "asha.rao@mail.com"
    assert out["education"] and {"python", "sql", "git", "data_visualization"} <= set(out["skills"])


def test_auth_register_login_and_validation(conn):
    uid, err = auth.register(conn, "A", "a@b.com", "secret1")
    assert err is None
    assert auth.register(conn, "A", "a@b.com", "secret1")[1]  # duplicate
    assert auth.register(conn, "A", "bad", "secret1")[1]
    assert auth.register(conn, "A", "c@d.com", "123")[1]
    assert auth.login(conn, "A@B.com", "secret1")["id"] == uid
    assert auth.login(conn, "a@b.com", "wrong") is None
    stored = conn.execute("SELECT password_hash FROM users WHERE id = ?", (uid,)).fetchone()[0]
    assert stored != "secret1" and stored.startswith("$2")


def test_sql_injection_input_is_harmless(conn):
    assert auth.login(conn, "' OR '1'='1", "' OR '1'='1") is None
    assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 3


def test_seed_catalogue_is_consistent(conn):
    skills = {r[0] for r in conn.execute("SELECT id FROM skills")}
    for table in ("resources", "projects_catalog", "quiz_questions", "role_skills"):
        used = {r[0] for r in conn.execute(f"SELECT DISTINCT skill_id FROM {table}")}
        assert used <= skills, table
    with_quiz = {r[0] for r in conn.execute("SELECT DISTINCT skill_id FROM quiz_questions")}
    with_res = {r[0] for r in conn.execute("SELECT DISTINCT skill_id FROM resources")}
    assert with_quiz == skills and with_res == skills
