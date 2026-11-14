import { cn } from '../../utils/cn';

/**
 * Editorial heading block: eyebrow, serif title, supporting text.
 * Pass JSX as `title` to italicise a phrase: <>Grow <em>gently</em></>
 */
export default function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  const centered = align === 'center';
  return (
    <div className={cn('max-w-2xl', centered && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className={cn('eyebrow mb-4 flex items-center gap-3', centered && 'justify-center')}>
          <span className="h-px w-6 bg-mauve" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2 className="text-[40px] leading-[1.05] font-medium md:text-[52px] [&_em]:text-plum [&_em]:italic">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted md:text-[17px]">{description}</p>
      )}
    </div>
  );
}
