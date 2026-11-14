"""TC-AI: unit tests for the recommendation engine (no database)."""
from datetime import date

import pandas as pd
import pytest

from ai_engine import Catalog, analyze_gap, build_learning_path, grade_quiz, quiz_decision
from ai_engine.adaptive import feedback_replacement, is_inactive, risk_flag
from ai_engine.evaluate import evaluate
from ai_engine.gap import severity, unlock_counts
from ai_engine.planner import order_skills, schedule
from ai_engine.recommender import recommend_certifications, score_resources, target_difficulty
from ai_engine.taxonomy import dictionary, extract_skills, infer_levels, taxonomy_tree


@pytest.fixture(scope="module")
def cat():
    return Catalog.from_csv()


def test_datasets_are_consistent(cat):
    skills = set(cat.skills.skill_id)
    assert len(skills) == 33 and len(cat.roles) == 9
    assert set(cat.role_skills.skill_id) <= skills
    assert set(cat.resources.skill_id) <= skills
    assert set(cat.prereqs.skill_id) | set(cat.prereqs.prereq_skill_id) <= skills
    assert set(cat.certifications.role_id) <= set(cat.roles.role_id)
    assert cat.resources.level.between(1, 3).all() and cat.role_skills.weight.between(1, 3).all()
    assert (cat.quiz.groupby("skill_id").size() >= 3).all()


def test_taxonomy(cat):
    tree = taxonomy_tree(cat)
    assert sum(len(v) for v in tree.values()) == 33
    vocab = dictionary(cat)
    found = extract_skills("Built a REST API in Node.js, used PostgreSQL and CI/CD with GitHub Actions", vocab)
    assert {"nodejs", "sql", "ci_cd", "rest_api", "git"} <= found
    assert "java" not in extract_skills("JavaScript only", vocab)
    lv = infer_levels(vocab, courses=["Intro to Python"], projects=["Docker deployment"])
    assert lv == {"python": 2, "docker": 3}


def test_gap_formula():
    req = pd.DataFrame([("a", 3, 4), ("b", 1, 2)], columns=["skill_id", "weight", "required_level"])
    g = analyze_gap({"a": 2, "b": 5}, req)
    rows = {r["skill_id"]: r for r in g["rows"]}
    assert rows["a"]["gap"] == 6 and rows["a"]["severity"] == "High"
    assert rows["b"]["gap"] == 0 and rows["b"]["rank"] == 0
    assert g["readiness"] == round(100 * (3 * 2 + 1 * 2) / (3 * 4 + 1 * 2), 1)
    assert g["strengths"] == ["b"]
    assert [severity(x) for x in (0, 1, 3, 6)] == ["None", "Low", "Medium", "High"]


def test_importance_prefers_skills_that_unlock_others(cat):
    counts = unlock_counts(["python", "pandas", "machine_learning", "numpy"], cat.prereq_map())
    assert counts["python"] == 3 and counts["machine_learning"] == 0


def test_order_respects_prereqs():
    needed = {"b": {"importance": 0.9}, "a": {"importance": 0.1}, "c": {"importance": 0.5}}
    order = order_skills(needed, {"b": ["a"]})
    assert order.index("a") < order.index("b")
    assert sorted(order_skills({"x": {"importance": 1}, "y": {"importance": 1}}, {"x": ["y"], "y": ["x"]})) == ["x", "y"]


def test_schedule_packs_hours():
    mods = [{"hours": 10}, {"hours": 10, "status": "completed", "week_no": 1, "due_date": "2026-01-01"}, {"hours": 6}]
    finish = schedule(mods, 8, date(2026, 1, 1))
    assert mods[0]["week_no"] == 2 and mods[2]["week_no"] == 2 and finish == "2026-01-15"


def test_target_difficulty_adapts_to_quiz():
    assert target_difficulty(0) == 1 and target_difficulty(2) == 2 and target_difficulty(4) == 3
    assert target_difficulty(2, 30) == 1 and target_difficulty(2, 90) == 3 and target_difficulty(0, 10) == 1


def test_resource_scoring_prefers_level_free_and_type(cat):
    df = pd.DataFrame([
        {"resource_id": "x", "level": 1, "rating": 4.5, "is_free": 1, "type": "course", "duration_hrs": 5},
        {"resource_id": "y", "level": 3, "rating": 4.9, "is_free": 0, "type": "video", "duration_hrs": 40},
    ])
    s = score_resources(df, current=0, preferred_type="course").set_index("resource_id").score
    assert s["x"] > s["y"]
    s2 = score_resources(df, current=0, disliked={"x"}).set_index("resource_id").score
    assert s2["x"] < s["x"]


def test_full_path_for_beginner(cat):
    plan = build_learning_path(cat, {}, "data-scientist", hours_per_week=10, start=date(2026, 1, 1))
    order = [m["skill_id"] for m in plan["modules"]]
    assert order.index("python") < order.index("numpy") < order.index("pandas") < order.index("machine_learning")
    assert plan["readiness"] == 0 and plan["est_finish"] > "2026-01-01"
    assert all(m["reason"] and m["resources"] for m in plan["modules"])
    assert all(r["reason"].startswith("Recommended because") for m in plan["modules"] for r in m["resources"])


def test_no_path_when_ready(cat):
    lv = {r.skill_id: 5 for r in cat.role_requirements("ui-ux-designer").itertuples()}
    plan = build_learning_path(cat, lv, "ui-ux-designer")
    assert plan["modules"] == [] and plan["readiness"] == 100


def test_certifications_follow_readiness(cat):
    low = recommend_certifications(cat, "cybersecurity-analyst", 10)
    high = recommend_certifications(cat, "cybersecurity-analyst", 90)
    assert low[0]["level"] <= high[0]["level"]


def test_quiz_rules():
    assert grade_quiz([1, 2, 3], [1, 2, 0]) == pytest.approx(66.7)
    assert grade_quiz([], []) == 0
    assert quiz_decision(85)["action"] == "complete"
    assert quiz_decision(60)["action"] == "continue"
    d = quiz_decision(20, hours_per_week=6)
    assert d["action"] == "remediate" and d["extra_hours"] == 6 and d["new_level"] == 1


def test_feedback_replacement(cat):
    res = cat.resources_for("python")
    hard = res.sort_values("level").iloc[-1].to_dict()
    r = feedback_replacement(res, hard, "too_hard", set())
    assert r is None or r["level"] < hard["level"]
    easy = res.sort_values("level").iloc[0].to_dict()
    assert feedback_replacement(res, easy, "too_hard", set()) is None


def test_inactivity_and_risk():
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    assert is_inactive(now - timedelta(days=8), now) and not is_inactive(now - timedelta(days=2), now)
    assert risk_flag(20, 5, 30, True) == "High" and risk_flag(80, 60, 90, False) == "Low"


def test_evaluation_meets_targets():
    s = evaluate()["summary"]
    assert s["mean_precision_at_3"] >= 0.8
    assert s["prereq_valid_rate"] == 1.0
    assert s["mean_level_fit"] >= 0.8
