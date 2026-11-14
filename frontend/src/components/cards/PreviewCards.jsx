import { CircleCheck, Circle, CircleDot, Sparkles, Clock, ArrowUpRight, PlayCircle, FileText, BookOpen, Award, Flame } from 'lucide-react';
import Badge from '../common/Badge';
import { SAMPLE_SKILL_GAP, SAMPLE_ROADMAP, SAMPLE_RECOMMENDATIONS } from '../../data/publicContent';
import { cn } from '../../utils/cn';

/* Illustrative product previews used on the landing and features pages.
   They show SAMPLE data and say so — they are not live recommendations. */

export function SampleNote({ children = 'Sample data for illustration', className }) {
  return <p className={cn('text-[11px] text-muted italic', className)}>{children}</p>;
}

/* ── Skill gap: current vs required bars ─────────────────── */
export function SkillGapPreview({ compact = false }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px]">Skill gap analysis</p>
          <p className="mt-1 font-display text-[24px] leading-tight font-medium">Data Scientist</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-plum/80" /> Current</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lavender" /> Required</span>
        </div>
      </div>

      <ul className={cn('mt-6', compact ? 'space-y-4' : 'space-y-5')}>
        {SAMPLE_SKILL_GAP.map((s) => (
          <li key={s.skill}>
            <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
              <span className="font-medium">{s.skill}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted tabular-nums">
                  {s.current}/5 → {s.required}/5
                </span>
                <Badge tone={s.priority === 'High' ? 'pink' : 'neutral'} className="px-2! py-0.5! text-[10px]!">
                  {s.priority}
                </Badge>
              </span>
            </div>
            {/* five-segment scale */}
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn(
                    'h-2 rounded-full',
                    n <= s.current ? 'bg-plum/80' : n <= s.required ? 'bg-lavender' : 'bg-sand/60',
                  )}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!compact && (
        <div className="mt-6 rounded-xl bg-blush/40 p-4 text-[13px] leading-relaxed">
          <p className="font-medium">Highest priority: SQL & Machine Learning</p>
          <p className="mt-1 text-muted">Both appear in most Data Scientist roles and are 2–3 levels below the expected level.</p>
        </div>
      )}
      <SampleNote className="mt-4" />
    </div>
  );
}

/* ── Roadmap timeline ────────────────────────────────────── */
const STATUS_ICON = {
  done: <CircleCheck className="h-[18px] w-[18px] text-sage-deep" strokeWidth={1.75} />,
  current: <CircleDot className="h-[18px] w-[18px] text-plum" strokeWidth={1.75} />,
  next: <Circle className="h-[18px] w-[18px] text-mauve/70" strokeWidth={1.5} />,
};

export function RoadmapPreview({ limit }) {
  const items = limit ? SAMPLE_ROADMAP.slice(0, limit) : SAMPLE_ROADMAP;
  let lastStage = null;
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px]">Learning roadmap</p>
          <p className="mt-1 font-display text-[24px] leading-tight font-medium">Data Scientist path</p>
        </div>
        <Badge tone="sage">1 of 7 complete</Badge>
      </div>
      <ol className="relative mt-6">
        <span aria-hidden className="absolute top-2 bottom-2 left-[8.5px] w-px bg-line" />
        {items.map((item) => {
          const showStage = item.stage !== lastStage;
          lastStage = item.stage;
          return (
            <li key={item.title}>
              {showStage && (
                <p className="relative mb-2 ml-8 pt-1 text-[10px] font-medium tracking-[0.18em] text-muted uppercase first:pt-0">
                  {item.stage}
                </p>
              )}
              <div
                className={cn(
                  'relative mb-2.5 flex items-center gap-3 rounded-xl py-2 pr-3',
                  item.status === 'current' && 'bg-blush/45',
                )}
              >
                <span className="relative z-10 rounded-full bg-paper">{STATUS_ICON[item.status]}</span>
                <span
                  className={cn(
                    'flex-1 text-[13.5px]',
                    item.status === 'done' && 'text-muted line-through decoration-mauve/60',
                    item.status === 'current' && 'font-medium',
                  )}
                >
                  {item.title}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <Clock className="h-3 w-3" /> {item.weeks} wk
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <SampleNote className="mt-2" />
    </div>
  );
}

/* ── Recommendation cards with "why" ─────────────────────── */
export function RecommendationList() {
  return (
    <div className="space-y-3">
      {SAMPLE_RECOMMENDATIONS.map((rec) => (
        <article key={rec.title} className="rounded-2xl border border-line bg-paper p-5 shadow-hair transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium text-ink/80', rec.tint)}>{rec.type}</span>
              <h4 className="mt-2.5 font-display text-[21px] leading-snug font-medium">{rec.title}</h4>
              <p className="mt-1 text-[12.5px] text-muted">{rec.meta}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" />
          </div>
          <p className="mt-4 flex items-start gap-2 border-t border-line pt-3.5 text-[13px] leading-snug text-ink/80">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender-deep" />
            <span>
              <span className="font-medium">Why this: </span>
              {rec.reason}
            </span>
          </p>
        </article>
      ))}
      <SampleNote className="pl-1">Sample recommendations for illustration — not generated by a live model</SampleNote>
    </div>
  );
}

/* ── Assistant chat ──────────────────────────────────────── */
export function AssistantPreview() {
  return (
    <div className="w-full max-w-sm space-y-3 text-[13px]">
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-cream">
        What skill should I learn next?
      </div>
      <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3 leading-relaxed">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-plum">
          <Sparkles className="h-3 w-3" /> LUMORA
        </p>
        SQL is your largest gap for the Data Scientist role. Start with joins and aggregations — about 3 hours this
        week fits your schedule.
      </div>
      <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3" aria-hidden>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mauve [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mauve [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mauve" />
      </div>
      <SampleNote className="pl-1">Illustrative example of the assistant interface</SampleNote>
    </div>
  );
}

/* ── Smaller visuals for the Features page ───────────────── */
export function ResourcesVisual() {
  const rows = [
    { icon: BookOpen, title: 'Statistics fundamentals', meta: 'Course · Beginner · 10h', cost: 'Free', tag: 'Statistics' },
    { icon: PlayCircle, title: 'SQL joins, visually explained', meta: 'Video · Beginner · 45m', cost: 'Free', tag: 'SQL' },
    { icon: FileText, title: 'pandas user guide', meta: 'Documentation · Intermediate', cost: 'Free', tag: 'Python' },
    { icon: BookOpen, title: 'Applied machine learning', meta: 'Course · Advanced · 30h', cost: 'Paid', tag: 'ML' },
  ];
  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap gap-2">
        {['All', 'Free', 'Beginner', 'Under 2h'].map((f, i) => (
          <span key={f} className={cn('rounded-full border px-3 py-1 text-[11.5px]', i === 1 ? 'border-ink bg-ink text-cream' : 'border-line text-muted')}>
            {f}
          </span>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {rows.map(({ icon: Icon, title, meta, cost, tag }) => (
          <li key={title} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage/70 text-sage-deep">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">{title}</p>
              <p className="text-[11.5px] text-muted">{meta}</p>
            </div>
            <span className="hidden rounded-full bg-sand/60 px-2 py-0.5 text-[10.5px] sm:inline">{tag}</span>
            <span className={cn('text-[11.5px] font-medium', cost === 'Free' ? 'text-sage-deep' : 'text-muted')}>{cost}</span>
          </li>
        ))}
      </ul>
      <SampleNote className="mt-3" />
    </div>
  );
}

export function ProjectVisual() {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <Badge tone="lavender">Intermediate</Badge>
        <span className="flex items-center gap-1 text-[12px] text-muted"><Clock className="h-3.5 w-3.5" /> 2–3 weeks</span>
      </div>
      <h4 className="mt-4 font-display text-[26px] leading-tight font-medium">Student Performance Dashboard</h4>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        Clean a public education dataset, store it in SQL and build an interactive dashboard that highlights trends.
      </p>
      <p className="mt-5 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Tech stack</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {['Python', 'pandas', 'SQL', 'Plotly'].map((t) => (
          <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{t}</span>
        ))}
      </div>
      <p className="mt-4 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Skills gained</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {['Data cleaning', 'SQL joins', 'Visualisation'].map((t) => (
          <span key={t} className="rounded-full bg-sage px-2.5 py-0.5 text-[12px] text-sage-deep">{t}</span>
        ))}
      </div>
      <SampleNote className="mt-5" />
    </div>
  );
}

export function CertificationVisual() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Entry-level Data Analytics', provider: 'Professional certificate', cost: 'Paid · free audit', prep: '4–6 weeks', level: 'Beginner', progress: 60 },
        { name: 'Cloud Fundamentals', provider: 'Cloud provider exam', cost: 'Exam fee', prep: '3–4 weeks', level: 'Beginner', progress: 0 },
      ].map((c) => (
        <div key={c.name} className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush/70 text-plum">
              <Award className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
            <div className="flex-1">
              <p className="font-display text-[20px] leading-tight font-medium">{c.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">{c.provider} · {c.level}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-lg bg-linen px-3 py-2"><p className="text-muted">Cost</p><p className="font-medium">{c.cost}</p></div>
            <div className="rounded-lg bg-linen px-3 py-2"><p className="text-muted">Preparation</p><p className="font-medium">{c.prep}</p></div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[11.5px]"><span className="text-muted">Preparation progress</span><span>{c.progress}%</span></div>
            <div className="h-1.5 rounded-full bg-sand/70"><div className="h-full rounded-full bg-plum/70" style={{ width: `${c.progress}%` }} /></div>
          </div>
        </div>
      ))}
      <SampleNote className="pl-1" />
    </div>
  );
}

export function AnalyticsVisual() {
  const weeks = [
    { w: 'W1', h: 4 }, { w: 'W2', h: 6 }, { w: 'W3', h: 5 }, { w: 'W4', h: 8 },
    { w: 'W5', h: 7 }, { w: 'W6', h: 9 }, { w: 'W7', h: 10 }, { w: 'W8', h: 8 },
  ];
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Study hours', value: '57h' },
          { label: 'Milestones', value: '9' },
          { label: 'Streak', value: '5 days', icon: Flame },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-linen px-3 py-3">
            <p className="text-[11px] text-muted">{s.label}</p>
            <p className="mt-1 flex items-center gap-1 font-display text-[22px] font-medium">
              {s.icon && <s.icon className="h-4 w-4 text-blush-deep" />}
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 mb-3 text-[12px] font-medium">Weekly study hours</p>
      <div className="flex h-32 items-end gap-2.5">
        {weeks.map(({ w, h }, i) => (
          <div key={w} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn('w-full rounded-t-lg transition-all', i === weeks.length - 2 ? 'bg-plum/75' : 'bg-lavender')}
              style={{ height: `${(h / 10) * 100}%` }}
              title={`${h} hours`}
            />
            <span className="text-[10px] text-muted">{w}</span>
          </div>
        ))}
      </div>
      <SampleNote className="mt-4" />
    </div>
  );
}
