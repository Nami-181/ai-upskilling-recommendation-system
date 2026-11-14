import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Route, Radar, Sparkles } from 'lucide-react';
import Logo from '../common/Logo';
import PathIllustration from '../cards/PathIllustration';

const POINTS = [
  { icon: Radar, text: 'Find the skills that stand between you and your goal' },
  { icon: Route, text: 'Follow a roadmap sized to your week' },
  { icon: Sparkles, text: 'Recommendations that adapt as you grow' },
];

/**
 * Split-screen shell for every authentication screen.
 * Left: brand panel (hidden on small screens). Right: the form.
 */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <aside className="relative isolate hidden overflow-hidden bg-linen lg:flex lg:flex-col">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-blush/70 blur-[100px]" />
          <div className="absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full bg-lavender/70 blur-[100px]" />
        </div>

        <div className="flex items-center justify-between px-10 pt-8 xl:px-14">
          <Logo />
          <Link to="/" className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 xl:px-14">
          <p className="eyebrow">Learn with purpose</p>
          <h2 className="mt-4 max-w-md text-[46px] leading-[1.02] font-medium xl:text-[56px]">
            Grow with <em className="text-plum italic">direction.</em>
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink/65">
            LUMORA turns your courses, skills, projects and goals into a personal roadmap — and keeps it current as
            you learn.
          </p>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[14.5px] text-ink/80">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/80 text-plum">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <PathIllustration className="mt-6 block h-auto w-full" />
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen flex-col bg-cream">
        <div className="flex items-center justify-between px-5 pt-6 sm:px-10 lg:hidden">
          <Logo />
          <Link to="/" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-[440px]">
            <Outlet />
          </div>
        </div>
        <p className="px-5 pb-6 text-center text-[12px] text-muted sm:px-10">
          © {new Date().getFullYear()} LUMORA · <Link to="/faq" className="hover:text-ink">Help</Link> ·{' '}
          <Link to="/about#contact" className="hover:text-ink">Contact</Link>
        </p>
      </main>
    </div>
  );
}
