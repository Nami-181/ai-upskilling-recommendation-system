import { ArrowRight } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import Button from '../../../components/common/Button';
import { STEPS } from '../../../data/publicContent';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-paper/60">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title={
            <>
              Five quiet steps from <em>uncertain</em> to <em>underway.</em>
            </>
          }
          description="LUMORA turns what you already know about yourself into a plan you can follow, week by week."
        />

        <ol className="relative mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          <span aria-hidden className="absolute top-7 right-[10%] left-[10%] hidden h-px bg-line lg:block" />
          {STEPS.map((step) => (
            <li key={step.number} className="relative text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-cream font-display text-[22px] text-plum italic">
                {step.number}
              </span>
              <h3 className="mt-6 text-[23px] leading-tight font-medium">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-[15rem] text-[14.5px] leading-relaxed text-muted">{step.short}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 text-center">
          <Button to="/how-it-works" variant="secondary" rightIcon={ArrowRight}>
            See each step in detail
          </Button>
        </div>
      </div>
    </section>
  );
}
