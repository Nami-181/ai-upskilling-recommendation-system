"""TC-PROF / TC-CAT: student profile, skills, courses, projects, catalogue and resource CRUD."""


def test_profile_round_trip(client, student):
    headers, _ = student
    p = client.get("/profile", headers=headers).json()
    assert p["targetRole"] == "Data Scientist" and p["targetRoleId"] == "data-scientist"
    assert {s["skillId"]: s["level"] for s in p["skills"]} == {"python": 3, "sql": 1}
    assert p["onboardingComplete"] is True and 0 < p["profileCompletion"] <= 100


def test_courses_and_projects_infer_skills(client, student):
    headers, _ = student
    r = client.post("/profile/projects", headers=headers, json={
        "title": "Dashboard", "description": "Built with React and Docker", "tech_stack": "React, Docker",
        "url": "https://github.com/example/dashboard"})
    assert r.status_code == 201
    pid = r.json()["id"]
    r = client.post("/profile/courses", headers=headers, json={"title": "Intro to Statistics", "provider": "Khan"})
    assert r.status_code == 201
    skills = {s["skillId"]: s for s in client.get("/profile", headers=headers).json()["skills"]}
    assert skills["react"]["level"] == 3 and skills["react"]["source"] == "project"
    assert skills["statistics"]["level"] == 2
    assert client.delete(f"/profile/projects/{pid}", headers=headers).status_code == 204
    assert client.delete(f"/profile/projects/{pid}", headers=headers).status_code == 404


def test_profile_validation(client, student):
    headers, _ = student
    assert client.put("/profile", headers=headers, json={"year": 9}).status_code == 422
    assert client.put("/profile", headers=headers, json={"targetRoleId": "astronaut"}).status_code == 422
    r = client.put("/profile", headers=headers, json={"skills": [{"skill_id": "python", "level": 7}]})
    assert r.status_code == 422
    r = client.put("/profile", headers=headers, json={"skills": [{"skill_id": "cobol", "level": 2}]})
    assert r.status_code == 422 and r.json()["detail"]["code"] == "UNKNOWN_SKILL"
    r = client.post("/profile/projects", headers=headers, json={"title": "X1", "url": "not a url"})
    assert r.status_code == 422


def test_target_role_accepts_title(client, student):
    headers, _ = student
    r = client.put("/profile", headers=headers, json={"targetRoleId": "UI/UX Designer"})
    assert r.json()["targetRoleId"] == "ui-ux-designer"


def test_cannot_delete_other_users_course(client, student):
    headers, _ = student
    cid = client.post("/profile/courses", headers=headers, json={"title": "Some course"}).json()["id"]
    from conftest import register
    email, token = register(client)
    other = client.post("/auth/verify-email", json={"email": email, "token": token}).json()["access_token"]
    r = client.delete(f"/profile/courses/{cid}", headers={"Authorization": f"Bearer {other}"})
    assert r.status_code == 404


def test_roles_and_skills(client):
    roles = client.get("/roles").json()
    assert len(roles) == 9 and {"id", "title"} <= set(roles[0])
    detail = client.get("/roles/data-scientist").json()
    assert detail["requirements"][0]["weight"] == 3
    assert client.get("/roles/nope").status_code == 404
    tree = client.get("/skills/taxonomy").json()
    assert "Data" in tree and any(s["skill_id"] == "pandas" for s in tree["Data"])


def test_resource_filters_and_pagination(client):
    r = client.get("/resources", params={"skill": "python", "free": True, "size": 2}).json()
    assert r["total"] >= 2 and len(r["items"]) == 2 and all(i["is_free"] for i in r["items"])
    q = client.get("/resources", params={"q": "'; DROP TABLE resources; --"}).json()
    assert q["total"] == 0
    assert client.get("/resources").json()["total"] > 50  # table still there


def test_resource_crud_admin_only(client, student, admin):
    headers, _ = student
    body = {"skill_id": "python", "title": "New Python course", "provider": "Test", "url": "https://example.com/py",
            "type": "course", "level": 1, "duration_hrs": 3, "is_free": True, "rating": 4.2}
    assert client.post("/resources", headers=headers, json=body).status_code == 403
    r = client.post("/resources", headers=admin, json=body)
    assert r.status_code == 201
    rid = r.json()["id"]
    assert client.put(f"/resources/{rid}", headers=admin, json={"rating": 4.9}).json()["rating"] == 4.9
    assert client.put(f"/resources/{rid}", headers=admin, json={"level": 5}).status_code == 422
    assert client.delete(f"/resources/{rid}", headers=admin).status_code == 204
    assert client.get(f"/resources/{rid}").status_code == 404
    bad = {**body, "skill_id": "cobol"}
    assert client.post("/resources", headers=admin, json=bad).status_code == 422


def test_project_ideas_and_certifications(client):
    assert all(p["skill_id"] == "sql" for p in client.get("/project-ideas", params={"skill": "sql"}).json())
    certs = client.get("/certifications", params={"role": "data-scientist"}).json()
    assert certs and all(c["role_id"] == "data-scientist" for c in certs)


def test_admin_stats(client, admin, student):
    s = client.get("/admin/stats", headers=admin).json()
    assert s["users"] >= 2 and s["resources"] > 50
    assert client.get("/admin/stats", headers=student[0]).status_code == 403


def test_delete_account(client):
    from conftest import register
    email, token = register(client)
    t = client.post("/auth/verify-email", json={"email": email, "token": token}).json()["access_token"]
    h = {"Authorization": f"Bearer {t}"}
    assert client.delete("/profile", headers=h).status_code == 204
    assert client.get("/profile", headers=h).status_code == 401


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_export_personal_data(client, student):
    headers, email = student
    client.post("/recommendations/generate", headers=headers, json={})
    r = client.get("/profile/export", headers=headers)
    assert r.status_code == 200
    assert "attachment" in r.headers["content-disposition"]
    data = r.json()
    assert data["profile"]["email"] == email
    assert data["learning_paths"] and data["recommendations"]
    assert client.get("/profile/export").status_code == 401
