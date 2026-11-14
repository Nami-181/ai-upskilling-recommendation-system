import { Check } from 'lucide-react';
import { BENEFITS } from '../../../data/publicContent';

export default function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="h-px w-6 bg-mauve" aria-hidden />
            Benefits for students
          </p>
          <h2 className="text-[40px] leading-[1.05] font-medium md:text-[52px]">
            Clarity for the <em className="text-plum italic">in-between</em> years.
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            Whether you’re preparing for internships, placements or simply deciding what comes next, LUMORA gives
            your effort a direction.
          </p>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {BENEFITS.map((benefit, i) => (
            <li key={benefit.title} className="flex gap-6 py-8">
              <span className="font-display text-sm text-muted tabular-nums italic">0{i + 1}</span>
              <div className="flex-1">
                <h3 className="flex items-center gap-3 text-[26px] leading-tight font-medium">
                  {benefit.title}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage">
                    <Check className="h-3.5 w-3.5 text-sage-deep" strokeWidth={2} />
                  </span>
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{benefit.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
