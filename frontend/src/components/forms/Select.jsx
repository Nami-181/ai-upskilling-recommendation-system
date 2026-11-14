import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldLabel, FieldMessage, inputClasses } from './TextField';
import { cn } from '../../utils/cn';

export default function Select({ label, hint, error, required, optional, options = [], placeholder, className, ...props }) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} required={required} optional={optional} />
      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn('h-12 appearance-none', inputClasses(error, false, true), !props.value && 'text-muted/80')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt} className="text-ink">
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
