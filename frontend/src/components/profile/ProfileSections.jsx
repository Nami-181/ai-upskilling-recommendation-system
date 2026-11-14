import { Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import TextField from '../forms/TextField';
import TextArea from '../forms/TextArea';
import Select from '../forms/Select';
import { LevelPicker } from '../app/Widgets';
import { LEVEL_LABELS } from '../../services/learningService';
import { cn } from '../../utils/cn';

/**
 * Editable sections of the student profile. Each takes the whole `draft`
 * and a `patch(changes)` callback, so onboarding (one section per step) and
 * the edit-profile page (all sections) share the same UI.
 */

export const INTERESTS = ['AI & ML', 'Data', 'Web development', 'Mobile apps', 'Cloud & DevOps', 'Cybersecurity',
  'Design', 'Open source', 'Competitive programming', 'Startups'];

export const RESOURCE_TYPES = [
  { value: 'any', label: 'No preference' },
  { value: 'course', label: 'Structured courses' },
  { value: 'video', label: 'Videos' },
  { value: 'docs', label: 'Documentation' },
  { value: 'article', label: 'Articles & tutorials' },
];

export function draftFromProfile(p = {}) {
  return {
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    program: p.program ?? '',
    institution: p.institution ?? '',
    year: p.year ?? '',
    bio: p.bio ?? '',
    targetRoleId: p.targetRoleId ?? '',
    interests: p.interests ?? [],
    weeklyHoursGoal: p.weeklyHoursGoal ?? 8,
    preferredResourceType: p.preferredResourceType ?? 'any',
    skills: Object.fromEntries((p.skills ?? []).filter((s) => s.source === 'self').map((s) => [s.skillId, s.level])),
    evidence: Object.fromEntries((p.skills ?? []).filter((s) => s.source !== 'self').map((s) => [s.skillId, s])),
    courses: (p.courses ?? []).map(({ title, provider, status }) => ({ title, provider, status })),
    projects: (p.projects ?? []).map(({ title, description, techStack, url }) => ({ title, description, tech_stack: techStack ?? '', url })),
  };
}

export function payloadFromDraft(d) {
  return {
    firstName: d.firstName.trim(),
    lastName: d.lastName.trim(),
    program: d.program.trim(),
    institution: d.institution.trim(),
    year: d.year ? Number(d.year) : null,
    bio: d.bio.trim(),
    targetRoleId: d.targetRoleId || null,
    interests: d.interests,
    weeklyHoursGoal: Number(d.weeklyHoursGoal) || 8,
    preferredResourceType: d.preferredResourceType,
    skills: Object.entries(d.skills).filter(([, l]) => l > 0).map(([skill_id, level]) => ({ skill_id, level })),
    courses: d.courses.filter((c) => c.title.trim().length >= 2),
    projects: d.projects.filter((p) => p.title.trim().length >= 2),
  };
}

export function validateDraft(d, section) {
  const e = {};
  if ((!section || section === 'about') && !d.firstName.trim()) e.firstName = 'Please enter your first name.';
  if ((!section || section === 'about') && d.year && (d.year < 1 || d.year > 6)) e.year = 'Year must be 1 to 6.';
  if ((!section || section === 'career') && !d.targetRoleId) e.targetRoleId = 'Choose the career you are aiming for.';
  if ((!section || section === 'preferences') && !(d.weeklyHoursGoal >= 1 && d.weeklyHoursGoal <= 60))
    e.weeklyHoursGoal = 'Choose between 1 and 60 hours a week.';
  if (!section || section === 'projects') {
    d.projects.forEach((p, i) => {
      if (p.url && !/^https?:\/\/\S+\.\S+/.test(p.url)) e[`project-${i}`] = 'Links must start with http:// or https://';
    });
  }
  return e;
}

export function AboutSection({ draft, patch, errors = {} }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField label="First name" required value={draft.firstName} error={errors.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
      <TextField label="Last name" optional value={draft.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
      <TextField label="Degree / program" placeholder="B.Tech, Computer Science" value={draft.program} onChange={(e) => patch({ program: e.target.value })} />
      <TextField label="College / university" value={draft.institution} onChange={(e) => patch({ institution: e.target.value })} />
      <Select
        label="Year of study"
        value={String(draft.year ?? '')}
        error={errors.year}
        placeholder="Select year"
        options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))}
        onChange={(e) => patch({ year: Number(e.target.value) })}
      />
      <TextArea className="sm:col-span-2" label="About you" optional maxLength={500} rows={3} value={draft.bio} onChange={(e) => patch({ bio: e.target.value })} placeholder="What are you working towards?" />
    </div>
  );
}

export function SkillsSection({ draft, patch, taxonomy }) {
  const setLevel = (id, level) => patch({ skills: { ...draft.skills, [id]: level } });
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Rate yourself from 0 to 5: {LEVEL_LABELS.map((l, i) => `${i} ${l}`).join(' · ')}. Skills found in your courses and
        projects are added automatically, and quizzes update them later.
      </p>
      {Object.entries(taxonomy ?? {}).map(([category, skills]) => (
        <div key={category}>
          <p className="eyebrow mb-3">{category}</p>
          <div className="grid gap-2.5 md:grid-cols-2">
            {skills.map((s) => {
              const ev = draft.evidence?.[s.skill_id];
              return (
                <div key={s.skill_id} className={cn('flex items-center justify-between gap-3 rounded-xl border px-3 py-2', draft.skills[s.skill_id] ? 'border-mauve/50 bg-blush/25' : 'border-line bg-paper/70')}>
                  <span className="min-w-0 text-[14px]">
                    {s.name}
                    {ev && <span className="block text-[11px] text-muted">level {ev.level} from {ev.source}</span>}
                  </span>
                  <LevelPicker label={s.name} value={draft.skills[s.skill_id] ?? 0} onChange={(l) => setLevel(s.skill_id, l)} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListEditor({ items, onChange, empty, render, addLabel, blank }) {
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted">{empty}</p>}
      {items.map((item, i) => (
        <Card key={i} tint="white" padding="sm" className="relative pr-12">
          {render(item, (changes) => onChange(items.map((x, j) => (j === i ? { ...x, ...changes } : x))), i)}
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="absolute top-3 right-3 rounded-full p-2 text-muted hover:bg-blush/50 hover:text-blush-deep" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </Card>
      ))}
      <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => onChange([...items, blank])}>
        {addLabel}
      </Button>
    </div>
  );
}

export function CoursesSection({ draft, patch }) {
  return (
    <ListEditor
      items={draft.courses}
      onChange={(courses) => patch({ courses })}
      empty="No courses yet. Add college subjects or online courses you have taken."
      addLabel="Add a course"
      blank={{ title: '', provider: '', status: 'completed' }}
      render={(c, set) => (
        <div className="grid gap-3 sm:grid-cols-[2fr_1.2fr_1fr]">
          <TextField label="Course" value={c.title} onChange={(e) => set({ title: e.target.value })} placeholder="Database Management Systems" />
          <TextField label="Provider" optional value={c.provider} onChange={(e) => set({ provider: e.target.value })} placeholder="College / Coursera" />
          <Select label="Status" value={c.status} options={[{ value: 'completed', label: 'Completed' }, { value: 'in_progress', label: 'In progress' }]} onChange={(e) => set({ status: e.target.value })} />
        </div>
      )}
    />
  );
}

export function ProjectsSection({ draft, patch, errors = {} }) {
  return (
    <ListEditor
      items={draft.projects}
      onChange={(projects) => patch({ projects })}
      empty="No projects yet. Mini-projects, hackathons and assignments all count."
      addLabel="Add a project"
      blank={{ title: '', description: '', tech_stack: '', url: '' }}
      render={(p, set, i) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Project title" value={p.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField label="Technologies" optional value={p.tech_stack} onChange={(e) => set({ tech_stack: e.target.value })} placeholder="Python, Flask, SQLite" />
          <TextArea className="sm:col-span-2" label="What did you build?" optional rows={2} maxLength={600} value={p.description} onChange={(e) => set({ description: e.target.value })} />
          <TextField className="sm:col-span-2" label="Link" optional value={p.url} error={errors[`project-${i}`]} onChange={(e) => set({ url: e.target.value })} placeholder="https://github.com/…" />
        </div>
      )}
    />
  );
}

export function CareerSection({ draft, patch, roles = [], errors = {} }) {
  const toggle = (tag) =>
    patch({ interests: draft.interests.includes(tag) ? draft.interests.filter((t) => t !== tag) : [...draft.interests, tag] });
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[13.5px] font-medium">Target career <span className="text-blush-deep">*</span></p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Target career">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={draft.targetRoleId === r.id}
              onClick={() => patch({ targetRoleId: r.id })}
              className={cn('rounded-2xl border p-4 text-left transition-all', draft.targetRoleId === r.id ? 'border-plum bg-blush/50 shadow-soft' : 'border-line bg-paper hover:border-mauve/60')}
            >
              <span className="block text-[15px] font-medium">{r.title}</span>
              <span className="mt-1 block text-[12.5px] leading-snug text-muted">{r.description}</span>
            </button>
          ))}
        </div>
        {errors.targetRoleId && <p className="mt-2 text-[13px] text-blush-deep" role="alert">{errors.targetRoleId}</p>}
      </div>
      <div>
        <p className="mb-3 text-[13.5px] font-medium">Interests <span className="text-xs font-normal text-muted">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((tag) => (
            <button key={tag} type="button" aria-pressed={draft.interests.includes(tag)} onClick={() => toggle(tag)}
              className={cn('rounded-full border px-3.5 py-1.5 text-[13px] transition-colors', draft.interests.includes(tag) ? 'border-plum bg-plum text-cream' : 'border-line bg-paper hover:border-mauve/60')}>
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PreferencesSection({ draft, patch, errors = {} }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="hours" className="mb-1.5 block text-[13.5px] font-medium">Study time per week</label>
        <div className="flex items-center gap-4">
          <input id="hours" type="range" min={1} max={40} value={draft.weeklyHoursGoal} onChange={(e) => patch({ weeklyHoursGoal: Number(e.target.value) })} className="flex-1 accent-[var(--color-plum)]" />
          <span className="w-16 font-display text-[26px] font-medium">{draft.weeklyHoursGoal} h</span>
        </div>
        {errors.weeklyHoursGoal && <p className="mt-1 text-[13px] text-blush-deep">{errors.weeklyHoursGoal}</p>}
        <p className="mt-1.5 text-[13px] text-muted">Your roadmap’s weekly milestones and finish date use this.</p>
      </div>
      <Select label="How do you like to learn?" value={draft.preferredResourceType} options={RESOURCE_TYPES} onChange={(e) => patch({ preferredResourceType: e.target.value })} />
    </div>
  );
}
