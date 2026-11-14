import { ArrowRight } from 'lucide-react';
import Button from '../../../components/common/Button';

export default function AboutIntro() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <p className="eyebrow flex items-center gap-3 lg:pt-4">
          <span className="h-px w-6 bg-mauve" aria-hidden />
          About LUMORA
        </p>
        <div>
          <p className="font-display text-[30px] leading-[1.25] text-ink md:text-[40px]">
            University gives you courses. It rarely tells you which skills your dream role expects, which resources
            are worth your evenings, or what to build next.{' '}
            <em className="text-plum italic">
              LUMORA reads your academic background, skills, projects and goals — and turns them into a path that is
              unmistakably yours.
            </em>
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-line pt-8">
            {[
              ['7', 'profile signals analysed'],
              ['0–5', 'proficiency scale per skill'],
              ['3', 'roadmap stages, beginner to advanced'],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="font-display text-[40px] leading-none font-medium text-plum">{value}</span>
                <span className="max-w-[9rem] text-[13px] leading-snug text-muted">{label}</span>
              </div>
            ))}
            <Button to="/about" variant="link" rightIcon={ArrowRight} className="ml-auto">
              More about us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
