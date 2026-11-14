import { Check } from 'lucide-react';
import { passwordChecks, passwordScore } from '../../utils/validation';
import { cn } from '../../utils/cn';

const LEVELS = [
  { label: '', bar: 'bg-sand' },
  { label: 'Weak', bar: 'bg-blush-deep/80', text: 'text-blush-deep' },
  { label: 'Fair', bar: 'bg-sand-deep/80', text: 'text-sand-deep' },
  { label: 'Good', bar: 'bg-lavender-deep/70', text: 'text-lavender-deep' },
  { label: 'Strong', bar: 'bg-sage-deep/80', text: 'text-sage-deep' },
];

/** Four-segment strength meter plus a live checklist of requirements. */
export default function PasswordStrength({ password, className }) {
  const score = passwordScore(password);
  const level = LEVELS[score];
  const checks = passwordChecks(password);

  return (
    <div className={cn('mt-3', className)} aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i <= score ? level.bar : 'bg-sand/70')}
            />
          ))}
        </div>
        <span className={cn('w-12 text-right text-xs font-medium', level.text)}>
          {password ? level.label : ''}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className={cn('flex items-center gap-2 text-[12.5px] transition-colors', check.met ? 'text-sage-deep' : 'text-muted')}
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border transition-all',
                check.met ? 'border-sage-deep/40 bg-sage' : 'border-line bg-paper',
              )}
            >
              {check.met && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
      <span className="sr-only">Password strength: {level.label || 'none'}</span>
    </div>
  );
}
