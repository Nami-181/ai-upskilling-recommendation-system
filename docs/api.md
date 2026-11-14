# API reference

Base URL: `http://localhost:8000` locally, or the Render URL in production. Interactive OpenAPI docs are at **`/docs`** (Swagger) and `/redoc`.
Auth: `Authorization: Bearer <access_token>` from `/auth/login` or `/auth/verify-email`.
Errors: `{"detail": {"code": "NOT_FOUND", "message": "..."}}`. Validation errors (422) return `{"detail": [{"loc": [...], "msg": "field: reason"}]}`.
A Postman collection with tests for every request is in [`postman/LUMORA.postman_collection.json`](../postman/LUMORA.postman_collection.json).

| Method | Path | Auth | Purpose | FR / NFR |
| --- | --- | --- | --- | --- |
| GET | /health | – | Liveness + database dialect | NFR-018 |
| POST | /auth/register | – (rate-limited) | Create a student; sends a verification email (or returns `demoToken` in demo mode) | FR-001 |
| POST | /auth/login | – (rate-limited) | Returns JWT; 403 `EMAIL_NOT_VERIFIED` until verified | FR-001, FR-005 |
| POST | /auth/verify-email | – (rate-limited) | `{email, token}` → verifies and logs in | FR-004 |
| POST | /auth/resend-verification | – (rate-limited) | New verification link | FR-004 |
| POST | /auth/forgot-password | – (rate-limited) | Reset link; same answer for unknown emails | FR-004 |
| POST | /auth/reset-password | – (rate-limited) | `{token, password}` | FR-004 |
| GET | /auth/me | student | Current user | FR-005 |
| POST | /auth/change-password | student | Change password | NFR-009 |
| GET / PUT / DELETE | /profile | student | Read / update / delete account and all data | FR-006, FR-010, NFR-015 |
| GET | /profile/export | student | Download all personal data as JSON | NFR-015 |
| PUT | /profile/skills | student | Replace self-rated skills (levels 0–5) | FR-008 |
| POST / DELETE | /profile/courses[/{id}] | student | Add / remove courses (skills inferred) | FR-007, FR-013 |
| POST / DELETE | /profile/projects[/{id}] | student | Add / remove projects (skills inferred) | FR-009, FR-013 |
| GET | /roles, /roles/{id} | – | Career roles and required skills | FR-021 |
| GET | /skills, /skills/taxonomy | – | Skill list and category tree | FR-029 |
| GET | /resources | – | Filters `skill, type, level, free, q, sort, page, size` | FR-024–026, NFR-004 |
| GET | /resources/{id} | – | One resource | FR-026 |
| POST / PUT / DELETE | /resources[/{id}] | admin | Curate the content repository | FR-029 |
| GET | /project-ideas | – | Filter by skill / level | FR-030, FR-031 |
| GET | /certifications | – | Filter by role | FR-035, FR-036 |
| POST | /analyze/skills | student | Skill-gap report (readiness, ranked gaps, severity) | FR-013–016 |
| GET | /analyze/careers | student | Readiness for every role | FR-021 |
| POST | /recommendations/generate | student | Generate and store a learning path | FR-018–036 |
| GET | /recommendations | student | Active path with modules, resources, project, certifications | FR-018, FR-041 |
| PATCH | /roadmap/modules/{id} | student | Module status | FR-038 |
| PATCH | /recommendations/{id} | student | Item status | FR-038 |
| POST | /recommendations/{id}/save | student | Bookmark (wishlist) | FR-027 |
| GET | /quizzes/{skill} | student | 3 questions (answers hidden) | FR-017 |
| POST | /quizzes/{skill}/attempts | student | Grade, adapt path, return correct answers | FR-040, FR-043–045 |
| POST | /feedback | optional | Recommendation feedback (adapts path) or contact message | FR-046 |
| GET / POST | /progress | student | Analytics summary / log study minutes and status | FR-038, FR-039, FR-041, FR-042, FR-058 |
| GET | /notifications, POST /notifications/read | student | Adaptation events + inactivity nudge | FR-047, FR-053, FR-054 |
| GET | /achievements | student | 10 badges with progress | FR-056, FR-057 |
| GET | /admin/stats, /admin/users, /admin/feedback | admin | Platform metrics and users | FR-050 |
| PATCH | /admin/users/{id}?active= | admin | Enable / disable an account | FR-003 |
