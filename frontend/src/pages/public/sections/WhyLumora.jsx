import { Check, Minus } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import { WHY_USUAL, WHY_LUMORA } from '../../../data/publicContent';

export default function WhyLumora() {
  return (
    <section className="border-y border-line bg-linen/60">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          align="center"
          eyebrow="Why LUMORA?"
          title={
            <>
              Less searching. <em>More becoming.</em>
            </>
          }
          description="Most students don’t lack motivation — they lack a clear, personal plan. LUMORA replaces guesswork with direction."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-cream/70 p-8 md:p-10">
            <p className="eyebrow">The usual way</p>
            <ul className="mt-6 space-y-4">
              {WHY_USUAL.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15.5px] text-muted">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand/70">
                    <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-sage bg-paper p-8 shadow-soft md:p-10">
            <p className="eyebrow text-sage-deep!">The LUMORA way</p>
            <ul className="mt-6 space-y-4">
              {WHY_LUMORA.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15.5px] text-ink">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-sage-deep">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
