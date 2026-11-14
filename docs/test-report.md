# Test report: LUMORA (Sprint 2)

**Date:** 14 Nov 2026 · **Build:** branch `feature/mvp-app` + Sprint 2 PRs · **Prepared by:** Team 22 (test lead: Rhea, M4)
Plan: [test-plan.md](test-plan.md)

## 1. Summary

| Suite | Result | Evidence |
| --- | --- | --- |
| Unit + API tests (pytest) | **52 / 52 passed** | `cd backend && pytest --cov=app --cov=ai_engine` |
| Line coverage (app + ai_engine) | **93%** (1907 statements, 135 missed); CI gate 85% | coverage report below |
| Static analysis | flake8 clean; `npm run build` succeeds | CI jobs `backend`, `frontend` |
| Migrations | `alembic upgrade head` on empty DB creates 21 tables; seed is idempotent | CI job `backend` |
| Postman / Newman | **37 requests, 48 / 48 assertions passed** | CI job `api-e2e`, JUnit artefact |
| Recommendation accuracy | **precision@3 0.959**, prereq order **100%**, level fit **0.953** (targets 0.85 / 100% / 0.85) | `python -m ai_engine.evaluate` |
| Browser E2E (TC-48, TC-49) | Passed, no console errors on 16 pages | Chrome run, see §5 |
| Performance (TC-47) | All p95 far below targets | §4 |
| Prototype (Sprint 1 Streamlit MVP) | 21 / 21 passed | CI job `prototype` |
| Open defects | 0 Critical, 0 Major, 1 Minor (accuracy tuning SP2) | §6 |

Exit criteria in the plan (§5) are **met**. The one exception is live deployment: the configuration is complete and tested in Docker, but publishing to Render and Vercel needs the team's accounts (LUM-36).

## 2. Requirement coverage

All 50 test cases (TC-01 to TC-50) were executed. TC-01 to TC-46 are automated in CI; TC-47 to TC-50 are manual or scripted. Every in-scope **Must** FR has at least one passing test. Deferred requirements are listed in [deviations.md](deviations.md).

## 3. Coverage by module

| Module | Coverage | Notes |
| --- | --- | --- |
| ai_engine (gap, planner, taxonomy, catalog, recommender, adaptive) | 89–100% | `evaluate.py` 83% (CLI printing) |
| app/core (config, db, security, errors, ratelimit) | 88–100% | |
| app/models.py, schemas.py | 99% | |
| app/services/paths.py, progress.py, students.py | 90–100% | |
| app/api/routes/auth, catalog, recommendations, profile | 87–93% | |
| app/api/routes/progress.py | 79% | notification read-all branches |
| app/api/routes/admin.py | 63% | user enable/disable and feedback list are tested manually only |
| app/services/email.py | 55% | the SMTP send path needs a real server; the log fallback is tested |

## 4. Performance (TC-47)

Warm API on a developer laptop (SQLite, single process), 30 runs each, demo student with a 7-module roadmap:

| Endpoint | Median | p95 | Target | Result |
| --- | --- | --- | --- | --- |
| POST /recommendations/generate | 168 ms | 176 ms | < 5 s (NFR-002) | pass |
| GET /recommendations (roadmap) | 29 ms | 32 ms | < 3 s (NFR-001) | pass |
| GET /progress (dashboard analytics) | 16 ms | 18 ms | < 3 s (NFR-001) | pass |
| POST /analyze/skills | 25 ms | 28 ms | < 3 s | pass |
| GET /resources?q=python&type=course | 4 ms | 5 ms | < 2 s (NFR-004) | pass |

The frontend production bundle is 157 kB gzip for the app plus 127 kB gzip for charts, which load in a separate chunk. A Render free-tier cold start (around 30–50 s) is a hosting limitation, not an application one.

## 5. End-to-end runs (Chrome, API + Vite dev server)

| Journey | Steps | Result |
| --- | --- | --- |
| New student (TC-48) | Sign up → open verification link → 7-step onboarding (career validation shown when skipped) → Data Analyst roadmap generated → dashboard | Pass |
| Demo student (TC-49) | Login → generate roadmap → take SQL quiz (100%) → module marked completed, later modules rescheduled → notifications show "Passed the SQL quiz" → analytics quiz chart updated | Pass |
| Page sweep | Dashboard, skill gap, careers, roadmap, resources, projects, certifications, analytics, notifications, achievements, wishlist, profile, profile edit, settings, support, onboarding | 0 console errors |
| Defect found and fixed | Notifications showed "5 h ago" for new events: naive UTC timestamps were parsed as local time | Fixed: API now emits ISO 8601 with `+00:00`; re-tested |
| Defect found and fixed | Settings page used validation rules that did not exist (crash on load) | Fixed and re-tested |

## 6. Accuracy results (TC-45)

| Profile | Role | P@3 | Prereq | Fit |
| --- | --- | --- | --- | --- |
| SP1 | Data Scientist | 1.00 | ok | 0.95 |
| SP2 | Full-Stack Web Developer | **0.67** | ok | 0.94 |
| SP3 | Cloud / DevOps Engineer | 1.00 | ok | 0.91 |
| SP4 | Data Analyst | 1.00 | ok | 1.00 |
| SP5 | Cybersecurity Analyst | 1.00 | ok | 0.87 |
| SP6 | UI/UX Designer | 1.00 | ok | 1.00 |
| SP7 | Data Scientist (no gaps) | 1.00 | ok | 1.00 |
| SP8 | Software Engineer (SDE) | 1.00 | ok | 0.95 |

**Minor defect (open):** in SP2 the engine ranks CSS above Node.js, because CSS unlocks React. Severity Minor: the target is still met. It is logged for tuning the unlock weight in the next sprint.

## 7. Defect log

| ID | Found by | Severity | Description | Status |
| --- | --- | --- | --- | --- |
| D-01 | E2E | Major | Settings page crashed: non-existent validation rules | Fixed |
| D-02 | E2E | Minor | Relative times off by timezone offset | Fixed |
| D-03 | flake8 / pytest | Minor | Tests imported helpers from `conftest` without a path | Fixed (pytest.ini `pythonpath`) |
| D-04 | Accuracy | Minor | SP2 top-3 ordering differs from the label | Open, tuning backlog |

## 8. Conclusion

The system meets the functional scope planned for Sprint 2 and the measurable NFRs that can be checked in this environment (performance, security basics, CI/CD, containerisation, accessibility checks). It is ready for deployment and the demo.
