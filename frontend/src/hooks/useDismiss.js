import { useEffect } from 'react';

/** Calls onDismiss on outside click or Escape while `active` — for dropdowns and popovers. */
export function useDismiss(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && onDismiss();
    const onKey = (e) => e.key === 'Escape' && onDismiss();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active, onDismiss]);
}
