# Product backlog (Team 22, ProjectSync)

Source of truth for the GitHub issues and the Jira import file [`backlog.csv`](backlog.csv). Story points use the Fibonacci scale (1, 2, 3, 5, 8). Items trace to the SRS (FR- / NFR- ids).

## Sprints

| Sprint | Dates | Planned points | Completed points |
| --- | --- | --- | --- |
| Sprint 1 | 30 Oct – 12 Nov 2026 | 44 | 44 |
| Sprint 2 | 13 Nov – 26 Nov 2026 | 117 | 110 |
| Backlog (future) | – | 24 | – |

## Points per member

| Member | Role | Sprint 1 | Sprint 2 | Backlog |
| --- | --- | --- | --- | --- |
| Nidhi (M1) | Frontend | 13 | 28 | 5 |
| Nami (M2) `@Nami-181` | Backend + Database | 21 | 33 | 11 |
| Riya (M3) `@riyaharugop` | AI/ML engine | 5 | 32 | 8 |
| Rhea (M4) `@Rheanair30` | Integration, testing, deployment | 5 | 22 | 0 |
| Whole team (ALL) | All | 0 | 2 | 0 |

## Sprint 1

| Key | Epic | Summary | Pts | Assignee | Priority | Status | SRS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LUM-1 | Project management and documentation | Repository, branching strategy and project board | 2 | Rhea (M4) | High | Done | NFR-025 |
| LUM-2 | Project management and documentation | SRS with MoSCoW prioritisation | 3 | Nami (M2) | High | Done | All |
| LUM-3 | Learning path and recommendations | Streamlit prototype of profile → gap → path | 5 | Nami (M2) | Medium | Done | FR-013, FR-018 |
| LUM-4 | Skill-gap analysis | Skill taxonomy and seed datasets | 5 | Riya (M3) | High | Done | FR-029 |
| LUM-5 | Dashboards, notifications and gamification | Design system and screen inventory | 5 | Nidhi (M1) | High | Done | NFR-021, NFR-023 |
| LUM-6 | Dashboards, notifications and gamification | Landing and public pages | 3 | Nidhi (M1) | Medium | Done | NFR-021 |
| LUM-7 | Accounts and security | Auth screens: sign up, login, verify, forgot / reset password | 5 | Nidhi (M1) | High | Done | FR-001, FR-004 |
| LUM-8 | Student profile | ER diagram and database schema | 5 | Nami (M2) | High | Done | NFR-006 |
| LUM-9 | Accounts and security | Register and login API with JWT | 5 | Nami (M2) | High | Done | FR-001, FR-005, NFR-009 |
| LUM-10 | Accounts and security | Email verification and password reset API | 3 | Nami (M2) | High | Done | FR-004 |
| LUM-11 | Quality, CI/CD and deployment | Test plan and test case design | 3 | Rhea (M4) | High | Done | NFR-025 |

## Sprint 2

| Key | Epic | Summary | Pts | Assignee | Priority | Status | SRS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LUM-12 | Student profile | Profile API: details, skills, courses, projects | 5 | Nami (M2) | High | Done | FR-006, FR-007, FR-008, FR-009, FR-010 |
| LUM-13 | Skill-gap analysis | Skill extraction from courses, projects and text | 3 | Riya (M3) | Medium | Done | FR-011, FR-013 |
| LUM-14 | Skill-gap analysis | Gap scoring, severity and importance ranking | 5 | Riya (M3) | High | Done | FR-014, FR-015 |
| LUM-15 | Skill-gap analysis | Skill-gap and career-readiness endpoints | 3 | Nami (M2) | High | Done | FR-016, FR-021 |
| LUM-16 | Learning path and recommendations | Learning path generation with prerequisites and weekly schedule | 8 | Riya (M3) | High | Done | FR-018, FR-019, FR-020, FR-022, FR-023 |
| LUM-17 | Learning path and recommendations | Resource ranking and recommendation | 5 | Riya (M3) | High | Done | FR-024, FR-025, FR-026, FR-028 |
| LUM-18 | Learning path and recommendations | Project and certification recommendation | 3 | Riya (M3) | High | Done | FR-030, FR-031, FR-035, FR-036 |
| LUM-19 | Learning path and recommendations | Store learning paths and recommendations | 5 | Nami (M2) | High | Done | FR-018, FR-027, FR-042 |
| LUM-20 | Learning path and recommendations | Catalogue API with search, filters and admin CRUD | 5 | Nami (M2) | Medium | Done | FR-029, NFR-004, NFR-007 |
| LUM-21 | Progress and adaptivity | Skill quizzes with adaptive path updates | 5 | Riya (M3) | High | Done | FR-017, FR-040, FR-043, FR-044, FR-045 |
| LUM-22 | Progress and adaptivity | Feedback-based resource replacement | 3 | Riya (M3) | Medium | Done | FR-046, NFR-028 |
| LUM-23 | Progress and adaptivity | Progress tracking and analytics API | 5 | Nami (M2) | High | Done | FR-038, FR-039, FR-041, FR-042, FR-058 |
| LUM-24 | Dashboards, notifications and gamification | Notifications and achievements API | 3 | Nami (M2) | Medium | Done | FR-047, FR-053, FR-054, FR-056, FR-057 |
| LUM-25 | Dashboards, notifications and gamification | Admin statistics and user management API | 2 | Nami (M2) | Low | Done | FR-003, FR-050 |
| LUM-26 | Student profile | Onboarding wizard and profile pages | 5 | Nidhi (M1) | High | Done | FR-006, FR-010, NFR-022 |
| LUM-27 | Dashboards, notifications and gamification | Dashboard, skill-gap and career pages | 5 | Nidhi (M1) | High | Done | FR-048, FR-015 |
| LUM-28 | Learning path and recommendations | Roadmap page with quiz and feedback | 8 | Nidhi (M1) | High | Done | FR-018, FR-023, FR-043, FR-046 |
| LUM-29 | Learning path and recommendations | Resources, projects, certifications and wishlist pages | 5 | Nidhi (M1) | Medium | Done | FR-024, FR-027, FR-030, FR-035 |
| LUM-30 | Dashboards, notifications and gamification | Analytics, notifications, achievements, settings and support pages | 5 | Nidhi (M1) | Medium | Done | FR-041, FR-054, FR-057, NFR-015 |
| LUM-31 | Accounts and security | Rate limiting, data export and account deletion | 2 | Nami (M2) | High | Done | NFR-011, NFR-015 |
| LUM-32 | Quality, CI/CD and deployment | Automated unit and API tests (pytest) | 5 | Rhea (M4) | High | Done | NFR-010, NFR-027 |
| LUM-33 | Quality, CI/CD and deployment | Postman collection and Newman in CI | 3 | Rhea (M4) | Medium | Done | NFR-027 |
| LUM-34 | Quality, CI/CD and deployment | Recommendation accuracy test with sample profiles | 3 | Rhea (M4) | High | Done | FR-015, FR-018 |
| LUM-35 | Quality, CI/CD and deployment | Frontend–backend integration and browser E2E test | 3 | Rhea (M4) | High | Done | NFR-001, NFR-002 |
| LUM-36 | Quality, CI/CD and deployment | Docker, Render and Vercel deployment | 5 | Rhea (M4) | High | In Progress | NFR-008, NFR-026 |
| LUM-37 | Quality, CI/CD and deployment | CI/CD pipeline and PR automation | 3 | Rhea (M4) | Medium | Done | NFR-027 |
| LUM-38 | Project management and documentation | Architecture, database, API and deployment documentation | 3 | Nami (M2) | Medium | Done | NFR-025 |
| LUM-39 | Project management and documentation | Sprint 2 review, retrospective and demo video | 2 | Whole team (ALL) | Medium | To Do | – |

## Future backlog

| Key | Epic | Summary | Pts | Assignee | Priority | Status | SRS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LUM-40 | Accounts and security | OAuth sign-in (Google, GitHub, LinkedIn) | 5 | Nami (M2) | Low | Backlog | FR-002 |
| LUM-41 | Dashboards, notifications and gamification | Educator dashboard with at-risk students | 5 | Nidhi (M1) | Low | Backlog | FR-049 |
| LUM-42 | Dashboards, notifications and gamification | Downloadable PDF progress report and portfolio | 3 | Nami (M2) | Low | Backlog | FR-051, FR-059, FR-060 |
| LUM-43 | Dashboards, notifications and gamification | Email reminders for study sessions | 3 | Nami (M2) | Low | Backlog | FR-052, FR-055 |
| LUM-44 | Learning path and recommendations | Learned ranker from feedback data | 8 | Riya (M3) | Low | Backlog | NFR-028 |
