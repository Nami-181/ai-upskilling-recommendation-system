import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Settings, LifeBuoy, LogOut, Trophy } from 'lucide-react';
import LogoutDialog from '../modals/LogoutDialog';
import { useAuth } from '../../context/AuthContext';
import { useDismiss } from '../../hooks/useDismiss';
import { cn } from '../../utils/cn';

const LINKS = [
  { to: '/app/profile', label: 'My profile', icon: UserRound },
  { to: '/app/achievements', label: 'Achievements', icon: Trophy },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/support', label: 'Help & support', icon: LifeBuoy },
];

/** Avatar dropdown in the top bar. */
export default function ProfileMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full bg-lavender font-display text-[15px] font-semibold text-lavender-deep transition-all hover:ring-4 hover:ring-lavender/50',
          open && 'ring-4 ring-lavender/60',
        )}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initials}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 animate-scale-in overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
          <div className="border-b border-line px-4 py-4">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <ul className="p-1.5">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  role="menuitem"
                  to={to}
                  onClick={close}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-ink/85 transition-colors hover:bg-linen hover:text-ink"
                >
                  <Icon className="h-4 w-4 text-muted" strokeWidth={1.6} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-1.5">
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                close();
                setLogoutOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-ink/85 transition-colors hover:bg-blush/45 hover:text-plum"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.6} />
              Log out
            </button>
          </div>
        </div>
      )}
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
