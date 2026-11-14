import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BookCheck, Clock, Flame, GraduationCap, Plus, Route } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import TextField from '../../components/forms/TextField';
import { AsyncBoundary, PageHeader } from '../../components/app/PageStates';
import { StatCard } from '../../components/app/Widgets';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { activityService } from '../../services/learningService';

const short = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Screen 39: progress tracking and analytics. */
export default function AnalyticsPage() {
  const toast = useToast();
  const state = useAsync(() => activityService.progress(), []);
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);

  const log = async (e) => {
    e.preventDefault();
    const m = Number(minutes);
    if (!Number.isInteger(m) || m < 1 || m > 600) {
      toast.error('Check the minutes', 'Enter a whole number from 1 to 600.');
      return;
    }
    setSaving(true);
    try {
      state.setData(await activityService.logStudy(m));
      setMinutes('');
      toast.success('Session logged', `${m} minutes added.`);
    } catch (err) {
      toast.error('Couldn’t log the session', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Progress" title={<>See how far you’ve <em>come.</em></>}
        description="Roadmap completion, study time, quiz results and readiness over time." />
      <AsyncBoundary state={state} rows={4}>
        {(p) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Route} label="Roadmap complete" value={`${p.overall}%`} hint={`${p.milestones_completed}/${p.milestones_total} skills`} tint="pink" />
              <StatCard icon={BookCheck} label="Items finished" value={`${p.items_completed}/${p.items_total}`} hint="courses and projects" tint="lavender" />
              <StatCard icon={Flame} label="Current streak" value={`${p.streak_days} d`} hint={`${p.study_hours_total} h studied in total`} tint="sand" />
              <StatCard icon={GraduationCap} label="Quiz average" value={p.quiz_average != null ? `${p.quiz_average}%` : '—'} hint={`${p.skills_improved} skill${p.skills_improved === 1 ? '' : 's'} passed`} tint="sage" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card padding="lg">
                <h3 className="flex items-center gap-2 text-[24px] font-medium"><Clock className="h-5 w-5 text-plum" />Study hours per week</h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={p.weekly_hours.map((w) => ({ week: short(w.week_start), hours: w.hours }))}>
                      <CartesianGrid vertical={false} stroke="var(--color-line)" />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis width={30} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip cursor={{ fill: 'var(--color-linen)' }} formatter={(v) => [`${v} h`, 'Studied']} />
                      <Bar dataKey="hours" fill="var(--color-mauve)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card padding="lg">
                <h3 className="text-[24px] font-medium">Log a study session</h3>
                <form onSubmit={log} className="mt-4 space-y-3">
                  <TextField label="Minutes studied" type="number" min={1} max={600} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="45" />
                  <Button type="submit" as="button" leftIcon={Plus} loading={saving} className="w-full">Add session</Button>
                </form>
                <h4 className="mt-8 text-[13px] font-medium">Upcoming milestones</h4>
                <ul className="mt-3 space-y-3">
                  {p.upcoming.map((u) => (
                    <li key={u.module_id} className="text-[13px]">
                      <div className="flex justify-between"><span>{u.skill_name}</span><span className="text-muted">{u.due_date && short(u.due_date)}</span></div>
                      <ProgressBar value={u.progress} size="sm" tone="lavender" className="mt-1.5" label={u.skill_name} />
                    </li>
                  ))}
                  {p.upcoming.length === 0 && <li className="text-[13px] text-muted">No open milestones.</li>}
                </ul>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card padding="lg">
                <h3 className="text-[24px] font-medium">Quiz scores</h3>
                {p.quiz_history.length ? (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={p.quiz_history.map((q, i) => ({ n: i + 1, score: q.score, skill: q.skill_name }))}>
                        <CartesianGrid stroke="var(--color-line)" />
                        <XAxis dataKey="n" fontSize={12} tickLine={false} />
                        <YAxis domain={[0, 100]} width={34} fontSize={12} tickLine={false} />
                        <ReferenceLine y={80} stroke="var(--color-sage-deep)" strokeDasharray="4 4" label={{ value: 'pass', fontSize: 11, position: 'right' }} />
                        <ReferenceLine y={50} stroke="var(--color-blush-deep)" strokeDasharray="4 4" />
                        <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(n, items) => items?.[0]?.payload?.skill ?? n} />
                        <Line type="monotone" dataKey="score" stroke="var(--color-plum)" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="mt-3 text-sm text-muted">Take a skill check from your roadmap to see scores here.</p>}
              </Card>
              <Card padding="lg">
                <h3 className="text-[24px] font-medium">Recent quizzes</h3>
                <ul className="mt-4 divide-y divide-line">
                  {[...p.quiz_history].reverse().slice(0, 6).map((q, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 text-[14px]">
                      <span>{q.skill_name}<span className="block text-[12px] text-muted">{short(q.date)} · {q.action === 'complete' ? 'module completed' : q.action === 'remediate' ? 'extra practice added' : 'keep going'}</span></span>
                      <span className={`font-display text-[22px] font-medium ${q.score >= 80 ? 'text-sage-deep' : q.score < 50 ? 'text-blush-deep' : ''}`}>{q.score}%</span>
                    </li>
                  ))}
                  {p.quiz_history.length === 0 && <li className="py-2 text-sm text-muted">No quizzes yet.</li>}
                </ul>
                {p.readiness_history.length > 1 && (
                  <p className="mt-4 text-[13px] text-muted">
                    Readiness across roadmaps: {p.readiness_history.map((r) => `${r.readiness}%`).join(' → ')}
                  </p>
                )}
              </Card>
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
