"""Lab 7: property-based fuzzing of input validation (Hypothesis).

Each test generates hundreds of random or malformed inputs and checks a property
that must hold for every input:

* API endpoints never answer with a 5xx: bad input is rejected with 4xx and the
  uniform error body {"detail": ...}.
* The AI engine never crashes and keeps its invariants (readiness 0-100,
  prerequisites before the skills that need them, quiz score 0-100).
"""
import string

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from ai_engine import Catalog, analyze_gap, build_learning_path, grade_quiz
from ai_engine.taxonomy import dictionary, extract_skills

FUZZ = settings(max_examples=150, deadline=None,
                suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])

# Any JSON value, nested a little: the kind of junk a broken or hostile client sends.
json_values = st.recursive(
    st.none() | st.booleans() | st.integers(-10**12, 10**12) | st.floats(allow_nan=False, allow_infinity=False) | st.text(max_size=60),
    lambda children: st.lists(children, max_size=4) | st.dictionaries(st.text(max_size=12), children, max_size=4),
    max_leaves=12,
)
weird_text = st.text(alphabet=st.characters(blacklist_categories=("Cs",)), max_size=300) | st.sampled_from([
    "", " ", "'; DROP TABLE users; --", "<script>alert(1)</script>", "\x00", "../../etc/passwd",
    "A" * 5000, "😀" * 50, "%s%s%n", "{{7*7}}", "null", "-1", "1e309"])


def assert_handled(r):
    assert r.status_code < 500, f"server error {r.status_code}: {r.text[:300]}"
    if r.status_code >= 400:
        assert "detail" in r.json()


@pytest.fixture(scope="module")
def cat():
    return Catalog.from_csv()


# ---------------- API fuzzing ----------------
@FUZZ
@given(body=st.dictionaries(st.sampled_from(["name", "email", "password", "extra"]), json_values | weird_text))
def test_fuzz_register(client, body):
    assert_handled(client.post("/auth/register", json=body))


@FUZZ
@given(email=weird_text, password=weird_text)
def test_fuzz_login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert_handled(r)
    assert r.status_code != 200  # random credentials never log in


@FUZZ
@given(body=st.fixed_dictionaries({}, optional={
    "firstName": weird_text, "program": weird_text, "year": json_values, "weeklyHoursGoal": json_values,
    "targetRoleId": weird_text, "interests": json_values, "bio": weird_text,
    "skills": st.lists(st.fixed_dictionaries({"skill_id": weird_text, "level": json_values}), max_size=5)}))
def test_fuzz_profile_update(client, student, body):
    headers, _ = student
    assert_handled(client.put("/profile", headers=headers, json=body))


@FUZZ
@given(title=weird_text, desc=weird_text, url=weird_text)
def test_fuzz_project_and_course(client, student, title, desc, url):
    headers, _ = student
    assert_handled(client.post("/profile/projects", headers=headers,
                               json={"title": title, "description": desc, "url": url}))
    assert_handled(client.post("/profile/courses", headers=headers, json={"title": title, "provider": desc}))


@FUZZ
@given(role=st.none() | weird_text,
       skills=st.none() | st.lists(st.dictionaries(st.sampled_from(["skill_id", "name", "level", "current"]),
                                                   json_values | weird_text), max_size=5))
def test_fuzz_analyze_skills(client, student, role, skills):
    headers, _ = student
    assert_handled(client.post("/analyze/skills", headers=headers, json={"target_role": role, "skills": skills}))


@FUZZ
@given(skill=st.text(alphabet=string.ascii_letters + string.digits + "-_", min_size=1, max_size=20),
       answers=st.dictionaries(weird_text, json_values, max_size=6))
def test_fuzz_quiz_submission(client, student, skill, answers):
    headers, _ = student
    assert_handled(client.post(f"/quizzes/{skill}/attempts", headers=headers, json={"answers": answers}))


@FUZZ
@given(body=st.dictionaries(st.sampled_from(["type", "item_id", "value", "rating", "comment", "email", "message"]),
                            json_values | weird_text))
def test_fuzz_feedback(client, body):
    assert_handled(client.post("/feedback", json=body))


@FUZZ
@given(q=weird_text, kind=weird_text, page=json_values)
def test_fuzz_catalogue_search(client, q, kind, page):
    assert_handled(client.get("/resources", params={"q": q, "type": kind, "page": str(page)}))


# ---------------- AI engine fuzzing ----------------
@FUZZ
@given(data=st.data())
def test_fuzz_gap_and_path_invariants(cat, data):
    skills = list(cat.skills.skill_id)
    role = data.draw(st.sampled_from(list(cat.roles.role_id)))
    levels = data.draw(st.dictionaries(st.sampled_from(skills), st.integers(0, 5), max_size=15))
    hours = data.draw(st.integers(-5, 80))
    gap = analyze_gap(levels, cat.role_requirements(role), cat.prereq_map(), cat.skill_names())
    assert 0 <= gap["readiness"] <= 100
    plan = build_learning_path(cat, levels, role, hours_per_week=hours)
    order = [m["skill_id"] for m in plan["modules"]]
    prereqs = cat.prereq_map()
    for i, sid in enumerate(order):
        for p in prereqs.get(sid, []):
            if p in order:
                assert order.index(p) < i, f"{p} must come before {sid}"
    assert all(m["week_no"] >= 1 and m["hours"] > 0 for m in plan["modules"])


@FUZZ
@given(text=weird_text)
def test_fuzz_skill_extraction(cat, text):
    found = extract_skills(text, dictionary(cat))
    assert found <= set(cat.skills.skill_id)


@FUZZ
@given(key=st.lists(st.integers(0, 3), max_size=10), answers=st.lists(st.integers(-5, 10), max_size=12))
def test_fuzz_quiz_grading(key, answers):
    assert 0 <= grade_quiz(key, answers) <= 100


# ---------------- regression for the bug the fuzzer found (D-08) ----------------
@pytest.mark.parametrize("body", [{"title": "My\u0000app", "description": "x"}, {"title": "ok title", "url": "\u0000"}])
def test_nul_characters_are_rejected_not_500(client, student, body):
    headers, _ = student
    r = client.post("/profile/projects", headers=headers, json=body)
    assert r.status_code == 422  # rejected as invalid input, never a 500


def test_nul_in_query_is_rejected(client):
    r = client.get("/resources", params={"q": "py\x00thon"})
    assert r.status_code == 422
