import { useLocation } from 'react-router-dom';
import { ArrowLeft, Hourglass } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { findPageByPath } from '../../data/navigation';

/** Shown for dashboard pages that will be built in a later phase. */
export default function ComingSoon() {
  const { pathname } = useLocation();
  const page = findPageByPath(pathname);
  const Icon = page?.icon ?? Hourglass;

  return (
    <div className="relative isolate flex min-h-[60vh] animate-fade-up flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-line bg-paper/50 px-6 py-20 text-center">
      <div aria-hidden className="absolute top-[-30%] left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-lavender/50 blur-[90px]" />
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-cream text-plum">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <Badge tone="lavender" className="mt-6">
        Arrives in Phase {page?.phase ?? '—'}
      </Badge>
      <h2 className="mt-5 text-[40px] leading-tight font-medium">{page?.label ?? 'Coming soon'}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        {page?.description ?? 'This page is part of an upcoming build phase.'}
      </p>
      <Button to="/app/dashboard" variant="secondary" leftIcon={ArrowLeft} className="mt-8">
        Back to dashboard
      </Button>
    </div>
  );
}
