import { ArrowLeft, ArrowRight } from 'lucide-react';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

/** Temporary full-page placeholder for screens outside the dashboard (onboarding, Phase 2). */
export default function PublicPlaceholder({ title, description, phase = 2 }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-blush/60 blur-[110px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-lavender/60 blur-[110px]" />
      </div>
      <header className="mx-auto flex h-[72px] w-full max-w-7xl items-center px-5 md:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="max-w-md animate-fade-up text-center">
          <Badge tone="pink">Arrives in Phase {phase}</Badge>
          <h1 className="mt-6 text-[48px] leading-[1.02] font-medium">{title}</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">{description}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/welcome" variant="secondary" leftIcon={ArrowLeft}>
              Back
            </Button>
            <Button to="/app/dashboard" rightIcon={ArrowRight}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
