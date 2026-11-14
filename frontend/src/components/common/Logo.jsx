import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

/** The LUMORA mark: a quiet horizon ring with a rising light. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="var(--color-paper)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9.5" fill="none" stroke="var(--color-line)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
      <circle cx="19.4" cy="12.6" r="3.4" fill="var(--color-mauve)" />
    </svg>
  );
}

export default function Logo({ to = '/', compact = false, className }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 text-ink', className)}
      aria-label="LUMORA home"
    >
      <LogoMark />
      {!compact && (
        <span className="font-display text-[22px] font-semibold tracking-[0.18em]">LUMORA</span>
      )}
    </Link>
  );
}
