import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Library, Search, SlidersHorizontal } from 'lucide-react';
import Button from '../../components/common/Button';
import Select from '../../components/forms/Select';
import TextField from '../../components/forms/TextField';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { ResourceCard } from '../../components/app/Widgets';
import { useAsync } from '../../hooks/useAsync';
import { catalogService } from '../../services/learningService';

const TYPES = [{ value: '', label: 'All types' }, ...['course', 'video', 'docs', 'article'].map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))];
const LEVELS = [{ value: '', label: 'All levels' }, { value: '1', label: 'Beginner' }, { value: '2', label: 'Intermediate' }, { value: '3', label: 'Advanced' }];
const SORTS = [{ value: 'rating', label: 'Top rated' }, { value: 'duration', label: 'Shortest first' }, { value: 'title', label: 'A–Z' }];
const SIZE = 12;

/** Screens 32–33: curated resource library with filters. */
export default function ResourcesPage() {
  const [filters, setFilters] = useState({ q: '', skill: '', type: '', level: '', free: '', sort: 'rating' });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const skills = useAsync(() => catalogService.skills(), []);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => { setFilters((f) => ({ ...f, q: query })); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const state = useAsync(() => {
    const params = { page, size: SIZE, sort: filters.sort };
    ['q', 'skill', 'type', 'level'].forEach((k) => filters[k] && (params[k] = filters[k]));
    if (filters.free) params.free = filters.free === 'free';
    return catalogService.resources(params);
  }, [filters, page]);

  const set = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };
  const skillOptions = [{ value: '', label: 'All skills' }, ...(skills.data ?? []).map((s) => ({ value: s.id, label: s.name }))];

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Resource library" title={<>Curated, <em>free-first</em> learning.</>}
        description="Courses, documentation, videos and articles from trusted providers, tagged by skill and level." />

      <div className="space-y-3">
        <div className="flex gap-2">
          <TextField icon={Search} className="flex-1" placeholder="Search by title or provider" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search resources" />
          <Button variant="secondary" className="h-12 md:hidden" leftIcon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>Filters</Button>
        </div>
        <div className={`${showFilters ? 'grid' : 'hidden'} gap-3 sm:grid-cols-2 md:grid md:grid-cols-5`}>
          <Select aria-label="Skill" value={filters.skill} options={skillOptions} onChange={set('skill')} />
          <Select aria-label="Type" value={filters.type} options={TYPES} onChange={set('type')} />
          <Select aria-label="Level" value={filters.level} options={LEVELS} onChange={set('level')} />
          <Select aria-label="Cost" value={filters.free} options={[{ value: '', label: 'Free & paid' }, { value: 'free', label: 'Free only' }, { value: 'paid', label: 'Paid only' }]} onChange={set('free')} />
          <Select aria-label="Sort" value={filters.sort} options={SORTS} onChange={set('sort')} />
        </div>
      </div>

      <AsyncBoundary state={state}>
        {(data) => data.items.length === 0 ? (
          <EmptyState icon={Library} title="No resources match" description="Try removing a filter or searching for something broader." />
        ) : (
          <>
            <p className="text-[13px] text-muted">{data.total} resources</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.items.map((r) => (
                <div key={r.id}>
                  <p className="mb-1.5 text-[12px] tracking-wide text-muted uppercase">{r.skill_name}</p>
                  <ResourceCard item={r} />
                </div>
              ))}
            </div>
            {data.total > SIZE && (
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="secondary" leftIcon={ChevronLeft} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-[13px] text-muted">Page {page} of {Math.ceil(data.total / SIZE)}</span>
                <Button size="sm" variant="secondary" rightIcon={ChevronRight} disabled={page * SIZE >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
