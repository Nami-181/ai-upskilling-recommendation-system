import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const TONES = {
  error: { icon: CircleAlert, box: 'border-blush-deep/30 bg-blush/45', icon_c: 'text-blush-deep' },
  success: { icon: CircleCheck, box: 'border-sage-deep/25 bg-sage/60', icon_c: 'text-sage-deep' },
  info: { icon: Info, box: 'border-lavender-deep/25 bg-lavender/50', icon_c: 'text-lavender-deep' },
};

/** Inline banner for form-level messages (invalid credentials, server errors, success). */
export default function FormAlert({ tone = 'error', title, children, onDismiss, className }) {
  const { icon: Icon, box, icon_c } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', tone === 'error' ? 'animate-shake' : 'animate-fade-in', box, className)}
    >
      <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', icon_c)} strokeWidth={1.75} />
      <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cn('text-ink/75', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="-m-1 rounded-full p-1 text-muted hover:text-ink" aria-label="Dismiss">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
