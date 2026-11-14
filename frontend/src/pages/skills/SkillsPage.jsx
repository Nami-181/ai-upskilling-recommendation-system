import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowRight, Compass, Info, Pencil, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressRing from '../../components/common/ProgressRing';
import { AsyncBoundary, EmptyState, PageHeader } from '../../components/app/PageStates';
import { LevelDots, SeverityBadge, StatCard } from '../../components/app/Widgets';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { roadmapService } from '../../services/learningService';

/** Screen 28: skill-gap analyzer with visualisations. */
export default function SkillsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const state = useAsync(() => roadmapService.analyze(), []);

  const regenerate = async () => {
    setBusy(true);
    try {
      await roadmapService.generate();
      toast.success('Roadmap rebuilt', 'It now targets your current gaps.');
      navigate('/app/roadmap');
    } catch (err) {
      toast.error('Couldn’t build the roadmap', err.message);
    } finally {
      setBusy(false);
    }
  };

  if (state.error?.code === 'NO_TARGET_ROLE') {
    return (
      <EmptyState icon={Compass} title="Choose a target career first"
        description="The skill-gap analysis compares your skills with what a role needs."
        action={<Button to="/app/careers" rightIcon={ArrowRight}>Explore careers</Button>} />
    );
  }

  return (
    <div className="animate-fade-up space-y-8">
      <AsyncBoundary state={state} rows={3}>
        {(r) => {
          const gaps = r.skills.filter((s) => s.gap > 0);
          const chart = r.skills.map((s) => ({ skill: s.name, You: s.current, Required: s.required }));
          return (
            <>
              <PageHeader eyebrow="Skill gap analyzer" title={<>You vs. <em>{r.target_role}</em></>}
                description="Each required skill has a weight (1–3) and a target level (1–5). Gaps are ranked by importance: weight, how far you are from the target, and how many other skills depend on it."
                actions={<>
                  <Button variant="secondary" leftIcon={Pencil} to="/app/profile/edit">Update skills</Button>
                  <Button leftIcon={Sparkles} loading={busy} onClick={regenerate}>Rebuild roadmap</Button>
                </>} />

              <div className="grid gap-4 md:grid-cols-[auto_1fr_1fr]">
                <Card tint="pink" className="flex items-center gap-5">
                  <ProgressRing value={r.readiness} size={96} color="var(--color-plum)">
                    <span className="font-display text-[26px] font-medium">{r.readiness}%</span>
                  </ProgressRing>
                  <div><p className="font-medium">Role readiness</p><p className="text-[13px] text-muted">weighted share of requirements met</p></div>
                </Card>
                <StatCard label="Skills to build" value={r.missing} hint={`of ${r.skills.length} required`} tint="lavender" />
                <StatCard label="Already strong" value={r.strengths.length} hint={r.skills.filter((s) => s.gap === 0 && s.current > 0).map((s) => s.name).join(', ') || 'none yet'} tint="sage" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card padding="lg">
                  <h3 className="text-[24px] font-medium">Skill profile</h3>
                  <div className="mt-2 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={chart} outerRadius="72%">
                        <PolarGrid stroke="var(--color-line)" />
                        <PolarAngleAxis dataKey="skill" fontSize={11} />
                        <PolarRadiusAxis domain={[0, 5]} tickCount={6} fontSize={10} />
                        <Radar name="Required" dataKey="Required" stroke="var(--color-mauve)" fill="var(--color-blush)" fillOpacity={0.5} />
                        <Radar name="You" dataKey="You" stroke="var(--color-plum)" fill="var(--color-lavender-deep)" fillOpacity={0.35} />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card padding="lg">
                  <h3 className="text-[24px] font-medium">Have vs. need</h3>
                  <div className="mt-2 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid horizontal={false} stroke="var(--color-line)" />
                        <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={11} />
                        <YAxis type="category" dataKey="skill" width={110} fontSize={11} />
                        <Tooltip cursor={{ fill: 'var(--color-linen)' }} />
                        <Legend />
                        <Bar dataKey="You" fill="var(--color-plum)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Required" fill="var(--color-blush)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card padding="lg">
                <h3 className="text-[24px] font-medium">Gaps ranked by importance</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><Info className="h-3.5 w-3.5" />Gap = weight × levels missing. High ≥ 6, Medium ≥ 3.</p>
                {gaps.length === 0 ? (
                  <p className="mt-4 text-sm">You meet every requirement for this role. 🎉</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-[14px]">
                      <thead className="text-[12px] tracking-wide text-muted uppercase">
                        <tr className="border-b border-line">
                          <th className="py-2 pr-3">#</th><th className="py-2 pr-3">Skill</th><th className="py-2 pr-3">You → needed</th>
                          <th className="py-2 pr-3">Weight</th><th className="py-2 pr-3">Gap</th><th className="py-2">Unlocks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gaps.map((s) => (
                          <tr key={s.skill_id} className="border-b border-line/70">
                            <td className="py-3 pr-3 text-muted">{s.rank}</td>
                            <td className="py-3 pr-3"><span className="font-medium">{s.name}</span><span className="block text-[12px] text-muted">{s.category}</span></td>
                            <td className="py-3 pr-3"><LevelDots value={s.current} required={s.required} /> <span className="ml-1 text-[12px] text-muted">{s.current} → {s.required}</span></td>
                            <td className="py-3 pr-3">{'●'.repeat(s.weight)}<span className="text-sand">{'●'.repeat(3 - s.weight)}</span></td>
                            <td className="py-3 pr-3"><SeverityBadge severity={s.severity} /></td>
                            <td className="py-3 text-[13px] text-muted">{s.unlocks ? `${s.unlocks} skill${s.unlocks > 1 ? 's' : ''}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}
