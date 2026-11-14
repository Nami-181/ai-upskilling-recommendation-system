import { useState } from 'react';
import { ArrowRight, Award, CalendarDays, Check, ChevronDown, ClipboardCheck, Compass, FolderKanban, RotateCw, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import QuizModal from '../../components/app/QuizModal';
import { ResourceCard, StatusBadge } from '../../components/app/Widgets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { DIFFICULTY, roadmapService, STATUS_LABELS } from '../../services/learningService';
import { cn } from '../../utils/cn';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—');

/** Screens 30–31: personalised learning roadmap with per-skill steps, quizzes and feedback. */
export default function RoadmapPage() {
  const { user } = useAuth();
  const toast = useToast();
  const state = useAsync(() => roadmapService.get(), []);
  const [open, setOpen] = useState(null);
  const [quizSkill, setQuizSkill] = useState(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [busy, setBusy] = useState(false);

  const act = async (fn, success) => {
    try {
      const data = await fn();
      if (data?.path !== undefined) state.setData(data);
      else await state.reload();
      if (success) toast.success(...[].concat(typeof success === 'function' ? success(data) : success));
    } catch (err) {
      toast.error('Something went wrong', err.message);
    }
  };

  const generate = async () => {
    setBusy(true);
    await act(() => roadmapService.generate(), ['Roadmap ready', 'Built from your latest skills and quiz results.']);
    setBusy(false);
    setConfirmRegen(false);
  };

  const feedback = (item, value) =>
    act(async () => {
      const r = await roadmapService.feedback(item.id, value);
      toast.info('Thanks for the feedback', r.message);
      return roadmapService.get();
    });

  const save = (item) => act(async () => { await roadmapService.toggleSaved(item.id); return roadmapService.get(); },
    item.saved ? 'Removed from wishlist' : 'Saved to wishlist');

  return (
    <div className="animate-fade-up space-y-8">
      <AsyncBoundary state={state}>
        {(data) => {
          if (!data.path) {
            return (
              <EmptyState icon={Compass} title="You don’t have a roadmap yet"
                description={user?.targetRole ? `We’ll build a step-by-step plan to become a ${user.targetRole}.` : 'Pick a target career first, then we’ll build your plan.'}
                action={user?.targetRole
                  ? <Button leftIcon={Sparkles} loading={busy} onClick={generate}>Generate my roadmap</Button>
                  : <Button to="/app/careers" rightIcon={ArrowRight}>Choose a career</Button>} />
            );
          }
          const p = data.path;
          return (
            <>
              <PageHeader eyebrow="Learning roadmap" title={<>Your path to <em>{p.role_title}</em></>}
                description={`${p.modules_total} skills · about ${p.total_hours} hours at ${p.hours_per_week} h/week · finish by ${new Date(p.est_finish).toLocaleDateString()}`}
                actions={<Button variant="secondary" leftIcon={RotateCw} onClick={() => setConfirmRegen(true)}>Regenerate</Button>} />

              <Card tint="paper" className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex justify-between text-[13px] text-muted"><span>{p.modules_completed} of {p.modules_total} skills complete</span><span>{p.progress}%</span></div>
                  <ProgressBar value={p.progress} className="mt-2" label="Roadmap progress" />
                </div>
                <Badge tone="pink">Readiness at start: {p.readiness}%</Badge>
              </Card>

              {data.modules.length === 0 && (
                <EmptyState icon={Check} title="Nothing to learn for this role" description="You already meet every requirement. Try a more advanced career." />
              )}

              <ol className="relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-line">
                {data.modules.map((m) => {
                  const isOpen = open === m.id;
                  const done = m.status === 'completed';
                  return (
                    <li key={m.id} className="relative pl-12">
                      <span className={cn('absolute top-5 left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-medium',
                        done ? 'border-sage-deep bg-sage text-sage-deep' : m.status === 'in_progress' ? 'border-plum bg-lavender text-plum' : 'border-line bg-paper text-muted')}>
                        {done ? <Check className="h-3.5 w-3.5" /> : m.order_no}
                      </span>
                      <Card padding="none" className={cn(done && 'opacity-80')}>
                        <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen}
                          className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[24px] leading-tight font-medium">{m.skill_name}</h3>
                              <StatusBadge status={m.status} />
                            </div>
                            <p className="mt-1 text-[13px] text-muted">{m.reason}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[13px] text-muted">
                            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />Week {m.week_no} · {fmt(m.due_date)}</span>
                            <span>{m.hours} h</span>
                            <span className="w-24"><ProgressBar value={m.progress} size="sm" label={`${m.skill_name} progress`} /></span>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="animate-fade-in space-y-5 border-t border-line p-5">
                            <p className="text-[13px] text-muted">Level {m.current_level} → target {m.target_level}. Courses are ranked for your level, preferences and past feedback.</p>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {m.resources.map((r) => (
                                <ResourceCard key={r.id} item={r} onSave={save} onFeedback={feedback}
                                  onStatus={(item, status) => act(() => roadmapService.setItemStatus(item.id, status))} />
                              ))}
                            </div>
                            {m.project && (
                              <Card tint="sand" padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <FolderKanban className="h-5 w-5 shrink-0 text-plum" />
                                <div className="flex-1">
                                  <p className="font-medium">Project: {m.project.title}</p>
                                  <p className="text-[13px] text-muted">{m.project.description} · {DIFFICULTY[m.project.level]} · ~{m.project.est_hours} h</p>
                                </div>
                                <select value={m.project.status} aria-label="Project status"
                                  onChange={(e) => act(() => roadmapService.setItemStatus(m.project.id, e.target.value))}
                                  className="h-8 rounded-full border border-line bg-paper px-3 text-[12.5px]">
                                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </Card>
                            )}
                            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                              <Button size="sm" leftIcon={ClipboardCheck} onClick={() => setQuizSkill(m)}>Take the skill check</Button>
                              {!done ? (
                                <Button size="sm" variant="secondary" leftIcon={Check}
                                  onClick={() => act(() => roadmapService.setModuleStatus(m.id, 'completed'), [`${m.skill_name} complete`, 'Later steps moved earlier.'])}>
                                  Mark skill complete
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => act(() => roadmapService.setModuleStatus(m.id, 'in_progress'))}>Reopen</Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ol>

              {data.certifications.length > 0 && (
                <Card padding="lg">
                  <h3 className="flex items-center gap-2 text-[26px] font-medium"><Award className="h-5 w-5 text-plum" />Certifications to aim for</h3>
                  <ul className="mt-4 grid gap-3 md:grid-cols-3">
                    {data.certifications.map((c) => (
                      <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-plum hover:underline">{c.title}</a>
                        <p className="text-[13px] text-muted">{c.provider} · {c.cost}</p>
                        <p className="mt-2 text-[12.5px] text-muted">{c.reason}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <QuizModal open={!!quizSkill} skill={quizSkill} onClose={() => setQuizSkill(null)} onDone={() => state.reload()} />
              <ConfirmDialog open={confirmRegen} onClose={() => setConfirmRegen(false)} onConfirm={generate} loading={busy}
                title="Regenerate your roadmap?" confirmLabel="Regenerate"
                description="We’ll rebuild it from your current skills, quiz scores and feedback. Progress on the old roadmap stays in your history." />
            </>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}
