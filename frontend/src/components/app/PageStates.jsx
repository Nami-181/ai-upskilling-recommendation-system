import { CircleAlert, Inbox, RotateCw } from 'lucide-react';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

/** Page title block used by every student-app page. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col justify-between gap-5 md:flex-row md:items-end', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 text-[38px] leading-[1.05] font-medium md:text-[46px] [&_em]:text-plum [&_em]:italic">
          {title}
        </h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-2xl bg-sand/50', className)} aria-hidden />;
}

export function LoadingBlock({ rows = 3 }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <Skeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-blush-deep/25 bg-blush/30 px-6 py-14 text-center" role="alert">
      <CircleAlert className="h-7 w-7 text-blush-deep" strokeWidth={1.5} />
      <p className="mt-4 text-lg font-medium">We couldn’t load this page</p>
      <p className="mt-1.5 max-w-md text-sm text-muted">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && error?.code !== 'MOCK_MODE' && (
        <Button size="sm" variant="secondary" leftIcon={RotateCw} className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-paper/50 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-cream text-plum">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-lg font-medium">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Renders loading / error states, otherwise children(data). */
export function AsyncBoundary({ state, children, rows }) {
  if (state.loading && !state.data) return <LoadingBlock rows={rows} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  return children(state.data);
}
