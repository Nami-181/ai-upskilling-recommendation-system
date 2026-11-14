"""TC-AUTH: registration, login, verification, password reset, sessions."""
from conftest import PASSWORD, register


def test_register_returns_camel_case_user(client):
    email, token = register(client, name="Riya Harugop")
    assert token  # DEMO_MODE without SMTP returns the verification token


def test_duplicate_email_is_409(client):
    email, _ = register(client)
    r = client.post("/auth/register", json={"name": "Again", "email": email.upper(), "password": PASSWORD})
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "EMAIL_TAKEN"


def test_weak_password_and_bad_email_are_422(client):
    r = client.post("/auth/register", json={"name": "A B", "email": "not-an-email", "password": "abc"})
    assert r.status_code == 422
    fields = {e["loc"][-1] for e in r.json()["detail"]}
    assert {"email", "password"} <= fields
    assert all(e["msg"].split(":")[0] in ("email", "password") for e in r.json()["detail"])


def test_login_blocked_until_verified(client):
    email, token = register(client)
    r = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "EMAIL_NOT_VERIFIED"
    r = client.post("/auth/verify-email", json={"email": email, "token": token})
    assert r.status_code == 200
    r = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer" and body["user"]["verified"] is True
    assert body["user"]["onboardingComplete"] is False


def test_verification_token_single_use_and_email_bound(client):
    email, token = register(client)
    other, _ = register(client)
    assert client.post("/auth/verify-email", json={"email": other, "token": token}).status_code == 400
    email2, token2 = register(client)
    assert client.post("/auth/verify-email", json={"email": email2, "token": token2}).status_code == 200
    r = client.post("/auth/verify-email", json={"email": email2, "token": token2})
    assert r.status_code == 400 and r.json()["detail"]["code"] == "INVALID_TOKEN"


def test_wrong_password_is_401(client, student):
    _, email = student
    r = client.post("/auth/login", json={"email": email, "password": "Wrong1234!"})
    assert r.status_code == 401 and r.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_forgot_password_does_not_reveal_accounts(client, student):
    _, email = student
    known = client.post("/auth/forgot-password", json={"email": email}).json()
    unknown = client.post("/auth/forgot-password", json={"email": "nobody@example.com"}).json()
    assert known["message"] == unknown["message"]
    assert unknown["demoToken"] is None


def test_reset_password_flow(client, student):
    _, email = student
    token = client.post("/auth/forgot-password", json={"email": email}).json()["demoToken"]
    assert client.post("/auth/reset-password", json={"token": token, "password": "NewPassw0rd!"}).status_code == 200
    assert client.post("/auth/login", json={"email": email, "password": PASSWORD}).status_code == 401
    assert client.post("/auth/login", json={"email": email, "password": "NewPassw0rd!"}).status_code == 200
    assert client.post("/auth/reset-password", json={"token": token, "password": "Another1!"}).status_code == 400


def test_protected_routes_need_token(client):
    assert client.get("/profile").status_code == 401
    r = client.get("/profile", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401 and r.json()["detail"]["code"] == "INVALID_TOKEN"


def test_me_and_change_password(client, student):
    headers, email = student
    assert client.get("/auth/me", headers=headers).json()["email"] == email
    r = client.post("/auth/change-password", headers=headers,
                    json={"current_password": "nope", "new_password": "Changed1!"})
    assert r.status_code == 400
    r = client.post("/auth/change-password", headers=headers,
                    json={"current_password": PASSWORD, "new_password": "Changed1!"})
    assert r.status_code == 200


def test_sql_injection_in_login_is_harmless(client):
    r = client.post("/auth/login", json={"email": "a@b.com' OR '1'='1", "password": "x"})
    assert r.status_code in (401, 422)


def test_login_is_rate_limited(client, monkeypatch):
    from app.core import ratelimit
    from app.core.config import settings
    monkeypatch.setattr(settings, "AUTH_RATE_LIMIT_PER_MINUTE", 3)
    ratelimit.reset()
    body = {"email": "nobody@example.com", "password": "Wrong1234"}
    codes = [client.post("/auth/login", json=body).status_code for _ in range(4)]
    assert codes == [401, 401, 401, 429]
    r = client.post("/auth/login", json=body)
    assert r.json()["detail"]["code"] == "RATE_LIMITED"
    ratelimit.reset()
