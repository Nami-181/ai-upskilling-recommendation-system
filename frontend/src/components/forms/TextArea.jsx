import { useId } from 'react';
import { FieldLabel, FieldMessage, inputClasses } from './TextField';
import { cn } from '../../utils/cn';

export default function TextArea({ label, hint, error, required, optional, maxLength, value = '', className, rows = 5, ...props }) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={className}>
      <FieldLabel
        htmlFor={id}
        label={label}
        required={required}
        optional={optional}
        action={maxLength ? <span className="text-xs text-muted tabular-nums">{value.length}/{maxLength}</span> : null}
      />
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn('resize-y py-3 leading-relaxed', inputClasses(error, false, false))}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
