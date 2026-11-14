import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CircleCheck, accent: 'text-sage-deep', bar: 'bg-sage-deep/60' },
  error: { icon: CircleAlert, accent: 'text-blush-deep', bar: 'bg-blush-deep/70' },
  info: { icon: Info, accent: 'text-lavender-deep', bar: 'bg-lavender-deep/60' },
};

/**
 * Global toast notifications.
 * const toast = useToast();
 * toast.success('Saved', 'Your profile was updated.');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, title, message, duration = 3800) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (title, message, d) => push('success', title, message, d),
      error: (title, message, d) => push('error', title, message, d),
      info: (title, message, d) => push('info', title, message, d),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2.5"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const { icon: Icon, accent, bar } = STYLES[t.type] ?? STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto relative flex animate-toast-in items-start gap-3 overflow-hidden rounded-2xl border border-line bg-paper/95 p-4 pl-5 shadow-lift backdrop-blur"
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', bar)} aria-hidden />
              <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', accent)} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-full p-1 text-muted transition-colors hover:bg-sand/60 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
