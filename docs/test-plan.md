# Project test plan: LUMORA

| | |
| --- | --- |
| Project | AI-Powered Upskilling Recommendation and Automation System for Students (problem #22) |
| Team | 22, ProjectSync |
| Test lead | Rhea (M4, `@Rheanair30`) |
| Contributors | Nami (M2, backend tests), Riya (M3, AI accuracy tests), Nidhi (M1, UI checks) |
| Version | 1.0 (Sprint 2) |
| Standard | Structure follows IEEE 829 / ISO/IEC/IEEE 29119-3 test plan |

## 1. Purpose and objectives

The plan defines how LUMORA is verified against the SRS. It covers the functional requirements (FR-001 to FR-060, the Must and Should items in scope) and the non-functional requirements (NFR-001 to NFR-029). Objectives:

1. Every in-scope requirement is traced to at least one test case.
2. Auth, profile, recommendation, adaptivity and progress work end to end through the UI and the API.
3. The AI engine's recommendations are measurably relevant on labelled sample profiles, not only bug-free.
4. Security basics (auth, access control, injection, rate limiting) and performance targets are met.

## 2. Scope

**In scope (test items):** the FastAPI backend (`backend/app`), the AI engine (`backend/ai_engine`), the PostgreSQL schema and migrations, the React frontend (`frontend/`), deployment configuration (Docker, Render, Vercel) and the CI pipeline.

**Out of scope:** OAuth SSO (FR-002), the educator dashboard (FR-049), PDF export (FR-051, FR-060) and email reminders (FR-052). These are deferred (see [deviations.md](deviations.md)). Load testing at 10,000 concurrent users (NFR-003) is also out of scope, because the free-tier hosting cannot support it; single-request latency is measured instead.

## 3. Test approach (levels and types)

| Level / type | What | Tool | Owner | Automated |
| --- | --- | --- | --- | --- |
| Unit | AI engine functions: taxonomy, gap formula, ranking, ordering, schedule, quiz rules, feedback replacement | pytest (`tests/test_ai_engine.py`) | M3 / M4 | yes, CI |
| API / component | Every endpoint incl. validation and error codes, DB side effects | pytest + FastAPI TestClient (`test_auth.py`, `test_profile_catalog.py`, `test_recommendations.py`) | M2 / M4 | yes, CI |
| Database | Alembic migration applies on PostgreSQL 16; `alembic check` finds no drift between models and migrations | GitHub Actions Postgres service | M2 | yes, CI |
| Contract / integration | 37 requests in a realistic order with 48 assertions | Postman + Newman | M4 | yes, CI |
| Accuracy | Precision@3 of ranked gaps, prerequisite order, level fit on 8 labelled profiles | `python -m ai_engine.evaluate` | M3 / M4 | yes, CI |
| System / E2E | Full user journeys in Chrome against the real API | Manual script below + browser automation | M4 / M1 | semi |
| Security | Auth required, IDOR (other user's items → 404), SQL injection, weak passwords, rate limit, token reuse | pytest | M4 | yes |
| Performance | Latency of generate / roadmap / dashboard / search | timing script, 30 runs, p95 | M4 | on demand |
| Usability / accessibility | Responsive at 360 / 768 / 1280 px, keyboard navigation, labels, contrast | Manual checklist, Lighthouse | M1 | no |
| Static analysis | flake8 (backend), Vite production build (frontend) | CI | all | yes |

## 4. Test environment

| Environment | Database | Purpose |
| --- | --- | --- |
| Developer laptop | SQLite temporary file (created per test session) | fast unit and API tests |
| GitHub Actions (ubuntu-latest, Python 3.12, Node 20) | PostgreSQL 16 service container | CI gate on every pull request |
| Docker Compose | PostgreSQL 16 | integration and manual E2E |
| Render + Vercel | Render PostgreSQL | smoke test after deployment (`/health`, demo login) |

Test data: the seeded catalogue (33 skills, 9 roles, 76 resources); demo users `demo@lumora.app` and `admin@lumora.app`; random new users per test; and `ai_engine/data/sample_profiles.json` (SP1–SP8).

## 5. Entry and exit criteria

**Entry:** the feature branch builds; the backlog item has acceptance criteria; the migration (if any) is committed.

**Exit / pass criteria for a release:**
- 100% of automated tests pass on PostgreSQL in CI
- Line coverage ≥ 85% for `app` + `ai_engine` (CI gate)
- All 48 Newman assertions pass
- Mean precision@3 ≥ 0.85, prerequisite order valid 100%, level fit ≥ 0.85
- No open Critical or Major defects
- p95 of roadmap generation < 5 s (NFR-002); dashboard data < 3 s (NFR-001); search < 2 s (NFR-004)

**Suspension:** CI red on master, or a Critical defect in auth or data loss. Testing resumes after the fix is merged.

## 6. Defect management

Defects are GitHub issues using the *Bug report* template, with severity (Critical, Major, Minor), steps, expected and actual results, and the TC id. The fix PR links the issue with "Closes #n" and adds a regression test.

## 7. Test cases

| TC | Requirement | Test case | Expected result | Automated in |
| --- | --- | --- | --- | --- |
| TC-01 | FR-001 | Register with valid name, email, strong password | 201, camelCase user, verification token issued | test_auth::test_register_returns_camel_case_user |
| TC-02 | FR-001 | Register the same email twice | 409 EMAIL_TAKEN | test_auth::test_duplicate_email_is_409 |
| TC-03 | FR-001, NFR-010 | Register with weak password / invalid email | 422 with field message | test_auth::test_weak_password_and_bad_email_are_422 |
| TC-04 | FR-004 | Log in before verifying the email | 403 EMAIL_NOT_VERIFIED; after verification 200 | test_auth::test_login_blocked_until_verified |
| TC-05 | FR-004, NFR-010 | Reuse a verification token / use it with another email | 400 INVALID_TOKEN | test_auth::test_verification_token_single_use_and_email_bound |
| TC-06 | FR-001 | Wrong password | 401, generic message | test_auth::test_wrong_password_is_401 |
| TC-07 | FR-004, NFR-010 | Forgot password for known and unknown email | identical 200 response (no account enumeration) | test_auth::test_forgot_password_does_not_reveal_accounts |
| TC-08 | FR-004 | Reset password with token, log in with new password | old password rejected, new accepted | test_auth::test_reset_password_flow |
| TC-09 | FR-005, NFR-013 | Call protected endpoints without / with bad token | 401 | test_auth::test_protected_routes_need_token |
| TC-10 | FR-005, NFR-009 | /auth/me and change password | current user returned; password changed | test_auth::test_me_and_change_password |
| TC-11 | NFR-010 | SQL injection string as login email | 422/401, no error, no data leak | test_auth::test_sql_injection_in_login_is_harmless |
| TC-12 | NFR-011 | 4 login attempts with limit 3/min | 4th returns 429 RATE_LIMITED | test_auth::test_login_is_rate_limited |
| TC-13 | FR-006, FR-008, FR-010 | Save and read the profile | values round-trip; completion % updates | test_profile_catalog::test_profile_round_trip |
| TC-14 | FR-007, FR-009, FR-013 | Add course "Intro to Python" and project using SQL | skills python (2) and sql (3) inferred | test_profile_catalog::test_courses_and_projects_infer_skills |
| TC-15 | FR-006 | Invalid year / unknown skill / bad URL | 422 with field message | test_profile_catalog::test_profile_validation |
| TC-16 | FR-021 | Set target role by title instead of id | resolved to role id | test_profile_catalog::test_target_role_accepts_title |
| TC-17 | NFR-013 | Delete another student's course | 404 | test_profile_catalog::test_cannot_delete_other_users_course |
| TC-18 | FR-021, FR-029 | List roles and skills taxonomy | 9 roles, 33 skills in categories | test_profile_catalog::test_roles_and_skills |
| TC-19 | FR-024–026, NFR-004 | Filter resources by skill, type, free, text; paginate | only matching items; total + pages correct | test_profile_catalog::test_resource_filters_and_pagination |
| TC-20 | FR-029, NFR-013 | Create / update / delete resource as student and admin | student 403, admin 201/200/204 | test_profile_catalog::test_resource_crud_admin_only |
| TC-21 | FR-030, FR-031, FR-035, FR-036 | List project ideas and certifications | level, hours, provider, cost present | test_profile_catalog::test_project_ideas_and_certifications |
| TC-22 | FR-050 | Admin stats as admin | counts returned | test_profile_catalog::test_admin_stats |
| TC-23 | NFR-015 | Delete account | 204; the old token is rejected (401); data removed by cascade | test_profile_catalog::test_delete_account |
| TC-24 | NFR-015 | Export personal data | JSON attachment with profile, paths, recommendations | test_profile_catalog::test_export_personal_data |
| TC-25 | NFR-018 | Health check | 200 with database dialect | test_profile_catalog::test_health |
| TC-26 | FR-013–016 | Skill-gap analysis from saved profile | readiness %, ranked rows with severity | test_recommendations::test_analyze_uses_profile |
| TC-27 | FR-014 | Gap analysis with explicit skills | uses supplied levels | test_recommendations::test_analyze_with_explicit_skills |
| TC-28 | FR-021 | Generate path with no target role | 422 NO_TARGET_ROLE | test_recommendations::test_generate_requires_target_role |
| TC-29 | FR-018–020, FR-023 | Generate path | stored; modules in prerequisite order; each has reason, resources, project; week numbers increase | test_recommendations::test_path_is_stored_and_ordered |
| TC-30 | FR-017, FR-043, FR-045 | Quiz 100% on a module skill | module completed, skill level 4, later modules earlier | test_recommendations::test_quiz_pass_completes_module |
| TC-31 | FR-043, FR-044 | Quiz 0% | easier resource added, +hours, status in progress | test_recommendations::test_quiz_fail_adds_easier_resource_and_time |
| TC-32 | FR-040 | Quiz with unknown question / unknown skill | 422 / 404 | test_recommendations::test_quiz_validation |
| TC-33 | FR-046 | Feedback "too hard" on a resource | replaced with an easier one, reason updated, logged | test_recommendations::test_feedback_replaces_resource |
| TC-34 | FR-055 | Contact message without login | 201 stored | test_recommendations::test_contact_feedback_without_login |
| TC-35 | FR-038, FR-039, FR-041 | Mark items in progress / completed, log minutes | progress %, study hours, streak update | test_recommendations::test_item_status_and_progress |
| TC-36 | NFR-013 | Change another student's recommendation | 404 | test_recommendations::test_cannot_touch_other_students_items |
| TC-37 | FR-021, FR-057 | Career readiness and achievements | 9 roles sorted; badges unlocked | test_recommendations::test_careers_and_achievements |
| TC-38 | FR-029 | Datasets consistent (FKs, levels, 3 questions per skill) | no orphan ids, valid ranges | test_ai_engine::test_datasets_are_consistent |
| TC-39 | FR-011, FR-013 | Extract skills from text with synonyms | "Node.js, PostgreSQL, GitHub Actions" → nodejs, sql, ci_cd, git; "JavaScript" is not java | test_ai_engine::test_taxonomy |
| TC-40 | FR-014, FR-015 | Gap / severity / readiness formula on a hand-computed case | exact values | test_ai_engine::test_gap_formula, test_importance_prefers_skills_that_unlock_others |
| TC-41 | FR-018, FR-019 | Topological order and weekly packing | prerequisites first; weeks = ceil(cum hours / hpw) | test_ai_engine::test_order_respects_prereqs, test_schedule_packs_hours |
| TC-42 | FR-024, FR-028, FR-043 | Resource scoring and target difficulty | level-matched, free, preferred type ranked first; difficulty moves with quiz | test_ai_engine::test_resource_scoring_prefers_level_free_and_type, test_target_difficulty_adapts_to_quiz |
| TC-43 | FR-035 | Certifications follow readiness | foundational at low readiness, advanced at high | test_ai_engine::test_certifications_follow_readiness |
| TC-44 | FR-047 | Inactivity and risk flag | 8 days idle → inactive; risk High | test_ai_engine::test_inactivity_and_risk |
| TC-45 | FR-015, FR-018 | Accuracy on 8 labelled profiles | P@3 ≥ 0.85, prereq 100%, fit ≥ 0.85 | test_ai_engine::test_evaluation_meets_targets |
| TC-46 | all API | Postman collection in order | 48/48 assertions | CI job `api-e2e` (Newman) |
| TC-47 | NFR-001, NFR-002, NFR-004 | Latency, 30 runs each | p95 below targets | timing script (see test report) |
| TC-48 | NFR-022, FR-006–010 | E2E: sign up → verify link → 7-step onboarding → roadmap | lands on dashboard with generated roadmap | manual / browser |
| TC-49 | FR-043, FR-048 | E2E: demo login → roadmap → take quiz → dashboard and analytics update | module completed; charts update; no console errors | manual / browser |
| TC-50 | NFR-021, NFR-024 | Responsive and keyboard check of every app page | usable at 360 px; all controls reachable by Tab; dialogs close with Esc | manual |

## 8. Schedule

| Week | Activity |
| --- | --- |
| Sprint 1 (30 Oct – 12 Nov) | Test plan, auth and schema tests, prototype tests, CI skeleton |
| Sprint 2, week 1 (13 – 19 Nov) | API, AI unit, accuracy tests; Postman collection; CI on PostgreSQL |
| Sprint 2, week 2 (20 – 26 Nov) | E2E in browser, performance, deployment smoke tests, test report |

## 9. Risks and mitigation

| Risk | Mitigation |
| --- | --- |
| SQLite and PostgreSQL behave differently | CI runs the whole suite and migrations on PostgreSQL 16 |
| Recommendation "correctness" is subjective | Labelled sample profiles with agreed expected top gaps; metric thresholds in CI |
| Email delivery cannot be tested without SMTP | DEMO_MODE returns tokens; email links checked manually once SMTP is configured |
| Free-tier cold starts on Render skew latency | Measure warm latency; note cold start separately |
| Members' areas integrate late | Path-separated PRs, contract tests in Postman, CODEOWNERS reviews |

## 10. Deliverables

This plan; the automated test suites; `postman/LUMORA.postman_collection.json`; CI logs and Newman JUnit artefacts; [test-report.md](test-report.md).
