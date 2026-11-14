import { Info } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import Badge from '../../../components/common/Badge';
import { SAMPLE_TESTIMONIALS } from '../../../data/publicContent';

export default function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Student voices"
          title={
            <>
              The feeling of finally <em>knowing what&rsquo;s next.</em>
            </>
          }
        />
        <Badge tone="outline" icon={Info} className="self-start md:self-auto">
          Sample content · illustrative testimonials
        </Badge>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {SAMPLE_TESTIMONIALS.map((t, i) => (
          <figure
            key={i}
            className={`flex flex-col justify-between rounded-3xl p-8 ${t.tint} ${i === 1 ? 'md:translate-y-8' : ''}`}
          >
            <blockquote className="font-display text-[23px] leading-snug text-ink">
              <span className="mr-1 text-plum">&ldquo;</span>
              {t.quote}
              <span className="ml-0.5 text-plum">&rdquo;</span>
            </blockquote>
            <figcaption className="mt-8 border-t border-ink/10 pt-5">
              <p className="text-sm font-medium">{t.name}</p>
              <p className="mt-0.5 text-[13px] text-muted">{t.detail}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
