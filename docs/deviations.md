# Deviations from the SRS, architecture and test plan

The SRS describes an enterprise-scale product (60 FRs). The team agreed MoSCoW priorities in Sprint 1 (see [retros/sprint-1.md](retros/sprint-1.md)). This page records every place where the delivered system differs, and why.

| # | Area | Planned | Delivered | Reason / impact |
| --- | --- | --- | --- | --- |
| 1 | Prototype | Streamlit app as the product (Sprint 1) | Kept as a prototype in `prototype/streamlit-mvp`; the product is React + FastAPI + PostgreSQL | The course objectives require a separate frontend, backend and database owned by different members. The prototype validated the algorithms, which were then moved into `backend/ai_engine`. |
| 2 | FR-002 OAuth SSO | Google, GitHub, LinkedIn | Not built (LUM-40, backlog) | Needs app registrations and HTTPS callback domains; email/password with verification covers FR-001/004. |
| 3 | FR-003 roles | Student, Educator, Admin | Student and Admin | No educator users in the pilot. `risk_flag` already exists in the engine for a future educator dashboard (LUM-41). |
| 4 | FR-011 resume upload | Resume / LinkedIn extraction | Skills inferred from course titles and project descriptions; the PDF resume upload exists only in the prototype | The same taxonomy extractor is used; adding PDF upload to the API is a small follow-up. |
| 5 | FR-012 LMS import | CSV / JSON import | Not built | Low priority (Should). |
| 6 | FR-032 / FR-033 project review | Submit links, rubric checks | Students record projects with links; no automated review | Automated rubric checks are out of scope for an MVP. |
| 7 | FR-037 cert exam dates | Track exam dates | Certifications are recommended and can be bookmarked; dates not tracked | Low priority. |
| 8 | FR-049, FR-051, FR-052, FR-059, FR-060 | Educator dashboard, PDF reports, email reminders, portfolio export | Backlog (LUM-41 to LUM-43); JSON data export is available | Time-boxed to two sprints. |
| 9 | Frontend scope | Lumora had "AI Learning Assistant", "Study Planner", "Learning Journal" in the navigation | Removed from navigation | Not in the SRS Must list; avoided showing pages without a backend. |
| 10 | FR-004 email | Real emails | Real SMTP when configured; otherwise **DEMO_MODE** returns the verification/reset token in the API response and the UI shows it in a demo box | Allows testing and demoing without an email provider. Must be turned off (`DEMO_MODE=false` + SMTP) for real users. |
| 11 | NFR-003 10k concurrent users | Load-tested | Single-request latency measured; architecture is stateless (JWT) and horizontally scalable except the in-memory rate limiter and catalogue cache | Free hosting cannot run load tests at that scale. With several instances, move the rate-limit counters to Redis. |
| 12 | NFR-012 encryption at rest | Encrypted storage | Provided by the managed PostgreSQL host (Render encrypts disks); TLS in transit via Render and Vercel | Not implemented in application code. |
| 13 | NFR-016 consent | Explicit consent for AI processing | Sign-up requires ticking the terms (which explain how profile data drives recommendations); acceptance is not stored server-side | Follow-up: add a consent timestamp column. |
| 14 | NFR-029 multi-language | Future | English only | As planned (May). |
| 15 | Test plan | Load testing | Replaced by latency measurements | See deviation 11. |
| 16 | AI approach | "AI/ML" recommendations | Explainable content-based scoring plus rules (no trained model) | No interaction data exists at launch (cold start), and FR-023 requires explanations. A learned ranker is in the backlog (LUM-44). |
| 17 | Tooling | Jira | GitHub Issues, Milestones and Projects, plus a Jira-importable CSV (`docs/backlog.csv`) and the `22_Jira Backlog.xlsx` deliverable | The repository already lives on GitHub; PRs close issues automatically. |
