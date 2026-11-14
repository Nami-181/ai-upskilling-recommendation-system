import {
  LayoutDashboard,
  Radar,
  Route,
  Library,
  Sparkles,
  CircleCheck,
  Circle,
  TrendingUp,
} from 'lucide-react';
import ProgressRing from '../../../components/common/ProgressRing';

/* A static, illustrative preview of the student dashboard for the hero.
   Built from real UI pieces (no screenshot), so it stays crisp at any size. */

const SKILLS = [
  { name: 'Python', current: 4, required: 5 },
  { name: 'SQL', current: 2, required: 4 },
  { name: 'Statistics', current: 3, required: 4 },
  { name: 'Machine Learning', current: 2, required: 5 },
];

const HOURS = [3, 5, 4, 7, 6, 8, 9];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function HoursChart() {
  const w = 220;
  const h = 72;
  const max = 10;
  const step = w / (HOURS.length - 1);
  const pts = HOURS.map((v, i) => [i * step, h - (v / max) * h]);
  const line = pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `C${cx},${py} ${cx},${y} ${x},${y}`;
    })
    .join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 16}`} className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="hoursFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-mauve)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-mauve)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hoursFill)" />
      <path d={line} fill="none" stroke="var(--color-plum)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={pts.at(-1)[0] - 1} cy={pts.at(-1)[1]} r="3" fill="var(--color-paper)" stroke="var(--color-plum)" strokeWidth="1.6" />
      {DAYS.map((d, i) => (
        <text key={i} x={i * step} y={h + 13} fontSize="8" fill="var(--color-muted)" textAnchor={i === 0 ? 'start' : i === DAYS.length - 1 ? 'end' : 'middle'}>
          {d}
        </text>
      ))}
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <div className="relative">
      {/* Browser frame */}
      <div className="overflow-hidden rounded-[22px] border border-line bg-paper shadow-lift">
        <div className="flex items-center gap-2 border-b border-line bg-cream/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-blush" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage" />
          <span className="ml-3 rounded-full bg-paper px-3 py-1 text-[10px] tracking-wide text-muted">
            lumora.app/dashboard
          </span>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-12 flex-col items-center gap-3 border-r border-line py-5 sm:flex">
            {[LayoutDashboard, Radar, Route, Library, Sparkles].map((Icon, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-blush/80 text-ink' : 'text-muted'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
            ))}
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-muted uppercase">Good morning</p>
                <p className="mt-1 font-display text-[26px] leading-none font-medium">Aanya</p>
                <p className="mt-2 text-[11px] text-muted">
                  Goal · <span className="text-plum">Data Scientist</span>
                </p>
              </div>
              <ProgressRing value={64} size={62} stroke={5}>
                <span className="text-[13px] font-semibold">64%</span>
              </ProgressRing>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1.15fr_1fr]">
              {/* Weekly hours */}
              <div className="rounded-xl border border-line bg-cream/60 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium">Weekly hours</p>
                  <span className="flex items-center gap-1 text-[10px] text-sage-deep">
                    <TrendingUp className="h-3 w-3" /> 42h
                  </span>
                </div>
                <HoursChart />
              </div>

              {/* Skill levels */}
              <div className="rounded-xl border border-line bg-cream/60 p-3.5">
                <p className="mb-3 text-[11px] font-medium">Skill levels</p>
                <ul className="space-y-2.5">
                  {SKILLS.map((s) => (
                    <li key={s.name}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span>{s.name}</span>
                        <span className="text-muted">
                          {s.current}/{s.required}
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-sand/70">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-lavender"
                          style={{ width: `${(s.required / 5) * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-plum/80"
                          style={{ width: `${(s.current / 5) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Roadmap */}
            <div className="mt-3 rounded-xl border border-line bg-cream/60 p-3.5">
              <p className="mb-2.5 text-[11px] font-medium">This week on your roadmap</p>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center gap-2 text-muted line-through decoration-mauve/60">
                  <CircleCheck className="h-3.5 w-3.5 text-sage-deep" /> Python for Data Science
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="h-3.5 w-3.5 text-mauve" /> Statistics &amp; Probability — Week 2
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <Circle className="h-3.5 w-3.5 text-line" /> SQL joins &amp; aggregations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notes */}
      <div className="absolute -top-5 -left-6 hidden animate-fade-up rounded-2xl border border-line bg-paper/95 px-4 py-3 shadow-soft backdrop-blur [animation-delay:400ms] md:block">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Skill gap found</p>
        <p className="mt-0.5 text-[13px] font-medium">
          SQL <span className="text-muted">· 2 levels to go</span>
        </p>
      </div>
      <div className="absolute -right-5 -bottom-6 hidden animate-fade-up items-center gap-3 rounded-2xl border border-line bg-paper/95 px-4 py-3 shadow-soft backdrop-blur [animation-delay:650ms] md:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage">
          <Sparkles className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[13px] font-medium">Roadmap updated</p>
          <p className="text-[11px] text-muted">2 new SQL milestones</p>
        </div>
      </div>
    </div>
  );
}
