import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import { ProtectedRoute, GuestRoute } from './components/navigation/RouteGuards';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// A. Public website
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import FeaturesPage from './pages/public/FeaturesPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import FaqPage from './pages/public/FaqPage';

// B. Authentication
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import WelcomePage from './pages/auth/WelcomePage';

// C. Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';

// D. Student app
import DashboardHome from './pages/dashboard/DashboardHome';
import ProfilePage from './pages/profile/ProfilePage';
import CareersPage from './pages/career/CareersPage';
import SkillsPage from './pages/skills/SkillsPage';
import RoadmapPage from './pages/roadmap/RoadmapPage';
import ResourcesPage from './pages/resources/ResourcesPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import CertificationsPage from './pages/certifications/CertificationsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import WishlistPage from './pages/wishlist/WishlistPage';
import AchievementsPage from './pages/achievements/AchievementsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SupportPage from './pages/support/SupportPage';

// System
import ComingSoon from './pages/system/ComingSoon';
import NotFound from './pages/system/NotFound';
import { ALL_APP_PAGES } from './data/navigation';

/**
 * Student-app pages that are built. Any sidebar page not listed falls back to
 * <ComingSoon /> (clearly marked with its phase), so navigation always works.
 * See docs/SCREEN_INVENTORY.md for what is complete.
 */
const BUILT_PAGES = {
  '/app/dashboard': DashboardHome,
  '/app/profile': ProfilePage,
  '/app/careers': CareersPage,
  '/app/skills': SkillsPage,
  '/app/roadmap': RoadmapPage,
  '/app/resources': ResourcesPage,
  '/app/projects': ProjectsPage,
  '/app/certifications': CertificationsPage,
  '/app/analytics': AnalyticsPage,
  '/app/wishlist': WishlistPage,
  '/app/achievements': AchievementsPage,
  '/app/notifications': NotificationsPage,
  '/app/settings': SettingsPage,
  '/app/support': SupportPage,
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* A. Public website — screens 1–5 */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
        </Route>

        {/* B. Authentication — screens 6–10 */}
        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Signed-in area */}
        <Route element={<ProtectedRoute />}>
          {/* Screen 11 */}
          <Route path="/welcome" element={<WelcomePage />} />

          {/* C. Onboarding — screens 12–23 */}
          <Route path="/onboarding/*" element={<OnboardingPage />} />

          {/* D. Student app */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            {ALL_APP_PAGES.map(({ path }) => {
              const Page = BUILT_PAGES[path] ?? ComingSoon;
              return <Route key={path} path={`${path.replace('/app/', '')}/*`} element={<Page />} />;
            })}
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
