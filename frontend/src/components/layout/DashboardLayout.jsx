import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import Topbar from '../navigation/Topbar';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { cn } from '../../utils/cn';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useLocalStorage('lumora:sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer whenever the route changes
  useEffect(() => setMobileOpen(false), [pathname]);

  // Escape closes the drawer; lock body scroll while open
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-paper/70 backdrop-blur-sm transition-[width] duration-300 ease-out lg:block',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="absolute inset-y-0 left-0 w-[284px] max-w-[85vw] animate-fade-in border-r border-line bg-paper shadow-lift">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]',
        )}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
