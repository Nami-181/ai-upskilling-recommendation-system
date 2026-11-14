import { useState } from 'react';
import { Award, ExternalLink, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Select from '../../components/forms/Select';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { catalogService, roadmapService } from '../../services/learningService';

const CERT_LEVEL = { 1: 'Foundational', 2: 'Associate', 3: 'Professional' };

function CertCard({ c, highlight }) {
  return (
    <Card tint={highlight ? 'pink' : 'white'} className="flex flex-col">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="lavender">{CERT_LEVEL[c.level]}</Badge>
        {c.is_free ? <Badge tone="sage">Free</Badge> : <Badge tone="outline">{c.cost}</Badge>}
      </div>
      <a href={c.url} target="_blank" rel="noopener noreferrer" className="group mt-3 inline-flex items-start gap-1.5 text-[19px] leading-snug font-medium hover:text-plum">
        {c.title}<ExternalLink className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted group-hover:text-plum" />
      </a>
      <p className="mt-1 text-[13px] text-muted">{c.provider}</p>
      {c.reason && <p className="mt-3 text-[13px] leading-snug text-muted">{c.reason}</p>}
    </Card>
  );
}

/** Screens 36–37: certification finder. */
export default function CertificationsPage() {
  const { user } = useAuth();
  const [role, setRole] = useState(user?.targetRoleId ?? '');
  const recs = useAsync(() => roadmapService.get(), []);
  const all = useAsync(() => Promise.all([catalogService.certifications(role ? { role } : {}), catalogService.roles()]), [role]);

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Certifications" title={<>Credentials that <em>count.</em></>}
        description="Recommended by your readiness: free and foundational certificates first, professional ones once your main gaps are closed." />
      <AsyncBoundary state={recs}>
        {(data) => (
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-[26px] font-medium"><Sparkles className="h-5 w-5 text-plum" />Recommended for you</h3>
            {data.certifications.length ? (
              <div className="grid gap-4 md:grid-cols-3">{data.certifications.map((c) => <CertCard key={c.id} c={c} highlight />)}</div>
            ) : (
              <EmptyState icon={Award} title="No recommendations yet" description="Generate a roadmap to see certifications matched to your readiness." />
            )}
          </section>
        )}
      </AsyncBoundary>
      <AsyncBoundary state={all}>
        {([certs, roles]) => (
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-[26px] font-medium">Browse by career</h3>
              <Select aria-label="Career" className="w-64" value={role} onChange={(e) => setRole(e.target.value)}
                options={[{ value: '', label: 'All careers' }, ...roles.map((r) => ({ value: r.id, label: r.title }))]} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{certs.map((c) => <CertCard key={c.id} c={c} />)}</div>
          </section>
        )}
      </AsyncBoundary>
    </div>
  );
}
