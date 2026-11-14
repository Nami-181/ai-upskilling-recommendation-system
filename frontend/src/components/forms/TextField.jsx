import { forwardRef, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

/** Shared input styling, also used by PasswordField, TextArea and Select. */
export const inputClasses = (error, hasIcon, hasRightSlot) =>
  cn(
    'peer w-full rounded-xl border bg-paper/80 text-[15px] text-ink transition-all duration-200',
    'placeholder:text-muted/70 focus:bg-white focus:outline-none',
    'disabled:cursor-not-allowed disabled:bg-linen/70 disabled:text-muted',
    error
      ? 'border-blush-deep/70 focus:border-blush-deep focus:ring-4 focus:ring-blush/60'
      : 'border-line hover:border-mauve/60 focus:border-mauve focus:ring-4 focus:ring-lavender/60',
    hasIcon ? 'pl-11' : 'pl-4',
    hasRightSlot ? 'pr-12' : 'pr-4',
  );

export function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 flex animate-fade-in items-start gap-1.5 text-[13px] text-blush-deep" role="alert">
        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-[13px] text-muted">
        {hint}
      </p>
    );
  }
  return null;
}

export function FieldLabel({ htmlFor, label, required, optional, action }) {
  if (!label) return null;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13.5px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-blush-deep" aria-hidden>*</span>}
        {optional && <span className="ml-1.5 text-xs font-normal text-muted">(optional)</span>}
      </label>
      {action}
    </div>
  );
}

const TextField = forwardRef(function TextField(
  { label, hint, error, icon: Icon, rightSlot, required, optional, labelAction, className, inputClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const messageId = `${inputId}-message`;

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} optional={optional} action={labelAction} />
      <div className="relative">
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 transition-colors',
              error ? 'text-blush-deep' : 'text-muted',
            )}
            strokeWidth={1.6}
            aria-hidden
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn('h-12', inputClasses(error, Icon, rightSlot), inputClassName)}
          {...props}
        />
        {rightSlot && <div className="absolute top-1/2 right-2 -translate-y-1/2">{rightSlot}</div>}
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
});

export default TextField;
