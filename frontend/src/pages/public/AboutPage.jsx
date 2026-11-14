import { useCallback, useState } from 'react';
import { Compass, Eye, Mail, MapPin, Clock, Send, CircleCheck, RotateCcw } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import SectionHeading from '../../components/common/SectionHeading';
import Button from '../../components/common/Button';
import TextField from '../../components/forms/TextField';
import TextArea from '../../components/forms/TextArea';
import Select from '../../components/forms/Select';
import FormAlert from '../../components/forms/FormAlert';
import CallToAction from '../../components/cards/CallToAction';
import { useForm } from '../../hooks/useForm';
import { rules } from '../../utils/validation';
import { useToast } from '../../context/ToastContext';
import { supportService } from '../../services/supportService';
import { FEATURES } from '../../data/publicContent';

const HELPS = [
  { title: 'Turns a profile into a plan', body: 'Your courses, skills and projects become a staged roadmap rather than a list of disconnected tips.' },
  { title: 'Makes skill gaps visible', body: 'You can see, skill by skill, how far you are from what your target role expects.' },
  { title: 'Saves hours of searching', body: 'Resources, projects and certifications are filtered to your level, budget and time.' },
  { title: 'Keeps you moving', body: 'Milestones, streaks and analytics show your progress, and recommendations adapt as you grow.' },
];

const SUBJECTS = ['General question', 'Feedback on LUMORA', 'Report a problem', 'Collaboration'];

/** SCREEN 2 — About us (with contact) */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About LUMORA"
        title={
          <>
            Helping students learn with <em>purpose.</em>
          </>
        }
        description="LUMORA is an AI-powered upskilling recommendation and automation system that helps university students understand their strengths, close their skill gaps and move confidently towards the careers they want."
      />

      {/* Introduction */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="grid gap-10 border-t border-line pt-16 lg:grid-cols-2 lg:gap-20">
          <p className="font-display text-[30px] leading-[1.25] md:text-[36px]">
            Students today have more learning resources than ever — and less clarity about which ones matter for{' '}
            <em className="text-plum italic">them.</em>
          </p>
          <div className="space-y-5 text-[16px] leading-relaxed text-muted">
            <p>
              LUMORA starts with the student: academic background, courses, technical and non-technical skills,
              previous projects, interests and career goals. From that profile it identifies skill gaps and builds a
              personalised roadmap of courses, projects, resources and certifications.
            </p>
            <p>
              As students complete milestones and assessments, LUMORA tracks their progress and updates its
              recommendations, so the plan stays relevant from the first semester to placement season.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-24 md:grid-cols-2 md:px-8 md:pb-32">
        <div className="rounded-3xl bg-blush/45 p-8 md:p-12">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-plum">
            <Compass className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <p className="eyebrow mt-8">Our mission</p>
          <h2 className="mt-3 text-[32px] leading-tight font-medium md:text-[38px]">
            Give every student a clear, personal path to the skills their future needs.
          </h2>
        </div>
        <div className="rounded-3xl bg-lavender/45 p-8 md:p-12">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-lavender-deep">
            <Eye className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <p className="eyebrow mt-8">Our vision</p>
          <h2 className="mt-3 text-[32px] leading-tight font-medium md:text-[38px]">
            A world where no student graduates unsure of what to learn next.
          </h2>
        </div>
      </section>

      {/* How LUMORA helps */}
      <section className="border-y border-line bg-linen/60">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <SectionHeading
            eyebrow="How LUMORA helps students"
            title={
              <>
                Practical help, <em>quietly delivered.</em>
              </>
            }
          />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
            {HELPS.map((h, i) => (
              <li key={h.title} className="flex gap-6 bg-cream p-8 md:p-10">
                <span className="font-display text-[34px] leading-none text-mauve italic">0{i + 1}</span>
                <div>
                  <h3 className="text-[25px] leading-tight font-medium">{h.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{h.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Core capabilities */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          align="center"
          eyebrow="Core capabilities"
          title={
            <>
              Seven tools, <em>one profile.</em>
            </>
          }
        />
        <ul className="mx-auto mt-14 grid max-w-5xl gap-x-10 gap-y-2 md:grid-cols-2">
          {FEATURES.map(({ id, icon: Icon, tint, title, short }) => (
            <li key={id} className="flex gap-4 border-b border-line py-6">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-[16px] font-medium">{title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{short}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-14 max-w-xl text-center text-[14px] text-muted">
          LUMORA is a university major project, designed and built by a team of four students across UI/UX,
          frontend, backend and machine learning.
        </p>
      </section>

      <ContactSection />
      <CallToAction />
    </>
  );
}

/* ── Contact ──────────────────────────────────────────────── */
function ContactSection() {
  const toast = useToast();
  const [status, setStatus] = useState('idle'); // idle | success | error
  const schema = useCallback(
    () => ({
      name: rules.fullName,
      email: rules.email,
      subject: rules.required('Subject'),
      message: rules.minLength('Message', 20),
    }),
    [],
  );
  const form = useForm({ name: '', email: '', subject: '', message: '' }, schema);

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus('idle');
    try {
      await supportService.sendContactMessage(values);
      setStatus('success');
      toast.success('Message sent', 'Thanks for reaching out — we’ll reply by email.');
    } catch (err) {
      setStatus('error');
      toast.error('Message not sent', err.message);
    }
  });

  return (
    <section id="contact" className="border-t border-line bg-paper/60">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-[1fr_1.3fr] lg:gap-24">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title={
              <>
                We’d love to <em>hear from you.</em>
              </>
            }
            description="Questions, feedback or ideas for LUMORA — send us a note and the team will get back to you."
          />
          <ul className="mt-10 space-y-5 text-[15px]">
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush/70 text-plum"><Mail className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted">lumora.team@example.com</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender/80 text-lavender-deep"><MapPin className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted">Department of Computer Science, [Your University]</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-sage-deep"><Clock className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
              <div>
                <p className="font-medium">Response time</p>
                <p className="text-muted">Usually within 2 working days</p>
              </div>
            </li>
          </ul>
          <p className="mt-8 text-[12px] text-muted italic">Contact details are placeholders — replace them with your team’s real details.</p>
        </div>

        <div className="rounded-3xl border border-line bg-cream p-6 shadow-soft sm:p-10">
          {status === 'success' ? (
            <div className="flex animate-fade-up flex-col items-center py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage text-sage-deep">
                <CircleCheck className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 text-[32px] font-medium">Message sent.</h3>
              <p className="mt-2 max-w-sm text-muted">
                Thank you, {form.values.name.split(' ')[0]}. We’ll reply to <span className="text-ink">{form.values.email}</span> soon.
              </p>
              <Button
                variant="secondary"
                leftIcon={RotateCcw}
                className="mt-8"
                onClick={() => {
                  form.reset();
                  setStatus('idle');
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {status === 'error' && (
                <FormAlert title="We couldn’t send your message" onDismiss={() => setStatus('idle')}>
                  Please check your connection and try again.
                </FormAlert>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Full name" required autoComplete="name" placeholder="Your name" {...form.field('name')} disabled={form.submitting} />
                <TextField label="Email address" required type="email" autoComplete="email" placeholder="you@university.edu" {...form.field('email')} disabled={form.submitting} />
              </div>
              <Select label="Subject" required placeholder="Choose a subject" options={SUBJECTS} {...form.field('subject')} disabled={form.submitting} />
              <TextArea label="Message" required maxLength={1000} placeholder="How can we help?" {...form.field('message')} disabled={form.submitting} />
              <Button type="submit" size="lg" rightIcon={Send} loading={form.submitting} className="w-full sm:w-auto">
                {form.submitting ? 'Sending…' : 'Send message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
