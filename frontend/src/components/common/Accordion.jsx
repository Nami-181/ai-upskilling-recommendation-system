import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

function AccordionItem({ item, open, onToggle }) {
  const id = useId();
  return (
    <div className="border-b border-line">
      <h3 className="font-sans">
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="font-display text-[22px] leading-snug text-ink transition-colors group-hover:text-plum md:text-[24px]">
            {item.question}
          </span>
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
              open ? 'rotate-45 border-ink bg-ink text-cream' : 'border-line text-ink group-hover:border-mauve',
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={1.6} />
          </span>
        </button>
      </h3>
      {/* grid-rows trick animates height without measuring */}
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-400 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pr-12 pb-7 text-[15.5px] leading-relaxed text-muted">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

/** Expandable Q&A list. One item open at a time. */
export default function Accordion({ items, defaultOpen = 0, className }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  return (
    <div className={cn('border-t border-line', className)}>
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          item={item}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
        />
      ))}
    </div>
  );
}
