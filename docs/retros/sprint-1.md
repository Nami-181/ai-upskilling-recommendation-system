# Sprint 1 retrospective

**Sprint:** 1 (30 Oct – 12 Nov 2026) · **Goal:** requirements, design, project setup, auth + profile + resume upload
**Framework:** Start / Stop / Continue · **Facilitator (Scrum Master):** _name_

## 1. Preparation

| Item | Notes |
| --- | --- |
| Previous action items | First retro: reviewed the Sprint 1 goal instead |
| Metrics | Planned points: __ · Completed: __ · FRs done: __ / 9 (FR-01–03, 05–10) · Bugs found: __ · Test coverage: __% |
| Burndown | Attach a screenshot from GitHub Projects |
| Safety form | Anonymous Google Form sent on __; average safety score: __ / 5 |

## 2. Set the stage

- Prime Directive read: "Regardless of what we discover, we understand and truly believe that everyone did the best job they could..."
- Icebreaker (one word for the sprint): __

## 3. Gather data

| Went well | Didn't go well | Improve |
| --- | --- | --- |
| Reused the idea of an existing resume analyser instead of starting from zero | Old resume-parsing libraries (PyResparser, Python 3.6) didn't install on current Python | Pin versions; check that libraries are maintained before choosing them |
| Requirements sheet agreed early | Scope started enterprise-sized (60 FRs) | Keep the MoSCoW split; only Must items in the sprint |
| | | |

**Timeline:** day __ setup issues · day __ scope cut · day __ SRS approved · day __ first login working

## 4. Generate insights

**Themes (affinity map):** Environment/setup · Scope creep · Communication · Technical debt

**5 Whys on the top problem:**
1. Why was resume parsing late? The library failed to install.
2. Why? It needs an old Python and spaCy version.
3. Why did we pick it? It was in the reference project.
4. Why wasn't that caught? Nobody checked when it was last maintained.
5. Why? No checklist for choosing dependencies. **Root cause.**

## 5. Decide actions (dot voting → SMART)

| # | Action | Owner | Due | Done when |
| --- | --- | --- | --- | --- |
| 1 | Pin all versions in requirements.txt; CI installs from scratch on every push | Dev lead | 15 Nov 2026 | CI green on a fresh runner |
| 2 | Check each new library for last release < 12 months before adding it | Whole team | Ongoing | Noted in PR description |

## 6. Close

- Commitments read out and agreed: yes / no
- ROTI (return on time invested) average: __ / 5

## 7. Follow-through

- [ ] Actions added to the Sprint 2 backlog with points
- [ ] This file committed to `docs/retros/`
