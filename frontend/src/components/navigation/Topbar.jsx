import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import ProfileMenu from './ProfileMenu';
import { findPageByPath } from '../../data/navigation';
import { useToast } from '../../context/ToastContext';

export default function Topbar({ onOpenMobileNav }) {
  const { pathname } = useLocation();
  const toast = useToast();
  const page = findPageByPath(pathname);
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Global search with suggestions arrives in Phase 3.
    toast.info('Search arrives in Phase 3', `Global search for “${query.trim()}” isn’t connected yet.`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/85 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-2 px-4 sm:gap-3 md:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="-ml-1 rounded-full p-2 text-ink transition-colors hover:bg-sand/50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {page?.section && <p className="eyebrow hidden text-[10px] sm:block">{page.section}</p>}
          <h1 className="truncate font-display text-[22px] leading-tight font-medium sm:text-[24px]">{page?.label ?? 'LUMORA'}</h1>
        </div>

        <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.6} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, courses, projects…"
            className="h-10 w-64 rounded-full border border-line bg-paper/80 pr-4 pl-10 text-sm transition-all duration-300 placeholder:text-muted/80 focus:w-80 focus:border-mauve focus:bg-white focus:outline-none lg:w-72"
            aria-label="Search"
          />
        </form>

        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
