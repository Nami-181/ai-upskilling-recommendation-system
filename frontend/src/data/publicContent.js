import {
  Radar,
  Route,
  Library,
  FolderKanban,
  Award,
  ChartNoAxesColumn,
  Sparkles,
  UserRound,
  ScanSearch,
  Target,
  Map as MapIcon,
  TrendingUp,
} from 'lucide-react';

/** Copy and sample content for the public website. */

export const PROFILE_SIGNALS = [
  'Academic background',
  'Courses',
  'Technical skills',
  'Soft skills',
  'Projects',
  'Interests',
  'Career goals',
];

/* ── Features ─────────────────────────────────────────────── */
export const FEATURES = [
  {
    id: 'skill-gap',
    icon: Radar,
    tint: 'bg-blush/70 text-plum',
    panel: 'bg-blush/40',
    title: 'Skill Gap Analyzer',
    short: 'See exactly where you stand against your target role, skill by skill, on a clear 0–5 scale.',
    long: 'Rate your current proficiency and LUMORA compares it with what your target role typically expects. Gaps are ranked by priority, and each one comes with a plain-language explanation of why it matters.',
    bullets: [
      'Current vs required proficiency on a 0–5 scale',
      'Radar and comparison charts that are easy to read',
      'Strongest skills, missing skills and high-priority gaps',
      'Suggested next actions for every gap',
    ],
  },
  {
    id: 'roadmap',
    icon: Route,
    tint: 'bg-lavender/80 text-lavender-deep',
    panel: 'bg-lavender/45',
    title: 'Personalized Roadmaps',
    short: 'A beginner-to-advanced path with weekly milestones that reshapes itself as you progress.',
    long: 'Your roadmap is organised into beginner, intermediate and advanced stages, sized to the hours you actually have each week. Mark milestones complete and regenerate the plan whenever your goals change.',
    bullets: [
      'Beginner, intermediate and advanced stages',
      'Weekly goals, estimated time and prerequisites',
      'Mark milestones complete and track stage progress',
      'Regenerate when your skills or goals change',
    ],
  },
  {
    id: 'resources',
    icon: Library,
    tint: 'bg-sage text-sage-deep',
    panel: 'bg-sage/55',
    title: 'Resource Recommendations',
    short: 'Courses, tutorials and documentation filtered by level, cost and the skills you need.',
    long: 'Instead of searching through hundreds of tutorials, you see a short list of courses, videos and documentation matched to your gaps — with difficulty, duration and cost shown up front.',
    bullets: [
      'Courses, videos, tutorials, documentation and platforms',
      'Filter by difficulty, free or paid, duration and skill',
      'Save anything to your wishlist for later',
      'Mark resources complete to update your progress',
    ],
  },
  {
    id: 'projects',
    icon: FolderKanban,
    tint: 'bg-sand/80 text-sand-deep',
    panel: 'bg-sand/45',
    title: 'Project Recommendations',
    short: 'Practical projects matched to your level, so your portfolio grows with your skills.',
    long: 'Projects turn knowledge into evidence. LUMORA suggests beginner, intermediate and advanced projects with a problem statement, tech stack, implementation steps and the skills each one demonstrates.',
    bullets: [
      'Projects grouped by difficulty and category',
      'Problem statement, objectives and suggested steps',
      'Technologies used and skills gained',
      'GitHub references where available',
    ],
  },
  {
    id: 'certifications',
    icon: Award,
    tint: 'bg-blush/70 text-plum',
    panel: 'bg-blush/40',
    title: 'Certification Finder',
    short: 'Certifications worth your time, with preparation estimates, pricing and free alternatives.',
    long: 'See which certifications are relevant to your target role, how long they usually take to prepare for, what they cost, and whether a free alternative covers similar ground.',
    bullets: [
      'Provider, difficulty, cost and preparation time',
      'Skills covered and how they map to your gaps',
      'Links to official registration pages',
      'Track preparation and completion',
    ],
  },
  {
    id: 'analytics',
    icon: ChartNoAxesColumn,
    tint: 'bg-lavender/80 text-lavender-deep',
    panel: 'bg-lavender/45',
    title: 'Progress Analytics',
    short: 'Study hours, streaks and skills improved — honest feedback on how far you have come.',
    long: 'Weekly and monthly activity, quiz scores, completed milestones and before-and-after skill comparisons show your progress clearly, so you can adjust before you fall behind.',
    bullets: [
      'Weekly and monthly study activity',
      'Quiz scores and performance trends',
      'Learning streaks and completed milestones',
      'Before-and-after skill comparisons',
    ],
  },
  {
    id: 'assistant',
    icon: Sparkles,
    tint: 'bg-sage text-sage-deep',
    panel: 'bg-sage/55',
    title: 'AI Learning Assistant',
    short: 'Ask what to learn next, why something was recommended, or for a weekly study plan.',
    long: 'A conversational assistant that knows your profile and roadmap. Ask why a course was recommended, what to focus on this week, or for a project that fits your current level.',
    bullets: [
      'Answers grounded in your profile and roadmap',
      'Suggested prompts to get started quickly',
      'Saved conversation history',
      'Explains the reasoning behind recommendations',
    ],
  },
];

/* ── How it works (5 steps) ───────────────────────────────── */
export const STEPS = [
  {
    number: '01',
    icon: UserRound,
    title: 'Build your profile',
    short: 'Share your courses, skills, projects, interests and the career you are working towards.',
    details: [
      'Add your university, degree, branch and semester',
      'List courses you have completed or are studying',
      'Add previous projects with their technologies',
    ],
    output: 'A complete learning profile',
  },
  {
    number: '02',
    icon: ScanSearch,
    title: 'Analyze your skills',
    short: 'Rate your technical and non-technical skills on a simple 0–5 scale.',
    details: [
      'Rate languages, frameworks, databases and tools',
      'Include communication, teamwork and problem solving',
      'Your projects help ground each rating',
    ],
    output: 'A clear picture of your current level',
  },
  {
    number: '03',
    icon: Target,
    title: 'Discover your skill gaps',
    short: 'LUMORA compares your profile with your target role and ranks what matters most.',
    details: [
      'Current vs required level for each skill',
      'High-priority gaps highlighted first',
      'An explanation of why each skill matters',
    ],
    output: 'A prioritised list of skills to build',
  },
  {
    number: '04',
    icon: MapIcon,
    title: 'Receive your personalized roadmap',
    short: 'Get a staged plan of resources, projects and certifications sized to your week.',
    details: [
      'Beginner, intermediate and advanced stages',
      'Weekly goals that fit your available hours',
      'Matched resources, projects and certifications',
    ],
    output: 'A week-by-week learning roadmap',
  },
  {
    number: '05',
    icon: TrendingUp,
    title: 'Track your growth',
    short: 'Complete milestones, take quizzes and watch your recommendations evolve.',
    details: [
      'Mark milestones and resources complete',
      'Review analytics, streaks and quiz scores',
      'Recommendations update as you improve',
    ],
    output: 'Recommendations that grow with you',
  },
];

/* ── Why LUMORA ───────────────────────────────────────────── */
export const WHY_USUAL = [
  'Dozens of open tabs and half-finished courses',
  'Generic roadmaps written for someone else',
  'Guessing what employers actually expect',
  'Progress that is hard to see or explain',
];

export const WHY_LUMORA = [
  'One clear next step, chosen from your profile',
  'A roadmap sized to your goals and your week',
  'Gaps measured against your target role',
  'Visible progress you can show in interviews',
];

/* ── Benefits ─────────────────────────────────────────────── */
export const BENEFITS = [
  { title: 'Direction, not noise', body: 'One clear next step instead of a hundred open tabs and conflicting advice.' },
  { title: 'Grounded in your real profile', body: 'Recommendations start from your courses, projects and skills — not a generic template.' },
  { title: 'Ready for internships & placements', body: 'Build the skills and portfolio projects your target role expects before interviews begin.' },
  { title: 'Adapts as you grow', body: 'Your roadmap and suggestions update as milestones are completed and skills improve.' },
  { title: 'Everything in one calm place', body: 'Roadmap, resources, projects, certifications and progress — together and organised.' },
];

/* ── SAMPLE content (clearly labelled in the UI) ──────────── */
export const SAMPLE_TESTIMONIALS = [
  {
    quote: 'I finally understood why SQL kept coming up in every job description — and had a plan to fix it by the end of the week.',
    name: 'Sample student',
    detail: 'B.Tech CSE, 3rd year · Aspiring Data Scientist',
    tint: 'bg-blush/45',
  },
  {
    quote: 'The roadmap felt like it was written for my timetable. Six hours a week turned into real, visible progress.',
    name: 'Sample student',
    detail: 'BCA, 2nd year · Aspiring Frontend Developer',
    tint: 'bg-lavender/45',
  },
  {
    quote: 'Instead of collecting courses I never finished, I worked on two projects that actually made it to my portfolio.',
    name: 'Sample student',
    detail: 'B.Sc Data Science, final year · Aspiring ML Engineer',
    tint: 'bg-sage/60',
  },
];

export const SAMPLE_SKILL_GAP = [
  { skill: 'Python', current: 4, required: 5, priority: 'Medium' },
  { skill: 'SQL', current: 2, required: 4, priority: 'High' },
  { skill: 'Machine Learning', current: 2, required: 5, priority: 'High' },
  { skill: 'Statistics', current: 3, required: 4, priority: 'Medium' },
];

export const SAMPLE_ROADMAP = [
  { title: 'Python for Data Science', stage: 'Beginner', weeks: 2, status: 'done' },
  { title: 'Statistics and Probability', stage: 'Beginner', weeks: 3, status: 'current' },
  { title: 'SQL', stage: 'Intermediate', weeks: 2, status: 'next' },
  { title: 'Data Cleaning and Visualization', stage: 'Intermediate', weeks: 2, status: 'next' },
  { title: 'Machine Learning', stage: 'Advanced', weeks: 4, status: 'next' },
  { title: 'Model Evaluation', stage: 'Advanced', weeks: 2, status: 'next' },
  { title: 'End-to-End Portfolio Project', stage: 'Advanced', weeks: 3, status: 'next' },
];

export const SAMPLE_RECOMMENDATIONS = [
  {
    type: 'Course',
    title: 'SQL for Data Analysis',
    meta: 'Beginner · ~12 hours · Free',
    reason: 'SQL is your largest gap (2 → 4) for the Data Scientist role.',
    tint: 'bg-sage/60',
  },
  {
    type: 'Project',
    title: 'Student Performance Dashboard',
    meta: 'Intermediate · 2 weeks · Python, SQL, Pandas',
    reason: 'Practises SQL joins and visualisation together, building on your Python strength.',
    tint: 'bg-lavender/50',
  },
  {
    type: 'Certification',
    title: 'Entry-level Data Analytics Certificate',
    meta: 'Beginner · 4–6 weeks prep',
    reason: 'Covers statistics and SQL fundamentals that appear in your roadmap.',
    tint: 'bg-blush/45',
  },
];

/* ── FAQ ──────────────────────────────────────────────────── */
export const FAQ_CATEGORIES = ['Getting started', 'Recommendations', 'Roadmaps & progress', 'Account & privacy'];

export const FAQS = [
  {
    category: 'Getting started',
    question: 'Who is LUMORA for?',
    answer: 'LUMORA is designed for university students — especially engineering and computer science students — who are preparing for internships or placements, or exploring which career suits them.',
  },
  {
    category: 'Getting started',
    question: 'How long does it take to set up my profile?',
    answer: 'Most students finish onboarding in about ten minutes. You can save your progress and come back later, and every section can be edited afterwards from your profile.',
  },
  {
    category: 'Getting started',
    question: 'Do I need to know which career I want?',
    answer: 'No. You can choose “Other” or explore careers first in the Career Explorer, which shows the skills each role needs and how close your current profile is.',
  },
  {
    category: 'Recommendations',
    question: 'How does LUMORA decide what to recommend?',
    answer: 'Recommendations come from comparing your profile — skills, courses, projects, interests and goals — with the skills your target role requires. The largest and most important gaps are prioritised first.',
  },
  {
    category: 'Recommendations',
    question: 'Can I see why something was recommended?',
    answer: 'Yes. Every recommendation includes a short explanation, and you can ask the AI Learning Assistant for more detail about any course, project or certification.',
  },
  {
    category: 'Recommendations',
    question: 'Are the recommended resources free?',
    answer: 'Many are. You can choose to see only free resources, or include paid options, in your learning preferences. Cost is always shown before you open a resource.',
  },
  {
    category: 'Roadmaps & progress',
    question: 'What happens if I fall behind on my roadmap?',
    answer: 'Nothing is lost. Update your weekly availability or regenerate your roadmap, and LUMORA will rebalance the remaining milestones around the time you have.',
  },
  {
    category: 'Roadmaps & progress',
    question: 'How is my progress measured?',
    answer: 'Through completed milestones, resources, projects and quiz scores, along with your study hours and streaks. Analytics show both weekly activity and long-term trends.',
  },
  {
    category: 'Roadmaps & progress',
    question: 'Can I change my target career later?',
    answer: 'Yes. Change it any time from your profile or the Career Explorer, and your skill-gap analysis and roadmap will be regenerated for the new role.',
  },
  {
    category: 'Account & privacy',
    question: 'Is my data shared with anyone?',
    answer: 'Your profile is used only to generate your recommendations. You can review privacy settings, and edit or delete your information at any time from Settings.',
  },
  {
    category: 'Account & privacy',
    question: 'I forgot my password. What should I do?',
    answer: 'Use “Forgot password” on the login page. We’ll email you a secure link to choose a new password.',
  },
];
