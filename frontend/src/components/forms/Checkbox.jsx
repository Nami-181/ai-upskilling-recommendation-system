import { useId } from 'react';
import { Check } from 'lucide-react';
import { FieldMessage } from './TextField';
import { cn } from '../../utils/cn';

export default function Checkbox({ label, checked, onChange, onBlur, name, error, disabled, className }) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn('group inline-flex cursor-pointer items-start gap-3 select-none', disabled && 'cursor-not-allowed opacity-50')}
      >
        <span className="relative mt-0.5 flex">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={Boolean(checked)}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className="peer sr-only"
          />
          <span
            className={cn(
              'flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-all duration-200',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-lavender/70',
              checked
                ? 'border-ink bg-ink text-cream'
                : cn('bg-paper', error ? 'border-blush-deep' : 'border-mauve/70 group-hover:border-plum'),
            )}
            aria-hidden
          >
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </span>
        <span className="text-[14px] leading-snug text-ink/85">{label}</span>
      </label>
      <FieldMessage id={`${id}-message`} error={error} />
    </div>
  );
}
