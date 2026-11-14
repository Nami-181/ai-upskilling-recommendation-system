import { Check } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import CallToAction from '../../components/cards/CallToAction';
import {
  SkillGapPreview,
  RoadmapPreview,
  ResourcesVisual,
  ProjectVisual,
  CertificationVisual,
  AnalyticsVisual,
  AssistantPreview,
} from '../../components/cards/PreviewCards';
import { FEATURES } from '../../data/publicContent';
import { cn } from '../../utils/cn';

const VISUALS = {
  'skill-gap': <SkillGapPreview compact />,
  roadmap: <RoadmapPreview limit={5} />,
  resources: <ResourcesVisual />,
  projects: <ProjectVisual />,
  certifications: <CertificationVisual />,
  analytics: <AnalyticsVisual />,
  assistant: (
    <div className="flex justify-center rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <AssistantPreview />
    </div>
  ),
};

/** SCREEN 3 — Features */
export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={
          <>
            Seven tools that work <em>as one.</em>
          </>
        }
        description="From the first skill check to the final portfolio project, every LUMORA feature reads from the same profile — so your plan always makes sense as a whole."
      />

      {/* In-page navigation */}
      <nav aria-label="Features on this page" className="sticky top-[72px] z-30 border-y border-line bg-cream/90 backdrop-blur-md">
        <ul className="scroll-thin mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-3 md:px-8">
          {FEATURES.map(({ id, title, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] text-muted transition-colors hover:bg-paper hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {FEATURES.map((feature, i) => {
          const { id, icon: Icon, tint, panel, title, long, bullets } = feature;
          const reversed = i % 2 === 1;
          return (
            <section
              key={id}
              id={id}
              className="grid scroll-mt-40 items-center gap-12 border-b border-line py-20 last:border-b-0 md:py-28 lg:grid-cols-2 lg:gap-20"
            >
              <div className={cn(reversed && 'lg:order-2')}>
                <div className="flex items-center gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tint}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <span className="font-display text-[15px] text-muted italic">0{i + 1} / 0{FEATURES.length}</span>
                </div>
                <h2 className="mt-7 text-[38px] leading-[1.05] font-medium md:text-[48px]">{title}</h2>
                <p className="mt-5 text-[16.5px] leading-relaxed text-muted">{long}</p>
                <ul className="mt-8 space-y-3.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[15px]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-sage-deep">
                        <Check className="h-3 w-3" strokeWidth={2.4} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn('relative', reversed && 'lg:order-1')}>
                <div aria-hidden className={cn('absolute -inset-4 -z-10 rounded-[36px] md:-inset-8', panel)} />
                <div className="relative mx-auto max-w-lg">{VISUALS[id]}</div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="pt-8">
        <CallToAction eyebrow="Ready when you are" />
      </div>
    </>
  );
}
