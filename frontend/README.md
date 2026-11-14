# LUMORA — Frontend

**AI-Powered Upskilling Recommendation and Automation System for Students**
*Learn with purpose. Grow with direction.*

React · Vite · Tailwind CSS v4 · React Router · Lucide · Recharts · Axios

- Screen-by-screen progress: [`docs/SCREEN_INVENTORY.md`](docs/SCREEN_INVENTORY.md)
- Colours, type, components, states: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

---

## Run it

Requires **Node.js 20+**. Run these inside the folder that contains `package.json`:

```bash
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run dev
```

Open http://localhost:5173.

### Demo login (mock mode)

With `VITE_USE_MOCK_DATA=true` no backend is needed. Accounts are stored in your browser.

| Email | Password |
|-------|----------|
| `demo@lumora.app` | `Lumora@2026` |

You can also sign up with any email. Verification and password-reset emails are simulated with
clearly labelled **Demo mode** buttons on those screens.

To start fresh, clear the site's local storage in the browser (DevTools → Application → Local storage).

## Routes

| Area | Routes |
|------|--------|
| Public | `/` `/about` `/features` `/how-it-works` `/faq` (`/contact` → `/about#contact`) |
| Auth | `/login` `/signup` `/forgot-password` `/reset-password?token=…` `/verify-email` |
| Signed in | `/welcome` · `/onboarding` · `/app/*` (dashboard and all sidebar pages) |

`/welcome`, `/onboarding` and `/app/*` require sign-in; signed-out visitors are sent to `/login`
and returned afterwards.

## Folder structure

```
src/
  components/
    common/      Button, Badge, Card, Logo, Accordion, PageHero, SectionHeading, ProgressBar, ProgressRing
    forms/       TextField, PasswordField, PasswordStrength, Checkbox, Select, TextArea, FormAlert
    modals/      Modal, ConfirmDialog, LogoutDialog
    navigation/  Navbar, Sidebar, Topbar, NotificationsMenu, ProfileMenu, RouteGuards
    layout/      PublicLayout, AuthLayout, DashboardLayout, Footer
    cards/       Preview cards, PathIllustration, CallToAction
    charts/      (Phase 3+)
  pages/
    public/  auth/  onboarding/  dashboard/  profile/  career/  skills/  roadmap/  resources/
    projects/  certifications/  assistant/  analytics/  planner/  journal/  wishlist/
    achievements/  notifications/  settings/  support/  system/
  services/   api.js (Axios) + authService, profileService, recommendationService, progressService, supportService
  context/    AuthContext, ToastContext
  hooks/      useForm, useCooldown, useDismiss, useLocalStorage, useScrolled
  data/       navigation, publicContent, mockUser (all mock/sample data lives here)
  utils/      cn, validation
```

## Backend integration (FastAPI)

UI components never call the API directly. They call services in `src/services/`, which return
mock data while `VITE_USE_MOCK_DATA=true` and call FastAPI when it is `false`.

| Method | Endpoint | Service |
|--------|----------|---------|
| POST | `/auth/register` | `authService.register` |
| POST | `/auth/login` | `authService.login` |
| POST | `/auth/forgot-password` | `authService.forgotPassword` |
| POST | `/auth/reset-password` | `authService.resetPassword` |
| POST | `/auth/verify-email` *(proposed)* | `authService.verifyEmail` |
| POST | `/auth/resend-verification` *(proposed)* | `authService.resendVerification` |
| GET / PUT | `/profile` | `profileService` |
| GET | `/roles` | `profileService.getRoles` |
| POST | `/analyze/skills` | `recommendationService.analyzeSkills` |
| POST | `/recommendations/generate` | `recommendationService.generateRecommendations` |
| GET | `/recommendations` | `recommendationService.getRecommendations` |
| POST | `/feedback` | `recommendationService.sendFeedback`, `supportService.sendContactMessage` |
| GET / POST | `/progress` | `progressService` |

Expected request/response shapes are documented at the top of each service file.
Login should return `403` with `detail: { code: "EMAIL_NOT_VERIFIED", message }` for unverified accounts.

**For the backend teammate:** enable CORS for `http://localhost:5173`:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Sample content

Testimonials, recommendations, skill-gap and roadmap previews, notifications and the demo
student are **sample data** and are labelled in the UI. Nothing is presented as output from a
live AI model. Contact details on the About page are placeholders.

## Build phases

- [x] **Phase 1** — design system, public website (5 screens), authentication (6 screens)
- [ ] **Phase 2** — onboarding (12 screens), student profile, edit profile
- [ ] **Phase 3** — dashboard, career explorer, skill-gap analyzer, skill details
- [ ] **Phase 4** — roadmap, resources, projects, certifications (+ detail pages)
- [ ] **Phase 5** — AI assistant, analytics, study planner, learning journal, wishlist
- [ ] **Phase 6** — achievements, notifications, settings, help & support
- [ ] **Phase 7** — responsive pass, UI-state audit, API integration, testing
