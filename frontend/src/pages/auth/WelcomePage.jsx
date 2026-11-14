import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, UserRound, GraduationCap, Wrench, Target, CalendarClock, LayoutDashboard } from 'lucide-react';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import ProgressRing from '../../components/common/ProgressRing';
import { useAuth } from '../../context/AuthContext';

const SETUP = [
  { icon: UserRound, label: 'About you' },
  { icon: GraduationCap, label: 'Academics & courses' },
  { icon: Wrench, label: 'Skills & projects' },
  { icon: Target, label: 'Interests & career goal' },
  { icon: CalendarClock, label: 'Learning preferences' },
];

/** SCREEN 11 — Authentication success / welcome */
export default function WelcomePage() {
  const { user } = useAuth();
  const isNew = !user?.onboardingComplete;

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-blush/55 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-lavender/60 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[-8%] h-[360px] w-[360px] rounded-full bg-sage/60 blur-[110px]" />
      </div>

      <header className="mx-auto flex h-[72px] w-full max-w-6xl items-center px-5 md:px-8">
        <Logo to={isNew ? '/welcome' : '/app/dashboard'} />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-2xl animate-fade-up text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-paper text-plum shadow-soft">
            <Sparkles className="h-7 w-7" strokeWidth={1.4} />
          </span>
          <p className="eyebrow mt-8">{isNew ? 'Your account is ready' : 'Signed in'}</p>
          <h1 className="mt-4 text-[48px] leading-[1.02] font-medium md:text-[68px]">
            {isNew ? 'Welcome to LUMORA,' : 'Welcome back,'} <em className="text-plum italic">{user?.firstName}.</em>
          </h1>

          {isNew ? (
            <>
              <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
                Let’s build your learning profile. It takes about ten minutes, and everything you share shapes your
                personalised roadmap.
              </p>

              <ol className="mx-auto mt-12 grid max-w-xl grid-cols-1 gap-2 text-left sm:grid-cols-5 sm:gap-3 sm:text-center">
                {SETUP.map(({ icon: Icon, label }, i) => (
                  <li
                    key={label}
                    className="flex animate-fade-up items-center gap-3 rounded-2xl border border-line bg-paper/80 px-4 py-3 sm:flex-col sm:gap-2 sm:px-2 sm:py-4"
                    style={{ animationDelay: `${150 + i * 80}ms` }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender/70 text-lavender-deep">
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </span>
                    <span className="text-[12.5px] leading-tight">{label}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
                <Button to="/onboarding" size="lg" rightIcon={ArrowRight}>
                  Begin onboarding
                </Button>
                <Button to="/app/dashboard" size="lg" variant="secondary">
                  Skip for now
                </Button>
              </div>
              <p className="mt-4 text-[12.5px] text-muted">You can finish setting up any time from your profile.</p>
            </>
          ) : (
            <>
              <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
                Your roadmap is right where you left it.
              </p>
              <div className="mx-auto mt-10 flex max-w-md items-center gap-5 rounded-3xl border border-line bg-paper/85 p-5 text-left shadow-soft">
                <ProgressRing value={user?.profileCompletion ?? 0} size={68} stroke={5}>
                  <span className="text-[13px] font-semibold">{user?.profileCompletion ?? 0}%</span>
                </ProgressRing>
                <div className="flex-1">
                  <p className="text-[12px] text-muted">Working towards</p>
                  <p className="font-display text-[24px] leading-tight font-medium">{user?.targetRole ?? 'Your target role'}</p>
                  <Link to="/app/profile" className="text-[12.5px] text-plum hover:underline">Profile {user?.profileCompletion ?? 0}% complete</Link>
                </div>
              </div>
              <div className="mt-10 flex justify-center">
                <Button to="/app/dashboard" size="lg" leftIcon={LayoutDashboard} rightIcon={ArrowRight}>
                  Go to my dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
