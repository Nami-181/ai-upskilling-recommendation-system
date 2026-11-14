# SkillPath AI: Upskilling Recommendation and Automation System for Students

A Streamlit web app that reads a student's profile (courses, projects, skills, resume), finds the skill gap for a target role, and builds a week-by-week learning path with curated resources, hands-on projects and certifications. It tracks progress and adapts the path from quiz scores and feedback.

## Features

| Area | What it does |
| --- | --- |
| Accounts | Sign-up/login with bcrypt-hashed passwords; Student, Mentor and Admin roles |
| Profile | Education, courses, projects, skills (levels 1–5), hours per week, preferred resource type |
| Resume upload | PDF → text → skill extraction with a 33-skill dictionary; the student confirms results before saving |
| Skill gap | Readiness % for 9 roles, ranked gaps (High / Medium / Low), have-vs-need chart |
| Learning path | Prerequisite-ordered modules, top 3 resources each, 1 project, weekly schedule, finish date, a reason for every item, role certifications |
| Progress | Status per item and module, dashboard, streak, quiz history |
| Adaptation | Quiz ≥ 80% → skill acquired, module completed, path moves earlier · quiz < 50% → easier resource added + one more week · "too easy / too hard / not relevant" feedback swaps resources · inactivity nudge after 7 days |
| Mentor | Assigned students sorted by risk (inactivity, low progress, failed quizzes, low readiness) |
| Admin | Edit resources, projects, certifications, quiz questions, role → skill maps, users and mentor assignment; stats and recommendation log |
| Export | Portfolio CSV and printable page; download or delete all personal data |

## Run it

```bash
pip install -r requirements.txt
streamlit run app.py
```

The SQLite database is created and seeded at `data/upskill.db` on first run. Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | student@demo.com | student123 |
| Mentor | mentor@demo.com | mentor123 |
| Admin | admin@demo.com | admin123 |

Docker: `docker build -t skillpath . && docker run -p 8501:8501 skillpath`

## Test

```bash
pip install -r requirements-dev.txt
flake8 upskill app.py tests
pytest --cov=upskill
```

21 tests cover the gap formula, prerequisite ordering, scheduling, resource ranking, adaptation rules, feedback, skill extraction, auth, SQL injection and a render of every page for each role. GitHub Actions runs lint and tests on every push.

## How recommendations work

1. **Skill levels** come from self-rating, the resume (level 2), projects (level 3) and quizzes (level 4 at ≥ 80%).
2. **Gap** per skill = weight × max(0, required − have). Readiness = Σ w·min(have, required) / Σ w·required.
3. **Order:** missing skills plus unknown prerequisites, topologically sorted with the biggest gaps first.
4. **Resources** score = 0.5·level match + 0.2·rating/5 + 0.15·free + 0.15·preferred type. Top 3 per module, plus the closest-level project.
5. **Schedule:** 8 h per missing level + project hours, packed into the student's weekly hours.
6. **Adapt:** quiz and feedback rules change levels, items and hours, then reschedule. Every change is logged with its reason.

## Project layout

```
app.py                 Streamlit UI (student, mentor, admin pages)
upskill/
  catalog_data.py      seed skills, roles, resources, projects, certifications, quizzes
  db.py                SQLite schema, seeding, helpers
  auth.py              registration, login, hashing
  skills.py            resume parsing and skill extraction
  gap.py               skill-gap analysis
  planner.py           path generation and scheduling
  adapt.py             adaptation rules, inactivity, risk
tests/                 pytest unit + Streamlit AppTest smoke tests
docs/SRS.md            long-term vision SRS
docs/retros/           sprint retrospectives
```

## Documents

- Requirements sheet (semester scope): [Claude Docs](https://claude.ai/artifact/2mhXV6kvRn2keYQJRW8uij)
- Long-term SRS: [docs/SRS.md](docs/SRS.md)
- Sprint 1 retrospective: [docs/retros/sprint-1.md](docs/retros/sprint-1.md)
- Data sources and attribution: [CREDITS.md](CREDITS.md)
