import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, LogOut, X } from 'lucide-react';
import Logo from '../common/Logo';
import { SIDEBAR_SECTIONS } from '../../data/navigation';
import LogoutDialog from '../modals/LogoutDialog';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

/** Tooltip rendered into <body> so the scrollable nav can never clip it. */
function RailTooltip({ rect, label }) {
  if (!rect) return null;
  return createPortal(
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[60] -translate-y-1/2 animate-fade-in rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-cream shadow-soft"
      style={{ top: rect.top + rect.height / 2, left: rect.right + 12 }}
    >
      {label}
    </span>,
    document.body,
  );
}

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  const [tipRect, setTipRect] = useState(null);
  const showTip = (e) => collapsed && setTipRect(e.currentTarget.getBoundingClientRect());
  const hideTip = () => setTipRect(null);

  return (
    <NavLink
      to={item.path}
      onClick={(e) => {
        hideTip();
        onNavigate?.(e);
      }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl text-[14px] transition-all duration-300',
          collapsed ? 'h-10 w-10 justify-center' : 'h-10 px-3',
          isActive ? 'bg-blush/70 font-medium text-ink' : 'text-muted hover:bg-sand/45 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-plum" aria-hidden />
          )}
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 1.9 : 1.6} />
          {collapsed ? (
            <RailTooltip rect={tipRect} label={item.label} />
          ) : (
            <span className="truncate">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

/**
 * Sidebar content. Rendered twice by DashboardLayout:
 * once as the fixed desktop rail, once inside the mobile drawer.
 */
export default function Sidebar({ collapsed = false, onToggleCollapse, onClose, mobile = false }) {
  const { user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn('flex h-[72px] shrink-0 items-center', collapsed ? 'justify-center' : 'justify-between px-5')}>
        <Logo to="/app/dashboard" compact={collapsed} />
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition-colors hover:bg-sand/50 hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn('scroll-thin min-h-0 flex-1 overflow-y-auto pb-6', collapsed ? 'px-3' : 'px-4')}
        aria-label="Dashboard"
      >
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="mt-5 first:mt-2">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden />
            ) : (
              <p className="eyebrow mb-2 px-3 text-[10px]">{section.title}</p>
            )}
            <ul className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavItem item={item} collapsed={collapsed} onNavigate={mobile ? onClose : undefined} />
                </li>
              ))}
              {section.title === 'Account' && (
                <li>
                  <button
                    type="button"
                    onClick={() => setLogoutOpen(true)}
                    aria-label={collapsed ? 'Log out' : undefined}
                    title={collapsed ? 'Log out' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl text-[14px] text-muted transition-all duration-300 hover:bg-blush/45 hover:text-plum',
                      collapsed ? 'h-10 w-10 justify-center' : 'h-10 px-3',
                    )}
                  >
                    <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                    {!collapsed && 'Log out'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: student card + collapse toggle */}
      <div className={cn('flex shrink-0 items-center gap-2 border-t border-line py-4', collapsed ? 'flex-col px-3' : 'px-4')}>
        <NavLink
          to="/app/profile"
          onClick={mobile ? onClose : undefined}
          title={collapsed ? 'My profile' : undefined}
          className={cn(
            'flex min-w-0 items-center gap-3 rounded-xl transition-colors hover:bg-sand/45',
            collapsed ? 'p-0.5' : 'flex-1 p-2',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender font-display text-[15px] font-semibold text-lavender-deep">
            {initials}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="block truncate text-xs text-muted">
                {user?.targetRole ? `${user.targetRole} path` : 'Profile in progress'}
              </span>
            </span>
          )}
        </NavLink>
        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-sand/45 hover:text-ink"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.6} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.6} />}
          </button>
        )}
      </div>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
