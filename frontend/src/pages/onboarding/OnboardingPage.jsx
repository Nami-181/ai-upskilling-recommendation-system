import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FormAlert from '../../components/forms/FormAlert';
import ProgressBar from '../../components/common/ProgressBar';
import { ErrorState, LoadingBlock } from '../../components/app/PageStates';
import {
  AboutSection, CareerSection, CoursesSection, PreferencesSection, ProjectsSection, SkillsSection,
  draftFromProfile, payloadFromDraft, validateDraft, RESOURCE_TYPES,
} from '../../components/profile/ProfileSections';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { profileService } from '../../services/profileService';
import { catalogService, roadmapService } from '../../services/learningService';
import { sessionUser } from '../../utils/session';

const STEPS = [
  { id: 'about', title: 'About you', blurb: 'Your studies help us pitch resources at the right level.' },
  { id: 'skills', title: 'Your skills', blurb: 'Be honest — the gap analysis is only as good as these ratings.' },
  { id: 'courses', title: 'Courses', blurb: 'Subjects and online courses you have done. We read skills from the titles.' },
  { id: 'projects', title: 'Projects', blurb: 'Projects count as stronger evidence than courses.' },
  { id: 'career', title: 'Career goal', blurb: 'Pick the role your roadmap should lead to. You can change it later.' },
  { id: 'preferences', title: 'Preferences', blurb: 'How much time you have and how you like to learn.' },
  { id: 'review', title: 'Review', blurb: 'Check everything, then we build your roadmap.' },
];

/** Screens 12–23: onboarding wizard → profile saved → first roadmap generated. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateUser } = useAuth();
  const data = useAsync(() => Promise.all([profileService.getProfile(), catalogService.roles(), catalogService.taxonomy()]), []);
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (data.data && !draft) setDraft(draftFromProfile(data.data[0]));
  }, [data.data, draft]);

  const patch = (changes) => setDraft((d) => ({ ...d, ...changes }));
  const current = STEPS[step];
  const roles = data.data?.[1] ?? [];
  const roleTitle = useMemo(() => roles.find((r) => r.id === draft?.targetRoleId)?.title, [roles, draft]);

  const next = () => {
    const e = validateDraft(draft, current.id);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = async () => {
    const e = validateDraft(draft);
    if (Object.keys(e).length) {
      setErrors(e);
      setStep(STEPS.findIndex((s) => s.id === (e.targetRoleId ? 'career' : e.firstName ? 'about' : 'preferences')));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const profile = await profileService.updateProfile({ ...payloadFromDraft(draft), onboardingComplete: true });
      updateUser(sessionUser(profile));
      await roadmapService.generate();
      toast.success('Your roadmap is ready', 'Built from your profile and skill gaps.');
      navigate('/app/roadmap', { replace: true });
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-blush/60 blur-[110px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-lavender/60 blur-[110px]" />
      </div>
      <header className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-5 md:px-8">
        <Logo />
        <Button to="/app/dashboard" variant="ghost" size="sm">Skip for now</Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
        {data.loading && !data.data && <LoadingBlock />}
        {data.error && <ErrorState error={data.error} onRetry={data.reload} />}
        {draft && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Step {step + 1} of {STEPS.length}</span>
                <span>{current.title}</span>
              </div>
              <ProgressBar value={step + 1} max={STEPS.length} className="mt-2" label="Onboarding progress" />
              <ol className="mt-4 hidden gap-2 md:flex">
                {STEPS.map((s, i) => (
                  <li key={s.id}>
                    <button type="button" disabled={i > step} onClick={() => setStep(i)}
                      className={`rounded-full px-3 py-1 text-[12px] ${i === step ? 'bg-ink text-cream' : i < step ? 'bg-sage text-sage-deep' : 'bg-sand/50 text-muted'}`}>
                      {i < step && <Check className="mr-1 inline h-3 w-3" />}{s.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <h1 className="text-[40px] leading-tight font-medium md:text-[52px]">{current.title}</h1>
            <p className="mt-2 mb-8 text-muted">{current.blurb}</p>

            {formError && (
              <FormAlert title="We couldn’t save your profile" onDismiss={() => setFormError(null)} className="mb-6">
                {formError.message}
              </FormAlert>
            )}

            <Card padding="lg">
              {current.id === 'about' && <AboutSection draft={draft} patch={patch} errors={errors} />}
              {current.id === 'skills' && <SkillsSection draft={draft} patch={patch} taxonomy={data.data[2]} />}
              {current.id === 'courses' && <CoursesSection draft={draft} patch={patch} />}
              {current.id === 'projects' && <ProjectsSection draft={draft} patch={patch} errors={errors} />}
              {current.id === 'career' && <CareerSection draft={draft} patch={patch} roles={roles} errors={errors} />}
              {current.id === 'preferences' && <PreferencesSection draft={draft} patch={patch} errors={errors} />}
              {current.id === 'review' && (
                <dl className="grid gap-x-8 gap-y-5 text-[14px] sm:grid-cols-2">
                  {[
                    ['Name', `${draft.firstName} ${draft.lastName}`.trim(), 0],
                    ['Studies', [draft.program, draft.institution, draft.year && `year ${draft.year}`].filter(Boolean).join(', ') || '—', 0],
                    ['Skills rated', `${Object.values(draft.skills).filter(Boolean).length} skills`, 1],
                    ['Courses', draft.courses.map((c) => c.title).filter(Boolean).join(', ') || '—', 2],
                    ['Projects', draft.projects.map((p) => p.title).filter(Boolean).join(', ') || '—', 3],
                    ['Target career', roleTitle ?? '—', 4],
                    ['Interests', draft.interests.join(', ') || '—', 4],
                    ['Study plan', `${draft.weeklyHoursGoal} h/week · ${RESOURCE_TYPES.find((t) => t.value === draft.preferredResourceType)?.label}`, 5],
                  ].map(([label, value, s]) => (
                    <div key={label} className="border-b border-line pb-3">
                      <dt className="flex items-center justify-between text-[12px] tracking-wide text-muted uppercase">
                        {label}
                        <button type="button" onClick={() => setStep(s)} className="text-[12px] tracking-normal text-plum normal-case hover:underline">Edit</button>
                      </dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Card>

            <div className="mt-8 flex justify-between gap-3">
              <Button variant="secondary" leftIcon={ArrowLeft} disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              {current.id === 'review' ? (
                <Button rightIcon={Sparkles} loading={saving} onClick={finish}>
                  {saving ? 'Building your roadmap…' : 'Build my roadmap'}
                </Button>
              ) : (
                <Button rightIcon={ArrowRight} onClick={next}>Continue</Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
