import { cn } from '../../utils/cn';

/** Top section for public sub-pages (About, Features, How it works, FAQ). */
export default function PageHero({ eyebrow, title, description, children, className }) {
  return (
    <section className={cn('relative isolate overflow-hidden', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-[-8%] h-[460px] w-[460px] rounded-full bg-blush/55 blur-[110px]" />
        <div className="absolute -top-24 right-[-6%] h-[420px] w-[420px] rounded-full bg-lavender/55 blur-[110px]" />
      </div>
      <div className="mx-auto max-w-4xl animate-fade-up px-5 pt-16 pb-16 text-center md:px-8 md:pt-24 md:pb-20">
        {eyebrow && (
          <p className="eyebrow mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-mauve" aria-hidden />
            {eyebrow}
            <span className="h-px w-6 bg-mauve" aria-hidden />
          </p>
        )}
        <h1 className="text-[46px] leading-[1.02] font-medium tracking-[-0.015em] md:text-[68px] [&_em]:text-plum [&_em]:italic">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted md:text-lg">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
