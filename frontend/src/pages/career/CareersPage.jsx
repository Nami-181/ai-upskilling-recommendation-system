import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import TextField from '../../components/forms/TextField';
import { AsyncBoundary, PageHeader } from '../../components/app/PageStates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { profileService } from '../../services/profileService';
import { roadmapService } from '../../services/learningService';
import { sessionUser } from '../../utils/session';

/** Screen 27: career explorer — readiness for every role, choose a target. */
export default function CareersPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const state = useAsync(() => roadmapService.careers(), []);

  const filtered = useMemo(
    () => (state.data ?? []).filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(query.toLowerCase())),
    [state.data, query],
  );

  const choose = async (role) => {
    setBusy(role.role_id);
    try {
      const profile = await profileService.updateProfile({ targetRoleId: role.role_id });
      updateUser(sessionUser(profile));
      await roadmapService.generate(role.role_id);
      toast.success(`Target set: ${role.title}`, 'Your new roadmap is ready.');
      navigate('/app/roadmap');
    } catch (err) {
      toast.error('Couldn’t change your career', err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Career explorer" title={<>Where could your skills <em>take you?</em></>}
        description="Readiness is how much of each role’s weighted skill requirements you already meet, based on your profile and quiz results." />
      <TextField icon={Search} placeholder="Search careers" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" aria-label="Search careers" />
      <AsyncBoundary state={state}>
        {() => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r, i) => {
              const current = user?.targetRoleId === r.role_id;
              return (
                <Card key={r.role_id} tint={current ? 'pink' : 'paper'} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[24px] leading-tight font-medium">{r.title}</h3>
                    {current ? <Badge tone="pink" icon={Check}>Your goal</Badge> : i === 0 && !query && <Badge tone="sage" icon={Sparkles}>Best match</Badge>}
                  </div>
                  <p className="mt-2 flex-1 text-[14px] text-muted">{r.description}</p>
                  <div className="mt-5 flex items-baseline justify-between">
                    <span className="text-[13px] text-muted">Readiness</span>
                    <span className="font-display text-[26px] font-medium">{r.readiness}%</span>
                  </div>
                  <ProgressBar value={r.readiness} className="mt-1" label={`${r.title} readiness`} />
                  <p className="mt-3 text-[13px] text-muted">
                    {r.missing ? <>Main gaps: <span className="text-ink">{r.top_gaps.join(', ')}</span></> : 'You meet every requirement.'}
                  </p>
                  {!current && (
                    <Button size="sm" variant="secondary" className="mt-5 self-start" loading={busy === r.role_id} disabled={busy !== null} onClick={() => choose(r)}>
                      Make this my goal
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
