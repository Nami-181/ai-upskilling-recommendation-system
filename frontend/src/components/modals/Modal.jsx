import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Accessible modal dialog.
 * - Escape and backdrop click close it (unless `dismissible={false}`)
 * - Focus moves into the dialog and returns to the trigger on close
 * - Tab is kept inside the dialog
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'sm', dismissible = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Keep the latest onClose without re-running the focus effect on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])') ?? [];

    // Focus the first non-close control, falling back to the panel
    const first = [...focusables()].find((el) => !el.dataset.modalClose);
    (first ?? panel)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current?.();
      if (e.key === 'Tab') {
        const items = [...focusables()];
        if (!items.length) return;
        const [firstEl, lastEl] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-[3px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-scale-in rounded-3xl border border-line bg-paper p-6 shadow-lift focus:outline-none sm:p-8',
          SIZES[size],
        )}
      >
        {dismissible && (
          <button
            type="button"
            data-modal-close="true"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-muted transition-colors hover:bg-sand/50 hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {title && (
          <h2 id={titleId} className="pr-8 text-[28px] leading-tight font-medium">
            {title}
          </h2>
        )}
        {description && (
          <p id={descId} className="mt-2 text-[15px] leading-relaxed text-muted">
            {description}
          </p>
        )}
        {children && <div className={cn((title || description) && 'mt-6')}>{children}</div>}
        {footer && <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
