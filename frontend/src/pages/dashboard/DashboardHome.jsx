import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Clock, Flame, Gauge, Radar, Route, Sparkles, Target, Timer } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import ProgressRing from '../../components/common/ProgressRing';
import { AsyncBoundary, EmptyState } from '../../components/app/PageStates';
import { StatCard } from '../../components/app/Widgets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { activityService, roadmapService } from '../../services/learningService';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmtDay = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });

/** Screen 24: main dashboard. */
export default function DashboardHome() {
  const { user } = useAuth();
  const toast = useToast();
  const [logging, setLogging] = useState(null);
  const state = useAsync(() => Promise.all([roadmapService.get(), activityService.progress(), activityService.notifications()]), []);

  const logStudy = async (minutes) => {
    setLogging(minutes);
    try {
      const progress = await activityService.logStudy(minutes);
      state.setData(([r, , n]) => [r, progress, n]);
      toast.success('Study time logged', `${minutes} minutes added. Streak: ${progress.streak_days} day${progress.streak_days === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error('Couldn’t log study time', err.message);
    } finally {
      setLogging(null);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <p className="eyebrow">{greeting()}</p>
        <h2 className="mt-2 text-[44px] leading-[1.02] font-medium md:text-[52px]">
          Welcome back, <em className="text-plum italic">{user?.firstName}.</em>
        </h2>
        <p className="mt-3 text-muted">
          {user?.targetRole ? (
            <>Working towards <span className="font-medium text-ink">{user.targetRole}</span>{user.program && <> · {user.program}{user.year && `, year ${user.year}`}</>}</>
          ) : 'Finish onboarding to set your target career.'}
        </p>
      </div>

      {!user?.onboardingComplete && (
        <Card tint="lavender" className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">Tell us about yourself</p>
            <p className="text-[14px] text-muted">A few minutes of onboarding gives you a skill-gap analysis and a personal roadmap.</p>
          </div>
          <Button to="/onboarding" rightIcon={ArrowRight}>Start onboarding</Button>
        </Card>
      )}

      <AsyncBoundary state={state} rows={4}>
        {([roadmap, progress, notifications]) => {
          const path = roadmap.path;
          if (!path) {
            return (
              <EmptyState icon={Route} title="No roadmap yet"
                description="Choose a target career in your profile, then generate a roadmap built from your skill gaps."
                action={<Button to={user?.targetRole ? '/app/roadmap' : '/app/careers'} rightIcon={ArrowRight}>{user?.targetRole ? 'Generate my roadmap' : 'Choose a career'}</Button>} />
            );
          }
          const next = roadmap.modules.find((m) => m.status !== 'completed');
          const nextItem = next && [...next.resources, next.project].filter(Boolean).find((i) => i.status !== 'completed');
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Gauge} label={`Ready for ${path.role_title}`} value={`${path.readiness}%`} hint="when the roadmap was built" tint="pink" />
                <StatCard icon={Route} label="Roadmap progress" value={`${progress.overall}%`} hint={`${progress.milestones_completed}/${progress.milestones_total} skills done`} tint="lavender" />
                <StatCard icon={Flame} label="Study streak" value={`${progress.streak_days} day${progress.streak_days === 1 ? '' : 's'}`} hint={progress.inactive ? 'Pick it back up today' : 'Keep it going'} tint="sand" />
                <StatCard icon={Clock} label="Hours studied" value={progress.study_hours_total} hint={`goal ${path.hours_per_week} h / week`} tint="sage" />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card padding="lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge tone="lavender" icon={Sparkles}>Next up</Badge>
                      <h3 className="mt-3 text-[30px] leading-tight font-medium">{next ? next.skill_name : 'Roadmap complete!'}</h3>
                      <p className="mt-1 text-[14px] text-muted">{next ? next.reason : 'Every skill in your roadmap is done. Generate a new one or pick another career.'}</p>
                    </div>
                    {next && (
                      <ProgressRing value={next.progress} size={72}><span className="text-sm font-medium">{next.progress}%</span></ProgressRing>
                    )}
                  </div>
                  {nextItem && (
                    <div className="mt-5 rounded-2xl border border-line bg-cream/70 p-4">
                      <p className="text-[12px] tracking-wide text-muted uppercase">{nextItem.item_type === 'project' ? 'Project' : 'Start with'}</p>
                      <p className="mt-1 font-medium">{nextItem.title}</p>
                      {nextItem.provider && <p className="text-[13px] text-muted">{nextItem.provider} · {nextItem.duration_hrs} h</p>}
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button to="/app/roadmap" rightIcon={ArrowRight}>Open roadmap</Button>
                    {next && <Button to="/app/skills" variant="secondary" leftIcon={Radar}>Skill gaps</Button>}
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-[13px] text-muted">
                      <span>Overall</span><span>finish by {new Date(path.est_finish).toLocaleDateString()}</span>
                    </div>
                    <ProgressBar value={progress.overall} className="mt-2" label="Roadmap progress" />
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 className="flex items-center gap-2 text-[24px] font-medium"><Timer className="h-5 w-5 text-plum" />This week</h3>
                  <div className="mt-4 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progress.daily_hours.map((d) => ({ day: fmtDay(d.date), hours: d.hours }))}>
                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis width={28} tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'var(--color-linen)' }} formatter={(v) => [`${v} h`, 'Studied']} />
                        <Bar dataKey="hours" fill="var(--color-mauve)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-4 text-[13px] text-muted">Log a study session</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[15, 30, 60, 90].map((m) => (
                      <Button key={m} size="sm" variant="soft" loading={logging === m} disabled={logging !== null} onClick={() => logStudy(m)}>
                        +{m} min
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card padding="lg">
                  <h3 className="flex items-center gap-2 text-[24px] font-medium"><Target className="h-5 w-5 text-plum" />Upcoming milestones</h3>
                  {progress.upcoming.length ? (
                    <ul className="mt-4 space-y-4">
                      {progress.upcoming.map((u) => (
                        <li key={u.module_id}>
                          <div className="flex justify-between text-[14px]"><span className="font-medium">{u.skill_name}</span><span className="text-muted">due {u.due_date && new Date(u.due_date).toLocaleDateString()}</span></div>
                          <ProgressBar value={u.progress} size="sm" className="mt-2" tone="lavender" label={u.skill_name} />
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-3 text-sm text-muted">Nothing left — well done.</p>}
                </Card>
                <Card padding="lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[24px] font-medium">Recent updates</h3>
                    <Link to="/app/notifications" className="text-[13px] text-plum hover:underline">View all</Link>
                  </div>
                  <ul className="mt-4 divide-y divide-line">
                    {notifications.slice(0, 4).map((n) => (
                      <li key={n.id} className="py-2.5">
                        <p className="text-[14px] font-medium">{n.title}</p>
                        <p className="text-[13px] text-muted">{n.body}</p>
                      </li>
                    ))}
                    {notifications.length === 0 && <li className="py-2 text-sm text-muted">No updates yet.</li>}
                  </ul>
                </Card>
              </div>
            </div>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}
