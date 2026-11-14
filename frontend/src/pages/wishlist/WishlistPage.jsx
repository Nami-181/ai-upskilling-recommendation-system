import { Heart } from 'lucide-react';
import Button from '../../components/common/Button';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { ResourceCard } from '../../components/app/Widgets';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { roadmapService } from '../../services/learningService';

/** Screen 42: wishlist — resources saved from the roadmap. */
export default function WishlistPage() {
  const toast = useToast();
  const state = useAsync(() => roadmapService.get(), []);
  const unsave = async (item) => {
    try {
      await roadmapService.toggleSaved(item.id);
      await state.reload();
      toast.info('Removed from wishlist');
    } catch (err) {
      toast.error('Couldn’t update your wishlist', err.message);
    }
  };
  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Wishlist" title={<>Saved for <em>later.</em></>} description="Bookmark resources from your roadmap to find them quickly." />
      <AsyncBoundary state={state}>
        {(data) => {
          const saved = data.items.filter((i) => i.saved);
          return saved.length === 0 ? (
            <EmptyState icon={Heart} title="Nothing saved yet" description="Use the bookmark icon on any roadmap resource."
              action={<Button to="/app/roadmap" variant="secondary">Open roadmap</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {saved.map((i) => <ResourceCard key={i.id} item={i} onSave={unsave} />)}
            </div>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}
