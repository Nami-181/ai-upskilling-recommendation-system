import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { mockNotifications } from '../../data/mockUser';
import { USE_MOCK_DATA } from '../../services/api';
import { activityService } from '../../services/learningService';
import { timeAgo } from '../../pages/notifications/NotificationsPage';
import { useDismiss } from '../../hooks/useDismiss';
import { cn } from '../../utils/cn';

/** Notification dropdown in the top bar. Loads roadmap updates from the API (sample data in mock mode). */
export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(USE_MOCK_DATA ? mockNotifications : []);

  // Refresh whenever the menu opens
  useEffect(() => {
    if (USE_MOCK_DATA || (!open && items.length)) return;
    activityService.notifications()
      .then((list) => setItems(list.slice(0, 8).map((n) => ({ ...n, time: timeAgo(n.time) }))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const markAll = () => {
    setItems((list) => list.map((n) => ({ ...n, unread: false })));
    if (!USE_MOCK_DATA) activityService.markAllRead().catch(() => {});
  };
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-sand/50 hover:text-ink',
          open ? 'bg-sand/60 text-ink' : 'text-muted',
        )}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
        {unread > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blush-deep ring-2 ring-cream" />}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(360px,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-medium">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-blush px-1.5 py-0.5 text-[11px] text-plum">{unread}</span>}
            </p>
            <button
              type="button"
              disabled={unread === 0}
              onClick={markAll}
              className="text-xs text-plum hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          {items.length ? (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                    className={cn('flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-linen/70', n.unread && 'bg-blush/20')}
                  >
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.unread ? 'bg-blush-deep' : 'bg-transparent')} aria-hidden />
                    <span>
                      <span className="block text-[13px] font-medium">{n.title}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted/80">{n.time}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <BellOff className="h-6 w-6 text-mauve" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium">You’re all caught up</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <span className="text-[11px] text-muted">{USE_MOCK_DATA ? 'Sample notifications' : 'Roadmap updates'}</span>
            <Link to="/app/notifications" onClick={close} className="text-xs font-medium text-plum hover:underline">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
