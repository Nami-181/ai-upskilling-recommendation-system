import { BellOff, CheckCheck } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { activityService } from '../../services/learningService';

const ACTION_TONE = { generated: 'lavender', completed: 'sage', remediated: 'pink', replaced: 'neutral', removed: 'neutral', nudge: 'pink' };

export function timeAgo(iso) {
  if (!iso) return 'now';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Screen 44: notifications — every change the engine made to your roadmap, with the reason. */
export default function NotificationsPage() {
  const toast = useToast();
  const state = useAsync(() => activityService.notifications(), []);
  const markAll = async () => {
    try {
      await activityService.markAllRead();
      state.setData((list) => list.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      toast.error('Couldn’t update notifications', err.message);
    }
  };
  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Notifications" title={<>What changed, and <em>why.</em></>}
        description="Your roadmap adapts to quizzes, feedback and activity. Every change is listed here with its reason."
        actions={<Button variant="secondary" leftIcon={CheckCheck} onClick={markAll}>Mark all as read</Button>} />
      <AsyncBoundary state={state}>
        {(items) => items.length === 0 ? (
          <EmptyState icon={BellOff} title="You’re all caught up" description="Updates appear when your roadmap is generated or adapts." />
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-line">
              {items.map((n) => (
                <li key={n.id} className={`flex gap-4 px-5 py-4 ${n.unread ? 'bg-blush/20' : ''}`}>
                  <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.unread ? 'bg-blush-deep' : 'bg-transparent'}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      <Badge tone={ACTION_TONE[n.action] ?? 'neutral'}>{n.action}</Badge>
                    </div>
                    <p className="mt-0.5 text-[14px] text-muted">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-muted">{timeAgo(n.time)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AsyncBoundary>
    </div>
  );
}
