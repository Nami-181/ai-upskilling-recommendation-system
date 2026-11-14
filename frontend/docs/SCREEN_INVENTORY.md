# LUMORA — Screen Inventory

A screen is ticked **only** when it is fully built and working. Placeholders are never ticked.

Legend: `[x]` complete · `[ ]` not built yet · *(shared)* = implemented as a state or view of another screen

| Phase | Scope |
| ----- | ----- |
| 1 | Design system, public website, authentication |
| 2 | Onboarding (all steps), student profile, edit profile |
| 3 | Dashboard, career explorer, skill-gap analyzer, skill details |
| 4 | Roadmap, roadmap details, resources, projects, certifications (+ detail pages) |
| 5 | AI assistant, analytics, study planner, learning journal, wishlist |
| 6 | Achievements, notifications, settings, help & support |
| 7 | Responsive pass, all UI states audit, API integration, testing |

---

## A. Public website

| # | Screen | Route | Phase | Status |
|---|--------|-------|-------|--------|
| 1 | Landing page | `/` | 1 | [x] |
| 2 | About us (incl. contact) | `/about` (`/about#contact`) | 1 | [x] |
| 3 | Features | `/features` | 1 | [x] |
| 4 | How it works (5 steps) | `/how-it-works` | 1 | [x] |
| 5 | FAQ (expandable, searchable) | `/faq` | 1 | [x] |

## B. Authentication

| # | Screen | Route | Phase | Status |
|---|--------|-------|-------|--------|
| 6 | Login (split screen; validation, loading, success, invalid credentials) | `/login` | 1 | [x] |
| 7 | Sign up (strength meter, terms, validation, success) | `/signup` | 1 | [x] |
| 8 | Forgot password (success, errors, back to login) | `/forgot-password` | 1 | [x] |
| 9 | Reset password (visibility, strength, success screen) | `/reset-password?token=…` | 1 | [x] |
| 10 | Email verification (resend, change email, verified state) | `/verify-email` | 1 | [x] |
| 11 | Authentication success / welcome | `/welcome` | 1 | [x] |

## C. Onboarding

| # | Screen | Route | Phase | Status |
|---|--------|-------|-------|--------|
| 12 | Welcome onboarding | `/onboarding` | 2 | [ ] |
| 13 | Personal information | `/onboarding/personal` | 2 | [ ] |
| 14 | Academic background | `/onboarding/academic` | 2 | [ ] |
| 15 | Courses & learning background | `/onboarding/courses` | 2 | [ ] |
| 16 | Technical skills (0–5 rating) | `/onboarding/technical-skills` | 2 | [ ] |
| 17 | Non-technical skills | `/onboarding/soft-skills` | 2 | [ ] |
| 18 | Previous projects (multiple) | `/onboarding/projects` | 2 | [ ] |
| 19 | Interests (selectable cards) | `/onboarding/interests` | 2 | [ ] |
| 20 | Career goals (+ custom) | `/onboarding/career` | 2 | [ ] |
| 21 | Learning preferences | `/onboarding/preferences` | 2 | [ ] |
| 22 | Profile review (edit per section) | `/onboarding/review` | 2 | [ ] |
| 23 | Onboarding complete | `/onboarding/complete` | 2 | [ ] |

## D. Student application

| # | Screen | Route | Phase | Status |
|---|--------|-------|-------|--------|
| 24 | Main dashboard | `/app/dashboard` | 3 | [ ] |
| 25 | Student profile | `/app/profile` | 2 | [ ] |
| 26 | Edit profile | `/app/profile/edit` | 2 | [ ] |
| 27 | Career explorer (search, compare, select) | `/app/careers` | 3 | [ ] |
| 28 | Skill gap analyzer | `/app/skills` | 3 | [ ] |
| 29 | Individual skill details | `/app/skills/:skillId` | 3 | [ ] |
| 30 | Learning roadmap | `/app/roadmap` | 4 | [ ] |
| 31 | Roadmap topic details (incl. quiz) | `/app/roadmap/:topicId` | 4 | [ ] |
| 32 | Resource library | `/app/resources` | 4 | [ ] |
| 33 | Resource details | `/app/resources/:resourceId` | 4 | [ ] |
| 34 | Project recommendations | `/app/projects` | 4 | [ ] |
| 35 | Project details | `/app/projects/:projectId` | 4 | [ ] |
| 36 | Certification finder | `/app/certifications` | 4 | [ ] |
| 37 | Certification details | `/app/certifications/:certId` | 4 | [ ] |
| 38 | AI learning assistant | `/app/assistant` | 5 | [ ] |
| 39 | Progress analytics | `/app/analytics` | 5 | [ ] |
| 40 | Study planner (week + month) | `/app/planner` | 5 | [ ] |
| 41 | Learning journal | `/app/journal` | 5 | [ ] |
| 42 | Wishlist | `/app/wishlist` | 5 | [ ] |
| 43 | Achievements | `/app/achievements` | 6 | [ ] |
| 44 | Notifications (+ preferences) | `/app/notifications` | 6 | [ ] |
| 45 | Settings | `/app/settings` | 6 | [ ] |
| 46 | Help & support | `/app/support` | 6 | [ ] |

## E. Shared UI patterns

| Pattern | Where | Phase | Status |
|---------|-------|-------|--------|
| Toast notifications (success / error / info) | Global | 1 | [x] |
| Modal + confirmation dialog | `components/modals` | 1 | [x] |
| Logout confirmation | Sidebar | 1 | [x] |
| Mobile navigation drawer (public + app) | Navbar, DashboardLayout | 1 | [x] |
| Notification dropdown | Topbar | 1 | [x] |
| Profile dropdown | Topbar | 1 | [x] |
| Tooltips (collapsed sidebar) | Sidebar | 1 | [x] |
| Form fields with validation / disabled / loading states | `components/forms` | 1 | [x] |
| Protected routes + auth session | `context/AuthContext` | 1 | [x] |
| 404 page | `*` | 1 | [x] |
| Delete confirmation | Planner, journal, wishlist, projects | 4–5 | [ ] |
| Unsaved changes warning | Edit profile, settings | 2 / 6 | [ ] |
| Search suggestions | Topbar global search | 3 | [ ] |
| Filter panels (incl. mobile sheet) | Resources, projects, certifications | 4 | [ ] |
| Loading skeletons / empty / error states per page | All app pages | 2–7 | [ ] |
