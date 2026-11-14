import { cn } from '../../utils/cn';

const FILLS = {
  ink: 'bg-ink',
  mauve: 'bg-mauve',
  sage: 'bg-sage-deep/70',
  lavender: 'bg-lavender-deep/70',
  pink: 'bg-blush-deep/70',
};

export default function ProgressBar({ value = 0, max = 100, tone = 'mauve', size = 'md', label, className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-sand/60', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', FILLS[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
