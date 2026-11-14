import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../common/Button';
import { PUBLIC_NAV } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { useScrolled } from '../../hooks/useScrolled';
import { cn } from '../../utils/cn';

/** Active when the path matches; "Contact" (/about#contact) only when the hash matches too. */
function useIsActive() {
  const { pathname, hash } = useLocation();
  return (to) => {
    const [path, targetHash] = to.split('#');
    if (targetHash) return pathname === path && hash === `#${targetHash}`;
    return pathname === path && !(path === '/about' && hash === '#contact');
  };
}

export default function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const isActive = useIsActive();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  // Close the menu on navigation; lock scroll while it is open
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled || open ? 'border-b border-line/80 bg-cream/85 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-0.5 lg:flex">
          {PUBLIC_NAV.map((link) => {
            const active = isActive(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-[14px] transition-colors duration-300',
                    active ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute right-3.5 -bottom-0.5 left-3.5 h-px origin-left bg-plum transition-transform duration-300',
                      active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <Button to="/app/dashboard" size="sm" rightIcon={ArrowRight}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-sand/50">
                Login
              </Link>
              <Button to="/signup" size="sm" rightIcon={ArrowRight}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 rounded-full p-2 text-ink transition-colors hover:bg-sand/50 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="flex h-[calc(100dvh-72px)] animate-fade-in flex-col overflow-y-auto border-t border-line/70 lg:hidden">
          <ul className="flex flex-col px-5 pt-2">
            {PUBLIC_NAV.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between border-b border-line/70 py-4 font-display text-[28px]',
                    isActive(link.to) ? 'text-plum italic' : 'text-ink',
                  )}
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-muted" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 px-5 py-8">
            {isAuthenticated ? (
              <Button to="/app/dashboard" size="lg" rightIcon={ArrowRight}>Go to dashboard</Button>
            ) : (
              <>
                <Button to="/signup" size="lg" rightIcon={ArrowRight}>Get Started</Button>
                <Button to="/login" size="lg" variant="secondary">Login</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
