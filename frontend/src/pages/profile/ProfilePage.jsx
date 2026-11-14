import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FolderGit2, GraduationCap, Pencil, Save, Target, X } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressRing from '../../components/common/ProgressRing';
import FormAlert from '../../components/forms/FormAlert';
import { AsyncBoundary, PageHeader } from '../../components/app/PageStates';
import { LevelDots } from '../../components/app/Widgets';
import {
  AboutSection, CareerSection, CoursesSection, PreferencesSection, ProjectsSection, SkillsSection,
  draftFromProfile, payloadFromDraft, validateDraft, RESOURCE_TYPES,
} from '../../components/profile/ProfileSections';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { profileService } from '../../services/profileService';
import { catalogService, LEVEL_LABELS } from '../../services/learningService';
import { sessionUser } from '../../utils/session';

/** Screens 25–26: student profile and edit profile (/app/profile, /app/profile/edit). */
export default function ProfilePage() {
  const { pathname } = useLocation();
  const editing = pathname.endsWith('/edit');
  const state = useAsync(() => Promise.all([profileService.getProfile(), catalogService.roles(), catalogService.taxonomy()]), [editing]);

  return (
    <div className="animate-fade-up space-y-8">
      <AsyncBoundary state={state}>
        {([profile, roles, taxonomy]) =>
          editing ? (
            <EditProfile profile={profile} roles={roles} taxonomy={taxonomy} />
          ) : (
            <ViewProfile profile={profile} />
          )
        }
      </AsyncBoundary>
    </div>
  );
}

function ViewProfile({ profile: p }) {
  const byCategory = p.skills.reduce((acc, s) => ({ ...acc, [s.category]: [...(acc[s.category] ?? []), s] }), {});
  return (
    <>
      <PageHeader
        eyebrow="My profile"
        title={<>{p.firstName} <em>{p.lastName}</em></>}
        description={[p.program, p.institution, p.year && `Year ${p.year}`].filter(Boolean).join(' · ') || p.email}
        actions={<Button to="/app/profile/edit" leftIcon={Pencil}>Edit profile</Button>}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card className="flex items-center gap-5">
          <ProgressRing value={p.profileCompletion} size={84}>
            <span className="font-display text-[22px] font-medium">{p.profileCompletion}%</span>
          </ProgressRing>
          <div>
            <p className="font-medium">Profile completion</p>
            <p className="mt-1 text-[13px] text-muted">
              {p.profileCompletion < 100 ? 'A fuller profile gives sharper recommendations.' : 'Everything is filled in.'}
            </p>
          </div>
        </Card>
        <Card className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] text-muted"><Target className="h-4 w-4" />Target career</p>
            <p className="mt-1 font-medium">{p.targetRole ?? 'Not chosen yet'}</p>
          </div>
          <div>
            <p className="text-[13px] text-muted">Study time</p>
            <p className="mt-1 font-medium">{p.weeklyHoursGoal} h / week</p>
          </div>
          <div>
            <p className="text-[13px] text-muted">Prefers</p>
            <p className="mt-1 font-medium">{RESOURCE_TYPES.find((t) => t.value === p.preferredResourceType)?.label}</p>
          </div>
          {p.bio && <p className="text-[14px] leading-relaxed text-muted sm:col-span-3">{p.bio}</p>}
          {p.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:col-span-3">
              {p.interests.map((i) => <Badge key={i} tone="pink">{i}</Badge>)}
            </div>
          )}
        </Card>
      </div>

      <Card padding="lg">
        <h3 className="text-[26px] font-medium">Skills</h3>
        {p.skills.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No skills yet. <a className="text-plum underline" href="/app/profile/edit">Add some</a> to get a skill-gap analysis.</p>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {Object.entries(byCategory).map(([cat, skills]) => (
              <div key={cat}>
                <p className="eyebrow mb-2">{cat}</p>
                <ul className="divide-y divide-line">
                  {skills.map((s) => (
                    <li key={s.skillId} className="flex items-center justify-between py-2 text-[14px]">
                      <span>{s.name} <span className="ml-1 text-[11px] text-muted">({s.source})</span></span>
                      <span className="flex items-center gap-2 text-[12px] text-muted">
                        {LEVEL_LABELS[s.level]} <LevelDots value={s.level} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="flex items-center gap-2 text-[24px] font-medium"><GraduationCap className="h-5 w-5 text-plum" />Courses</h3>
          {p.courses.length ? (
            <ul className="mt-4 space-y-2 text-[14px]">
              {p.courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <span><BookOpen className="mr-2 inline h-4 w-4 text-muted" />{c.title}{c.provider && <span className="text-muted"> · {c.provider}</span>}</span>
                  <Badge tone={c.status === 'completed' ? 'sage' : 'lavender'}>{c.status === 'completed' ? 'Done' : 'In progress'}</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">No courses added.</p>}
        </Card>
        <Card padding="lg">
          <h3 className="flex items-center gap-2 text-[24px] font-medium"><FolderGit2 className="h-5 w-5 text-plum" />Projects</h3>
          {p.projects.length ? (
            <ul className="mt-4 space-y-3 text-[14px]">
              {p.projects.map((pr) => (
                <li key={pr.id} className="border-b border-line pb-3">
                  <p className="font-medium">{pr.url ? <a href={pr.url} target="_blank" rel="noopener noreferrer" className="hover:text-plum hover:underline">{pr.title}</a> : pr.title}</p>
                  {pr.description && <p className="mt-0.5 text-muted">{pr.description}</p>}
                  {pr.techStack && <p className="mt-1 text-[12px] text-muted">{pr.techStack}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">No projects added.</p>}
        </Card>
      </div>
    </>
  );
}

const SECTIONS = [
  ['about', 'About you'], ['skills', 'Skills'], ['courses', 'Courses'], ['projects', 'Projects'],
  ['career', 'Career & interests'], ['preferences', 'Learning preferences'],
];

function EditProfile({ profile, roles, taxonomy }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateUser } = useAuth();
  const [draft, setDraft] = useState(() => draftFromProfile(profile));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const patch = (c) => { setDraft((d) => ({ ...d, ...c })); setDirty(true); };

  // Unsaved-changes warning when closing or reloading the tab
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    const e = validateDraft(draft);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(e.targetRoleId ? 'career' : e.firstName || e.year ? 'about' : 'projects')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile(payloadFromDraft(draft));
      updateUser(sessionUser(updated));
      setDirty(false);
      toast.success('Profile saved', profile.targetRoleId !== updated.targetRoleId
        ? 'Your target career changed — regenerate your roadmap to match.' : 'Your recommendations will use these details.');
      navigate('/app/profile');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return;
    navigate('/app/profile');
  };

  const props = { draft, patch, errors, roles, taxonomy };
  return (
    <>
      <PageHeader eyebrow="Edit profile" title={<>Keep your profile <em>current.</em></>}
        description="Changes to your skills or career goal feed straight into your skill-gap analysis." />
      {error && <FormAlert title="We couldn’t save your profile" onDismiss={() => setError(null)}>{error.message}</FormAlert>}
      {SECTIONS.map(([id, title]) => (
        <Card key={id} id={id} padding="lg" className="scroll-mt-24">
          <h3 className="mb-5 text-[26px] font-medium">{title}</h3>
          {id === 'about' && <AboutSection {...props} />}
          {id === 'skills' && <SkillsSection {...props} />}
          {id === 'courses' && <CoursesSection {...props} />}
          {id === 'projects' && <ProjectsSection {...props} />}
          {id === 'career' && <CareerSection {...props} />}
          {id === 'preferences' && <PreferencesSection {...props} />}
        </Card>
      ))}
      <div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-2xl border border-line bg-paper/90 p-3 shadow-soft backdrop-blur">
        {dirty && <span className="mr-auto self-center pl-2 text-[13px] text-muted">Unsaved changes</span>}
        <Button variant="secondary" leftIcon={X} onClick={cancel}>Cancel</Button>
        <Button leftIcon={Save} loading={saving} onClick={save}>Save profile</Button>
      </div>
    </>
  );
}
