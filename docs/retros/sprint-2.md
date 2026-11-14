# Sprint 2 retrospective

**Sprint:** 2 (13 – 26 Nov 2026) · **Goal:** full stack. Profile, AI engine, stored recommendations, adaptivity, all app pages, tests, CI/CD and deployment.
**Framework:** Start / Stop / Continue · **Facilitator (Scrum Master):** _name_

> Pre-filled with the measured facts from the repository. The team fills in the opinion sections in the meeting.

## 1. Preparation (facts)

| Item | Value |
| --- | --- |
| Previous action items | Pin versions: partly (backend uses bounded ranges, e.g. sqlalchemy>=2.0.30,<2.1; exact pins still to do) · CI on a fresh runner ✔ (GitHub Actions, PostgreSQL service) |
| Planned points | 117 (31 items) |
| Completed points | 110. Open: LUM-36 live deployment (5), LUM-39 retro + demo video (2) |
| Points by member | Nidhi 28 · Nami 33 · Riya 32 · Rhea 22 · team 2 |
| Tests | 52 pytest (93% coverage) · Newman 48/48 · prototype 21/21 · CI green on master |
| Recommendation quality | precision@3 0.959 · prerequisite order 100% · level fit 0.953 |
| Defects | 4 found (1 Major, 3 Minor); 3 fixed, 1 open (SP2 ranking tuning) |
| PRs | #46 integration · #47 AI engine · #48 backend · #49 frontend · #50 docs, merged in dependency order |
| Burndown | Attach a screenshot from the GitHub milestone "Sprint 2" |

## 2. Set the stage

- Prime Directive read
- One word for the sprint: __

## 3. Gather data

| Went well | Didn't go well | Improve |
| --- | --- | --- |
| Reused fastapi/full-stack-fastapi-template instead of writing auth and DB setup from scratch | Frontend and backend contracts were agreed late (camelCase vs snake_case fields) | Agree API shapes (Postman collection) at sprint start |
| Engine as a pure library made it testable without the API | No local PostgreSQL; the first Postgres run was in CI | Use `docker compose up` for local Postgres |
| Labelled sample profiles gave a real accuracy number | Timezone bug in notifications found only in the browser | Always emit ISO 8601 with timezone; add an API test for it |
| __ | __ | __ |

## 4. Generate insights

**Top problem:** __ · **5 Whys:** __

## 5. Decide actions

| # | Action | Owner | Due | Done when |
| --- | --- | --- | --- | --- |
| 1 | Deploy to Render + Vercel and add the live URLs to the README | Rhea (M4) | __ | `/health` returns ok on the live URL |
| 2 | Tune the unlock weight so SP2 ranks Node.js in the top 3 | Riya (M3) | __ | `python -m ai_engine.evaluate` shows SP2 P@3 = 1.00 |
| 3 | __ | __ | __ | __ |

## 6. Close

- ROTI average: __ / 5
