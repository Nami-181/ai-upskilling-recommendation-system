import { Lock, Trophy } from 'lucide-react';
import Card from '../../components/common/Card';
import { AsyncBoundary, PageHeader } from '../../components/app/PageStates';
import { useAsync } from '../../hooks/useAsync';
import { activityService } from '../../services/learningService';
import { cn } from '../../utils/cn';

/** Screen 43: achievements, computed from real progress. */
export default function AchievementsPage() {
  const state = useAsync(() => activityService.achievements(), []);
  return (
    <div className="animate-fade-up space-y-8">
      <AsyncBoundary state={state}>
        {(badges) => (
          <>
            <PageHeader eyebrow="Achievements" title={<>{badges.filter((b) => b.earned).length} of {badges.length} <em>earned.</em></>}
              description="Badges unlock automatically from your roadmap, quizzes and study streaks." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {badges.map((b) => (
                <Card key={b.id} tint={b.earned ? 'pink' : 'paper'} className={cn('flex flex-col items-center text-center', !b.earned && 'opacity-60')}>
                  <span className={cn('flex h-14 w-14 items-center justify-center rounded-full', b.earned ? 'bg-paper text-plum' : 'bg-sand/60 text-muted')}>
                    {b.earned ? <Trophy className="h-6 w-6" strokeWidth={1.5} /> : <Lock className="h-5 w-5" strokeWidth={1.5} />}
                  </span>
                  <p className="mt-3 font-medium">{b.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{b.description}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
