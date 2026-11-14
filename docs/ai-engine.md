# AI / ML engine (Member 3)

Package: `backend/ai_engine`, a pure Python library (pandas and NumPy) that is called by the API and tested on its own.

## Datasets (`ai_engine/data`)

| File | Rows | Content |
| --- | --- | --- |
| skills.csv | 33 | id, name, category, synonyms (for extraction) |
| skill_prereqs.csv | 24 | prerequisite edges (DAG) |
| career_roles.csv | 9 | Data Scientist, Machine Learning Engineer, Full-Stack Web Developer, Data Analyst, Cloud / DevOps Engineer, Cybersecurity Analyst, Android Developer, UI/UX Designer, Software Engineer (SDE) |
| role_skills.csv | 67 | required level (1–5) and weight (1–3) per role skill, trimmed from O*NET technology skills |
| resources.csv | 76 | title, provider, URL, type, level 1–3, hours, free, rating |
| project_ideas.csv | 37 | per-skill projects with level and hours |
| certifications.csv | 17 | per-role certifications with provider, cost, level, prep time, free flag |
| quiz_questions.csv | 99 | 3 multiple-choice questions per skill |
| sample_profiles.json | 8 | labelled test profiles (SP1–SP8) with the gaps a reviewer expects first |

## Pipeline

1. **Taxonomy and extraction** (`taxonomy.py`): synonyms → skill ids. Courses imply level 2 and projects level 3 (resume text level 2); the highest evidence is kept.
2. **Gap scoring** (`gap.py`), for each role skill *s*:
   - shortfall = max(0, required − current); gap = weight × shortfall
   - severity: High if gap ≥ 6, Medium if ≥ 3, Low if > 0
   - readiness = 100 × Σ w·min(current, required) / Σ w·required
   - **importance** = 0.5·w/3 + 0.35·shortfall/5 + 0.15·min(unlocks, 3)/3, where *unlocks* is how many missing skills depend on *s*
3. **Path planning** (`planner.py`): missing skills plus unknown prerequisites (target level 2) → Kahn topological sort with a priority heap on importance → hours = 8 h per missing level + project hours → packed into the student's weekly hours to give week numbers and due dates.
4. **Resource ranking** (`recommender.py`):
   score = 0.45·level_match + 0.20·rating/5 + 0.15·free + 0.15·type_match + 0.05·brevity − 0.30·disliked,
   where level_match = 1 − |level − target_difficulty| / 2. The target difficulty is 1 for current ≤ 1, 2 for 2, 3 for ≥ 3; it is lowered by 1 after a quiz < 50% and raised by 1 after ≥ 80%. The top 3 are chosen, each with a reason sentence.
5. **Projects and certifications**: a project closest to the target difficulty; certifications whose level matches readiness (< 40% → foundational, < 75% → associate, else professional), with free ones preferred.
6. **Adaptivity** (`adaptive.py`):
   - Quiz ≥ 80%: level 4, module complete, reschedule.
   - Quiz 50–79%: level 2, continue.
   - Quiz < 50%: level 1, add an easier resource and one week of hours.
   - Feedback "too easy", "too hard" or "not relevant": swap the resource one level up or down, or remove it.
   - Seven days without activity: nudge notification. A risk flag combines inactivity, progress, last quiz and readiness.

Why rule-based, content-based ranking instead of collaborative filtering: there is no interaction history at launch (cold start), and the SRS asks for explainable recommendations (FR-023). Every weight is visible and unit-tested. Once feedback data accumulates, the `feedback` table can train a learned ranker.

## Evaluation: `python -m ai_engine.evaluate`

| Profile | Role | Readiness | Precision@3 | Prereq order | Level fit |
| --- | --- | --- | --- | --- | --- |
| SP1 | Data Scientist | 29.9% | 1.00 | ok | 0.95 |
| SP2 | Full-Stack Web Developer | 36.1% | **0.67** | ok | 0.94 |
| SP3 | Cloud/DevOps Engineer | 12.3% | 1.00 | ok | 0.91 |
| SP4 | Data Analyst | 0.0% | 1.00 | ok | 1.00 |
| SP5 | Cybersecurity Analyst | 22.0% | 1.00 | ok | 0.87 |
| SP6 | UI/UX Designer | 17.5% | 1.00 | ok | 1.00 |
| SP7 | Data Scientist (already ready) | 100% | 1.00 (no gaps) | ok | 1.00 |
| SP8 | Software Engineer (SDE) | 27.5% | 1.00 | ok | 0.95 |
| **Mean** | | | **0.959** | **100%** | **0.953** |

Targets (asserted in `tests/test_ai_engine.py`): precision@3 ≥ 0.85, prerequisite order valid for 100% of profiles, level fit ≥ 0.85.

**Known miss (SP2):** the reviewer expected Node.js in the top 3, but the engine ranks CSS third. CSS has the same weight but unlocks React, so the unlock term raises it. This is defensible (prerequisites first) but disagrees with the label. It is recorded as a tuning item for the next sprint, not hidden.
