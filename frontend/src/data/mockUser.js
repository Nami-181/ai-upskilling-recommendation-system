/**
 * SAMPLE DATA — used while the FastAPI backend is not connected.
 * Shapes mirror what the API is expected to return, so switching
 * services to the real API needs no UI changes.
 */

/** Demo login for testing (mock mode only). Shown on the login page. */
export const DEMO_ACCOUNT = {
  email: 'demo@lumora.app',
  password: 'Lumora@2026',
};

export const mockUser = {
  id: 'sample-student-001',
  firstName: 'Aanya',
  lastName: 'Sharma',
  email: DEMO_ACCOUNT.email,
  program: 'B.Tech, Computer Science',
  year: 3,
  targetRole: 'Data Scientist',
  profileCompletion: 82,
  weeklyHoursGoal: 10,
  verified: true,
  onboardingComplete: true,
};

export const mockNotifications = [
  {
    id: 'n1',
    title: 'Roadmap updated',
    body: 'Two SQL milestones were added after your last skill check.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'New resource match',
    body: 'A free statistics course fits your current level.',
    time: 'Yesterday',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Streak kept',
    body: 'You studied five days in a row this week.',
    time: '2d ago',
    unread: false,
  },
];

export const mockRoles = [
  { id: 'software-developer', title: 'Software Developer' },
  { id: 'data-scientist', title: 'Data Scientist' },
  { id: 'ai-ml-engineer', title: 'AI/ML Engineer' },
  { id: 'ui-ux-designer', title: 'UI/UX Designer' },
  { id: 'cybersecurity-analyst', title: 'Cybersecurity Analyst' },
  { id: 'data-analyst', title: 'Data Analyst' },
  { id: 'cloud-engineer', title: 'Cloud Engineer' },
  { id: 'product-manager', title: 'Product Manager' },
  { id: 'digital-marketer', title: 'Digital Marketer' },
];
