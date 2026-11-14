import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../../../components/common/Button';
import DashboardPreview from './DashboardPreview';
import { PROFILE_SIGNALS } from '../../../data/publicContent';

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden">
      {/* Soft light washes — the only gradients on the page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-blush/60 blur-[110px]" />
        <div className="absolute top-10 right-[-12%] h-[480px] w-[480px] rounded-full bg-lavender/60 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[35%] h-[380px] w-[380px] rounded-full bg-sage/50 blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pt-14 pb-20 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-20 lg:pb-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-[12.5px] text-ink/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-plum" strokeWidth={1.75} />
            AI-powered upskilling for university students
          </span>

          <h1 className="mt-7 text-[52px] leading-[0.98] font-medium tracking-[-0.02em] sm:text-[64px] xl:text-[80px]">
            Your future deserves a learning path <em className="text-plum">of its own.</em>
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted md:text-lg">
            Discover your strengths, bridge your skill gaps and build a personalized roadmap towards your dream
            career.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button to="/signup" size="lg" rightIcon={ArrowRight}>
              Start Your Journey
            </Button>
            <Button href="#features" size="lg" variant="secondary">
              Explore Features
            </Button>
          </div>

          <p className="mt-10 font-display text-lg text-muted italic">
            Learn with purpose. Grow with direction.
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:150ms] lg:pl-4">
          <DashboardPreview />
        </div>
      </div>

      {/* What LUMORA reads */}
      <div className="border-y border-line/80 bg-paper/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-6 md:flex-row md:justify-between md:px-8">
          <p className="eyebrow shrink-0">LUMORA reads the whole picture</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink/75">
            {PROFILE_SIGNALS.map((item, i) => (
              <li key={item} className="flex items-center gap-5">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-mauve" aria-hidden />}
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
