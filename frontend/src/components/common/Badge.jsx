import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-sand/60 text-ink/80',
  pink: 'bg-blush/70 text-plum',
  lavender: 'bg-lavender/70 text-lavender-deep',
  sage: 'bg-sage text-sage-deep',
  outline: 'border border-line text-muted bg-paper/60',
};

export default function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
      {children}
    </span>
  );
}
