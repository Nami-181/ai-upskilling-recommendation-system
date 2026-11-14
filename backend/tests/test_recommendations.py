"""TC-REC / TC-ADAPT / TC-PROG: gap analysis, learning paths, quizzes, feedback, progress."""


def _generate(client, headers):
    r = client.post("/recommendations/generate", headers=headers, json={})
    assert r.status_code == 200, r.text
    return r.json()


def test_analyze_uses_profile(client, student):
    headers, _ = student
    r = client.post("/analyze/skills", headers=headers, json={}).json()
    assert r["target_role"] == "Data Scientist"
    by = {s["skill_id"]: s for s in r["skills"]}
    assert by["python"]["current"] == 3 and by["python"]["required"] == 4
    ranks = [s["rank"] for s in r["skills"] if s["gap"] > 0]
    assert ranks == sorted(ranks) and ranks[0] == 1
    assert 0 < r["readiness"] < 100


def test_analyze_with_explicit_skills(client, student):
    headers, _ = student
    r = client.post("/analyze/skills", headers=headers, json={
        "target_role": "Data Analyst", "skills": [{"name": "Excel", "level": 4}, {"name": "SQL", "level": 4}]})
    by = {s["skill_id"]: s for s in r.json()["skills"]}
    assert by["excel"]["gap"] == 0 and by["sql"]["gap"] == 0
    bad = client.post("/analyze/skills", headers=headers, json={"skills": [{"name": "Excel", "level": 9}]})
    assert bad.status_code == 422


def test_generate_requires_target_role(client):
    from conftest import register
    email, token = register(client)
    t = client.post("/auth/verify-email", json={"email": email, "token": token}).json()["access_token"]
    r = client.post("/recommendations/generate", headers={"Authorization": f"Bearer {t}"}, json={})
    assert r.status_code == 422 and r.json()["detail"]["code"] == "NO_TARGET_ROLE"


def test_path_is_stored_and_ordered(client, student):
    headers, _ = student
    g = _generate(client, headers)
    assert g["path"]["role_id"] == "data-scientist" and g["modules"]
    order = [m["skill_id"] for m in g["modules"]]
    assert order.index("numpy") < order.index("pandas") < order.index("machine_learning")
    assert all(1 <= len(m["resources"]) <= 3 for m in g["modules"])
    assert g["certifications"] and all(c["reason"] for c in g["certifications"])
    again = client.get("/recommendations", headers=headers).json()
    assert again["path"]["id"] == g["path"]["id"]
    g2 = _generate(client, headers)
    assert g2["path"]["id"] != g["path"]["id"]  # old path replaced, new one active


def test_quiz_pass_completes_module(client, student):
    headers, _ = student
    g = _generate(client, headers)
    quiz = client.get("/quizzes/statistics", headers=headers).json()
    assert all("answer_index" not in q for q in quiz["questions"])
    first = client.post("/quizzes/statistics/attempts", headers=headers,
                        json={"answers": {q["id"]: 0 for q in quiz["questions"]}}).json()
    answers = first["correct"]
    r = client.post("/quizzes/statistics/attempts", headers=headers, json={"answers": answers}).json()
    assert r["score"] == 100 and r["action"] == "complete" and r["new_level"] == 4
    path = client.get("/recommendations", headers=headers).json()
    stats = next(m for m in path["modules"] if m["skill_id"] == "statistics")
    assert stats["status"] == "completed"
    assert path["path"]["est_finish"] <= g["path"]["est_finish"]


def test_quiz_fail_adds_easier_resource_and_time(client, student):
    headers, _ = student
    g = _generate(client, headers)
    before = next(m for m in g["modules"] if m["skill_id"] == "pandas")
    quiz = client.get("/quizzes/pandas", headers=headers).json()
    wrong = {q["id"]: 3 for q in quiz["questions"]}
    r = client.post("/quizzes/pandas/attempts", headers=headers, json={"answers": wrong}).json()
    assert r["action"] == "remediate" and r["score"] < 50
    after = next(m for m in client.get("/recommendations", headers=headers).json()["modules"]
                 if m["skill_id"] == "pandas")
    assert after["hours"] == before["hours"] + 8
    assert len(after["resources"]) >= len(before["resources"])
    titles = [n["title"] for n in client.get("/notifications", headers=headers).json()]
    assert any("extra practice" in t for t in titles)


def test_quiz_validation(client, student):
    headers, _ = student
    assert client.get("/quizzes/unknown-skill", headers=headers).status_code == 404
    r = client.post("/quizzes/sql/attempts", headers=headers, json={"answers": {"q999": 1}})
    assert r.status_code == 422


def test_feedback_replaces_resource(client, student):
    headers, _ = student
    g = _generate(client, headers)
    mod = next(m for m in g["modules"] if m["skill_id"] == "machine_learning")
    rec = mod["resources"][0]
    r = client.post("/feedback", headers=headers, json={"item_id": rec["id"], "item_type": "recommendation",
                                                        "value": "not_relevant"}).json()
    assert r["ok"]
    after = next(m for m in client.get("/recommendations", headers=headers).json()["modules"]
                 if m["skill_id"] == "machine_learning")
    assert rec["item_id"] not in [x["item_id"] for x in after["resources"]]


def test_contact_feedback_without_login(client):
    r = client.post("/feedback", json={"type": "contact", "name": "Visitor", "email": "v@example.com",
                                       "subject": "Hi", "message": "Hello"})
    assert r.status_code == 200
    assert client.post("/feedback", json={"type": "recommendation", "item_id": 1}).status_code == 401


def test_item_status_and_progress(client, student):
    headers, _ = student
    g = _generate(client, headers)
    mod = g["modules"][0]
    for item in mod["resources"] + [mod["project"]]:
        r = client.patch(f"/recommendations/{item['id']}", headers=headers, json={"status": "completed"})
        assert r.status_code == 200
    updated = client.get("/recommendations", headers=headers).json()
    assert updated["modules"][0]["progress"] == 100 and updated["path"]["progress"] > 0
    p = client.post("/progress", headers=headers, json={"item_type": "study", "minutes": 90}).json()
    assert p["study_hours_total"] >= 1.5 and p["streak_days"] >= 1 and p["daily_hours"][-1]["hours"] >= 1.5
    r = client.post("/progress", headers=headers, json={"item_type": "module", "item_id": mod["id"],
                                                        "status": "completed"}).json()
    assert r["milestones_completed"] >= 1
    assert client.post("/progress", headers=headers, json={"item_type": "study", "minutes": 0}).status_code == 422
    assert client.patch("/recommendations/999999", headers=headers, json={"status": "done"}).status_code == 422


def test_cannot_touch_other_students_items(client, student):
    headers, _ = student
    g = _generate(client, headers)
    rec_id = g["modules"][0]["resources"][0]["id"]
    from conftest import register
    email, token = register(client)
    t = client.post("/auth/verify-email", json={"email": email, "token": token}).json()["access_token"]
    other = {"Authorization": f"Bearer {t}"}
    assert client.patch(f"/recommendations/{rec_id}", headers=other, json={"status": "completed"}).status_code == 404
    assert client.patch(f"/roadmap/modules/{g['modules'][0]['id']}", headers=other,
                        json={"status": "completed"}).status_code == 404


def test_careers_and_achievements(client, student):
    headers, _ = student
    careers = client.get("/analyze/careers", headers=headers).json()
    assert len(careers) == 9 and careers[0]["readiness"] >= careers[-1]["readiness"]
    _generate(client, headers)
    badges = {b["id"]: b["earned"] for b in client.get("/achievements", headers=headers).json()}
    assert badges["first-roadmap"] is True and badges["finished"] is False
    assert client.post("/notifications/read", headers=headers).json()["ok"]
