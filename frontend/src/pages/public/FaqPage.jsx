import { useMemo, useState } from 'react';
import { Search, X, MessageCircleQuestion, ArrowRight } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import Accordion from '../../components/common/Accordion';
import Button from '../../components/common/Button';
import { FAQS, FAQ_CATEGORIES } from '../../data/publicContent';
import { cn } from '../../utils/cn';

/** SCREEN 5 — FAQ (expandable, searchable, filterable) */
export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) =>
        (category === 'All' || f.category === category) &&
        (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const grouped = FAQ_CATEGORIES.map((c) => ({ category: c, items: results.filter((r) => r.category === c) })).filter(
    (g) => g.items.length,
  );

  const clear = () => {
    setQuery('');
    setCategory('All');
  };

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Questions, <em>answered.</em>
          </>
        }
        description="Everything you might want to know before — and after — you start with LUMORA."
      >
        <div className="relative mx-auto mt-10 max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-5 h-[18px] w-[18px] -translate-y-1/2 text-muted" strokeWidth={1.6} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search frequently asked questions"
            className="h-14 w-full rounded-full border border-line bg-paper/90 pr-12 pl-13 text-[15px] shadow-soft placeholder:text-muted/80 focus:border-mauve focus:bg-white focus:ring-4 focus:ring-lavender/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-sand/50 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PageHero>

      <div className="mx-auto max-w-4xl px-5 pb-24 md:px-8 md:pb-32">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap justify-center gap-2">
          {['All', ...FAQ_CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300',
                category === c ? 'border-ink bg-ink text-cream' : 'border-line bg-paper/70 text-muted hover:border-mauve hover:text-ink',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? 'question' : 'questions'}
          {query && <> matching “{query}”</>}
        </p>

        {grouped.length ? (
          <div className="mt-10 space-y-14">
            {grouped.map((g) => (
              <section key={g.category}>
                <h2 className="eyebrow mb-2">{g.category}</h2>
                <Accordion key={`${g.category}-${query}`} items={g.items} defaultOpen={-1} />
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-line bg-paper/50 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender/70 text-lavender-deep">
              <MessageCircleQuestion className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-5 text-[28px] font-medium">No questions match that.</h3>
            <p className="mt-2 max-w-sm text-muted">Try a different word, or ask us directly — we’re happy to help.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={clear}>Clear search</Button>
              <Button to="/about#contact" rightIcon={ArrowRight}>Contact us</Button>
            </div>
          </div>
        )}

        <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-3xl bg-lavender/45 p-8 text-center md:flex-row md:p-10 md:text-left">
          <div>
            <h3 className="text-[28px] leading-tight font-medium">Still have a question?</h3>
            <p className="mt-1.5 text-muted">Send us a message and the LUMORA team will get back to you.</p>
          </div>
          <Button to="/about#contact" rightIcon={ArrowRight} className="shrink-0">
            Get in touch
          </Button>
        </div>
      </div>
    </>
  );
}
