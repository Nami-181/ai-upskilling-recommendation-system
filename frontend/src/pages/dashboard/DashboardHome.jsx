import { Link } from 'react-router-dom';
import { ArrowRight, Radar, Route, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_LINKS = [
  { to: '/app/skills', icon: Radar, title: 'Check your skill gaps', tint: 'pink' },
  { to: '/app/roadmap', icon: Route, title: 'Open your roadmap', tint: 'lavender' },
  { to: '/app/assistant', icon: Sparkles, title: 'Ask the assistant', tint: 'sage' },
];

/**
 * Dashboard shell content until SCREEN 24 (main dashboard) is built in Phase 3.
 */
export default function DashboardHome() {
  const toast = useToast();
  const { user } = useAuth();

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h2 className="mt-2 text-[44px] leading-[1.02] font-medium md:text-[52px]">
            Welcome back, <em className="text-plum italic">{user?.firstName}.</em>
          </h2>
          <p className="mt-3 text-muted">
            {user?.targetRole ? (
              <>
                Working towards <span className="font-medium text-ink">{user.targetRole}</span>
                {user.program && <> · {user.program}, year {user.year}</>}
              </>
            ) : (
              'Finish onboarding to set your target career.'
            )}
          </p>
        </div>
        <Badge tone="outline" className="self-start md:self-auto">Sample data</Badge>
      </div>

      <Card tint="paper" padding="lg" className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <Badge tone="lavender">Dashboard shell</Badge>
          <h3 className="mt-4 text-[30px] leading-tight font-medium">Your full dashboard arrives in Phase 3.</h3>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            Navigation, sign-in and the design system are ready. Phase 3 adds learning progress, skills mastered,
            weekly hours, milestones, recommended resources, recent activity and your daily AI suggestion.
          </p>
          <Button
            className="mt-6"
            size="sm"
            variant="soft"
            onClick={() => toast.success('Toasts are working', 'Notifications are wired up across the app.')}
          >
            Test a notification
          </Button>
        </div>
        <div className="rounded-2xl border border-line bg-cream/70 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Profile completion</p>
            <p className="font-display text-[28px] font-medium">{user?.profileCompletion ?? 0}%</p>
          </div>
          <ProgressBar value={user?.profileCompletion ?? 0} className="mt-3" label="Profile completion" />
          <p className="mt-3 text-xs text-muted">Add your previous projects to reach 100%.</p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map(({ to, icon: Icon, title, tint }) => (
          <Card key={to} as={Link} to={to} tint={tint} interactive className="group flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-plum">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
            <span className="flex-1 text-[15px] font-medium">{title}</span>
            <ArrowRight className="h-4 w-4 text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
          </Card>
        ))}
      </div>
    </div>
  );
}
