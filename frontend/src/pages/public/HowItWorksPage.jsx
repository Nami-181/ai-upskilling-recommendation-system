import { ArrowDown, Check, ArrowRight } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import Button from '../../components/common/Button';
import CallToAction from '../../components/cards/CallToAction';
import { STEPS } from '../../data/publicContent';
import { cn } from '../../utils/cn';

const TINTS = ['bg-blush/50', 'bg-lavender/50', 'bg-sage/60', 'bg-sand/55', 'bg-blush/50'];
const ICON_TINTS = [
  'bg-paper text-plum',
  'bg-paper text-lavender-deep',
  'bg-paper text-sage-deep',
  'bg-paper text-sand-deep',
  'bg-paper text-plum',
];

/** SCREEN 4 — How it works (five-step visual process) */
export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From profile to progress, <em>in five steps.</em>
          </>
        }
        description="LUMORA guides you from understanding where you are today to following a plan built for where you want to go."
      >
        <div className="mt-10 flex justify-center">
          <Button href="#step-01" variant="secondary" rightIcon={ArrowDown}>
            Walk through the steps
          </Button>
        </div>
      </PageHero>

      {/* Compact overview rail */}
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <ol className="grid grid-cols-5 gap-2 border-y border-line py-6" aria-label="Steps overview">
          {STEPS.map((step) => (
            <li key={step.number}>
              <a href={`#step-${step.number}`} className="group flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper font-display text-[16px] text-plum italic transition-colors group-hover:border-mauve group-hover:bg-blush/50">
                  {step.number}
                </span>
                <span className="hidden text-[12.5px] leading-tight text-muted transition-colors group-hover:text-ink sm:block">
                  {step.title}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Detailed steps */}
      <div className="relative mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
        <span aria-hidden className="absolute top-28 bottom-28 left-[43px] w-px bg-line md:left-[59px]" />
        <ol className="space-y-10 md:space-y-14">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.number} id={`step-${step.number}`} className="relative flex scroll-mt-28 gap-5 md:gap-8">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-cream font-display text-[18px] text-plum italic md:h-14 md:w-14 md:text-[20px]">
                  {step.number}
                </span>
                <div className={cn('flex-1 rounded-3xl p-7 md:p-10', TINTS[i])}>
                  <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-md">
                      <span className={cn('flex h-11 w-11 items-center justify-center rounded-full', ICON_TINTS[i])}>
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <h2 className="mt-6 text-[32px] leading-tight font-medium md:text-[38px]">{step.title}</h2>
                      <p className="mt-3 text-[16px] leading-relaxed text-ink/70">{step.short}</p>
                    </div>
                    <div className="rounded-2xl bg-paper/80 p-5 md:w-72">
                      <p className="eyebrow text-[10px]">What you’ll do</p>
                      <ul className="mt-3 space-y-2.5">
                        {step.details.map((d) => (
                          <li key={d} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-deep" strokeWidth={2.2} />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5 border-t border-line pt-4">
                        <p className="eyebrow text-[10px]">You get</p>
                        <p className="mt-1.5 font-display text-[19px] leading-snug font-medium">{step.output}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-[26px] text-muted italic">Setup takes about ten minutes.</p>
          <Button to="/signup" size="lg" rightIcon={ArrowRight}>
            Build my profile
          </Button>
        </div>
      </div>

      <CallToAction />
    </>
  );
}
