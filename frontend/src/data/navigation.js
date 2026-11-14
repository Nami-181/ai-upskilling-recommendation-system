import {
  LayoutDashboard,
  UserRound,
  Compass,
  Radar,
  Route,
  Library,
  FolderKanban,
  Award,
  Sparkles,
  ChartNoAxesColumn,
  CalendarDays,
  Heart,
  NotebookPen,
  Trophy,
  Bell,
  Settings,
  LifeBuoy,
} from 'lucide-react';

/**
 * Single source of truth for the student-app sidebar, page titles and
 * placeholder descriptions. `phase` is the build phase from docs/SCREEN_INVENTORY.md.
 * Logout lives in the ACCOUNT section of the sidebar as an action (see Sidebar.jsx).
 */
export const SIDEBAR_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, phase: 3,
        description: 'Your learning at a glance — progress, goals, milestones and today’s suggestion.' },
      { label: 'My Profile', path: '/app/profile', icon: UserRound, phase: 2,
        description: 'Your academic background, skills, projects, interests and career goals.' },
      { label: 'Career Explorer', path: '/app/careers', icon: Compass, phase: 3,
        description: 'Explore and compare career paths, the skills they need and how close you are.' },
    ],
  },
  {
    title: 'AI Learning',
    items: [
      { label: 'Skill Gap Analyzer', path: '/app/skills', icon: Radar, phase: 3,
        description: 'Compare your current skill levels with what your target role requires.' },
      { label: 'Learning Roadmap', path: '/app/roadmap', icon: Route, phase: 4,
        description: 'A stage-by-stage plan with weekly milestones you can complete and regenerate.' },
      { label: 'Resource Library', path: '/app/resources', icon: Library, phase: 4,
        description: 'Curated courses, tutorials and documentation, filtered to your goals.' },
      { label: 'Project Recommendations', path: '/app/projects', icon: FolderKanban, phase: 4,
        description: 'Practical projects matched to your level, with technologies and skills gained.' },
      { label: 'Certifications', path: '/app/certifications', icon: Award, phase: 4,
        description: 'Certifications worth your time, with providers, pricing and free alternatives.' },
      { label: 'AI Learning Assistant', path: '/app/assistant', icon: Sparkles, phase: 5,
        description: 'Ask what to learn next, why something was recommended, or for a study plan.' },
    ],
  },
  {
    title: 'My Progress',
    items: [
      { label: 'Analytics', path: '/app/analytics', icon: ChartNoAxesColumn, phase: 5,
        description: 'Study hours, streaks, quiz scores and skills improved over time.' },
      { label: 'Study Planner', path: '/app/planner', icon: CalendarDays, phase: 5,
        description: 'Plan weekly and monthly study sessions, goals and deadlines.' },
      { label: 'Wishlist', path: '/app/wishlist', icon: Heart, phase: 5,
        description: 'Courses, projects, certifications and resources you have saved.' },
      { label: 'Learning Journal', path: '/app/journal', icon: NotebookPen, phase: 5,
        description: 'Daily notes and reflections on what you practised and learned.' },
      { label: 'Achievements', path: '/app/achievements', icon: Trophy, phase: 6,
        description: 'Badges, streaks and milestones you have earned along the way.' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', path: '/app/notifications', icon: Bell, phase: 6,
        description: 'Recommendations, reminders and milestone updates, plus your preferences.' },
      { label: 'Settings', path: '/app/settings', icon: Settings, phase: 6,
        description: 'Account, password, learning preferences, notifications and privacy.' },
      { label: 'Help & Support', path: '/app/support', icon: LifeBuoy, phase: 6,
        description: 'FAQs, help articles, contact support and report a problem.' },
    ],
  },
];

export const ALL_APP_PAGES = SIDEBAR_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title })),
);

export function findPageByPath(pathname) {
  return ALL_APP_PAGES.find((page) => pathname.startsWith(page.path));
}

/** Public website navigation */
export const PUBLIC_NAV = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/about#contact' },
];
