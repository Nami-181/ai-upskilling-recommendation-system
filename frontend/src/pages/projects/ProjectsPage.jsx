import { useState } from 'react';
import { Clock, FolderKanban, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Select from '../../components/forms/Select';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { StatusBadge } from '../../components/app/Widgets';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { catalogService, DIFFICULTY, roadmapService, STATUS_LABELS } from '../../services/learningService';

/** Screens 34–35: project recommendations (from the roadmap) and all project ideas. */
export default function ProjectsPage() {
  const toast = useToast();
  const [level, setLevel] = useState('');
  const state = useAsync(() => Promise.all([roadmapService.get(), catalogService.projectIdeas()]), []);

  const setStatus = async (id, status) => {
    try {
      const data = await roadmapService.setItemStatus(id, status);
      state.setData(([, ideas]) => [data, ideas]);
      if (status === 'completed') toast.success('Project done', 'Add it to your profile so it counts as evidence.');
    } catch (err) {
      toast.error('Couldn’t update the project', err.message);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Project recommendations" title={<>Learn by <em>building.</em></>}
        description="One project per skill in your roadmap, matched to your level. Projects are the strongest evidence of a skill." />
      <AsyncBoundary state={state}>
        {([roadmap, ideas]) => {
          const recommended = roadmap.modules.filter((m) => m.project).map((m) => ({ ...m.project, skill_name: m.skill_name }));
          const pool = ideas.filter((p) => !level || String(p.level) === level);
          return (
            <>
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-[26px] font-medium"><Sparkles className="h-5 w-5 text-plum" />For your roadmap</h3>
                {recommended.length === 0 ? (
                  <EmptyState icon={FolderKanban} title="No project recommendations yet" description="Generate a roadmap to get projects matched to your gaps." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recommended.map((p) => (
                      <Card key={p.id} tint="white" className="flex flex-col">
                        <p className="text-[12px] tracking-wide text-muted uppercase">{p.skill_name}</p>
                        <h4 className="mt-1 text-[22px] leading-tight font-medium">{p.title}</h4>
                        <p className="mt-2 flex-1 text-[14px] text-muted">{p.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <Badge tone="lavender">{DIFFICULTY[p.level]}</Badge>
                          <Badge tone="outline" icon={Clock}>~{p.est_hours} h</Badge>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-3 text-[12.5px] text-muted">{p.reason}</p>
                        <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} aria-label={`Status of ${p.title}`}
                          className="mt-4 h-9 rounded-full border border-line bg-paper px-3 text-[13px]">
                          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <h3 className="text-[26px] font-medium">All project ideas</h3>
                  <Select aria-label="Filter by level" className="w-48" value={level} onChange={(e) => setLevel(e.target.value)}
                    options={[{ value: '', label: 'All levels' }, ...Object.entries(DIFFICULTY).map(([v, l]) => ({ value: v, label: l }))]} />
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {pool.map((p) => (
                    <Card key={p.id} padding="sm">
                      <p className="text-[12px] text-muted">{p.skill_name} · {DIFFICULTY[p.level]} · ~{p.est_hours} h</p>
                      <p className="mt-1 font-medium">{p.title}</p>
                      <p className="mt-1 text-[13px] text-muted">{p.description}</p>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}
