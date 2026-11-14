import { useState } from 'react';
import { Radar, Route } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import { SkillGapPreview, RoadmapPreview } from '../../../components/cards/PreviewCards';
import { cn } from '../../../utils/cn';

const TABS = [
  {
    id: 'skills',
    label: 'Skill-gap analysis',
    icon: Radar,
    title: 'Know exactly what stands between you and your role.',
    body: 'Each skill is rated on a 0–5 scale against what your target role expects. The biggest, most important gaps are flagged as high priority, with a short explanation of why they matter.',
    points: ['Current vs required level', 'Priority for every gap', 'Plain-language explanations'],
  },
  {
    id: 'roadmap',
    label: 'Learning roadmap',
    icon: Route,
    title: 'A path you can actually follow, week by week.',
    body: 'Your gaps become an ordered roadmap — beginner foundations first, advanced topics later — with estimated weeks for every milestone and a clear marker for where you are now.',
    points: ['Beginner → advanced stages', 'Time estimates per milestone', 'Mark progress as you go'],
  },
];

export default function PreviewShowcase() {
  const [active, setActive] = useState('skills');
  const tab = TABS.find((t) => t.id === active);

  return (
    <section className="border-y border-line bg-linen/60">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          align="center"
          eyebrow="See it in action"
          title={
            <>
              Your gaps, then your <em>path.</em>
            </>
          }
        />

        <div role="tablist" aria-label="Product previews" className="mx-auto mt-10 flex w-fit gap-1 rounded-full border border-line bg-paper p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              type="button"
              id={`tab-${id}`}
              aria-selected={active === id}
              aria-controls={`panel-${id}`}
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-all duration-300 sm:px-5',
                active === id ? 'bg-ink text-cream shadow-soft' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.6} />
              {label}
            </button>
          ))}
        </div>

        <div
          key={active}
          role="tabpanel"
          id={`panel-${active}`}
          aria-labelledby={`tab-${active}`}
          className="mt-14 grid animate-fade-up items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20"
        >
          <div className="lg:pl-8">
            <h3 className="text-[34px] leading-[1.1] font-medium md:text-[42px]">{tab.title}</h3>
            <p className="mt-5 text-[16px] leading-relaxed text-muted">{tab.body}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {tab.points.map((p) => (
                <li key={p} className="rounded-full border border-line bg-paper px-4 py-2 text-[13px]">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-lg">{active === 'skills' ? <SkillGapPreview /> : <RoadmapPreview />}</div>
        </div>
      </div>
    </section>
  );
}
