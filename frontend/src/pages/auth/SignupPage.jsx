import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, UserRound, ArrowRight, MailCheck } from 'lucide-react';
import AuthHeader from './AuthHeader';
import Button from '../../components/common/Button';
import TextField from '../../components/forms/TextField';
import PasswordField from '../../components/forms/PasswordField';
import PasswordStrength from '../../components/forms/PasswordStrength';
import Checkbox from '../../components/forms/Checkbox';
import FormAlert from '../../components/forms/FormAlert';
import Modal from '../../components/modals/Modal';
import { useForm } from '../../hooks/useForm';
import { rules } from '../../utils/validation';
import { authService } from '../../services/authService';

const TERMS = [
  ['Your profile', 'You provide accurate academic and skill information so recommendations are relevant to you.'],
  ['How we use it', 'Your data is used to generate skill-gap analyses, roadmaps and recommendations, and to show your progress.'],
  ['Recommendations', 'Suggestions are guidance, not guarantees. Always review a course, project or certification before committing time or money.'],
  ['Your control', 'You can edit your profile, change preferences or request deletion of your account at any time from Settings.'],
];

/** SCREEN 7 — Sign up */
export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [created, setCreated] = useState(null); // email once the account exists
  const [termsOpen, setTermsOpen] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

  const schema = useCallback(
    (values) => ({
      name: rules.fullName,
      email: rules.email,
      password: rules.newPassword,
      confirmPassword: rules.matches(values.password),
      terms: (v) => (v ? '' : 'Please accept the terms to create your account.'),
    }),
    [],
  );
  const demoTokenRef = useRef(null);
  const form = useForm(
    { name: '', email: location.state?.email ?? '', password: '', confirmPassword: '', terms: false },
    schema,
  );

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    try {
      const result = await authService.register({ name, email, password });
      demoTokenRef.current = result?.demoToken ?? null;
      setCreated(email.trim().toLowerCase());
    } catch (err) {
      setAttempt((a) => a + 1);
      if (err.code === 'EMAIL_TAKEN') form.setFieldError('email', 'This email is already registered.');
      setFormError({ code: err.code, message: err.message });
    }
  });

  // Success → continue to email verification
  useEffect(() => {
    if (!created) return undefined;
    const t = setTimeout(() => navigate('/verify-email', { state: { email: created, demoToken: demoTokenRef.current }, replace: true }), 2200);
    return () => clearTimeout(t);
  }, [created, navigate]);

  if (created) {
    return (
      <div className="flex animate-fade-up flex-col items-center py-8 text-center" role="status">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sage text-sage-deep">
          <MailCheck className="h-9 w-9" strokeWidth={1.4} />
        </span>
        <h1 className="mt-8 text-[40px] leading-tight font-medium">
          Account <em className="text-plum italic">created.</em>
        </h1>
        <p className="mt-2 max-w-sm text-muted">
          One last step — confirm <span className="text-ink">{created}</span> so we know it’s really you.
        </p>
        <Button to="/verify-email" state={{ email: created, demoToken: demoTokenRef.current }} className="mt-8" rightIcon={ArrowRight}>
          Verify my email
        </Button>
        <p className="mt-4 text-[12px] text-muted">Continuing automatically…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <AuthHeader
        eyebrow="Create account"
        title={
          <>
            Begin your <em>journey.</em>
          </>
        }
        description="It takes a minute. Your personalised roadmap comes right after."
      />

      {formError && (
        <FormAlert key={attempt} title={formError.code === 'EMAIL_TAKEN' ? 'Email already registered' : 'Couldn’t create your account'} onDismiss={() => setFormError(null)} className="mb-6">
          {formError.code === 'EMAIL_TAKEN' ? (
            <>
              <Link to="/login" state={{ email: form.values.email }} className="font-medium text-plum underline-offset-2 hover:underline">
                Sign in instead
              </Link>{' '}
              or use a different email.
            </>
          ) : (
            formError.message
          )}
        </FormAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField label="Full name" icon={UserRound} autoComplete="name" placeholder="Aanya Sharma" disabled={form.submitting} {...form.field('name')} />
        <TextField label="Email address" type="email" icon={Mail} autoComplete="email" placeholder="you@university.edu" disabled={form.submitting} {...form.field('email')} />
        <div>
          <PasswordField
            autoComplete="new-password"
            placeholder="Create a password"
            disabled={form.submitting}
            {...form.field('password')}
            onFocus={() => setShowStrength(true)}
          />
          {(showStrength || form.values.password) && <PasswordStrength password={form.values.password} />}
        </div>
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          disabled={form.submitting}
          {...form.field('confirmPassword')}
        />
        <Checkbox
          name="terms"
          checked={form.values.terms}
          onChange={(e) => form.setValue('terms', e.target.checked)}
          error={form.field('terms').error}
          disabled={form.submitting}
          label={
            <>
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTermsOpen(true);
                }}
                className="font-medium text-plum underline underline-offset-2"
              >
                terms and privacy policy
              </button>
            </>
          }
        />
        <Button type="submit" size="lg" rightIcon={ArrowRight} loading={form.submitting} className="w-full">
          {form.submitting ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-4 hover:text-plum hover:underline">
          Sign in
        </Link>
      </p>

      <Modal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        size="md"
        title="Terms & privacy, in brief"
        description="A plain-language summary for this prototype. Replace with your university-approved terms before launch."
        footer={
          <>
            <Button variant="secondary" onClick={() => setTermsOpen(false)}>Close</Button>
            <Button
              onClick={() => {
                form.setValue('terms', true);
                setTermsOpen(false);
              }}
            >
              I agree
            </Button>
          </>
        }
      >
        <dl className="space-y-4">
          {TERMS.map(([term, detail]) => (
            <div key={term} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <dt className="text-[14px] font-medium">{term}</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </div>
  );
}
