import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CircleCheck, FlaskConical } from 'lucide-react';
import AuthHeader from './AuthHeader';
import Button from '../../components/common/Button';
import TextField from '../../components/forms/TextField';
import PasswordField from '../../components/forms/PasswordField';
import Checkbox from '../../components/forms/Checkbox';
import FormAlert from '../../components/forms/FormAlert';
import { useForm } from '../../hooks/useForm';
import { rules } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { USE_MOCK_DATA } from '../../services/api';
import { DEMO_ACCOUNT } from '../../data/mockUser';

/** SCREEN 6 — Login */
export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [formError, setFormError] = useState(null); // { code, message }
  const [attempt, setAttempt] = useState(0); // re-keys the alert so it shakes on every failure
  const [signedInUser, setSignedInUser] = useState(null);

  const schema = useCallback(() => ({ email: rules.email, password: rules.loginPassword }), []);
  const form = useForm({ email: location.state?.email ?? '', password: '', remember: true }, schema);

  const onSubmit = form.handleSubmit(async ({ email, password, remember }) => {
    setFormError(null);
    try {
      const { user } = await login({ email, password, remember });
      setSignedInUser(user);
    } catch (err) {
      setAttempt((a) => a + 1);
      setFormError({ code: err.code, message: err.message });
      // Clear the password without flagging it as a new validation error
      if (err.code === 'INVALID_CREDENTIALS') form.setValues((v) => ({ ...v, password: '' }));
    }
  });

  // Success state → move on after a short pause
  useEffect(() => {
    if (!signedInUser) return undefined;
    const t = setTimeout(() => {
      toast.success(`Welcome back, ${signedInUser.firstName}`, 'You’re signed in.');
      navigate(from || '/welcome', { replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [signedInUser, from, navigate, toast]);

  if (signedInUser) {
    return (
      <div className="flex animate-fade-up flex-col items-center py-10 text-center" role="status">
        <span className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-sage/70 [animation-duration:1.6s]" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-sage text-sage-deep">
            <CircleCheck className="h-9 w-9" strokeWidth={1.4} />
          </span>
        </span>
        <h1 className="mt-8 text-[40px] leading-tight font-medium">
          Welcome back, <em className="text-plum italic">{signedInUser.firstName}.</em>
        </h1>
        <p className="mt-2 text-muted">Signed in successfully. Opening your space…</p>
        <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-sand/70">
          <div className="h-full w-0 animate-fill rounded-full bg-sage-deep/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <AuthHeader
        eyebrow="Sign in"
        title={
          <>
            Welcome <em>back.</em>
          </>
        }
        description="Pick up where you left off on your learning path."
      />

      {from && !formError && (
        <FormAlert tone="info" className="mb-6">
          Please sign in to continue.
        </FormAlert>
      )}

      {formError && (
        <FormAlert
          key={attempt}
          tone={formError.code === 'EMAIL_NOT_VERIFIED' ? 'info' : 'error'}
          title={formError.code === 'INVALID_CREDENTIALS' ? 'Incorrect email or password' : formError.code === 'EMAIL_NOT_VERIFIED' ? 'Verify your email first' : 'Sign-in failed'}
          onDismiss={() => setFormError(null)}
          className="mb-6"
        >
          {formError.code === 'INVALID_CREDENTIALS' ? (
            <>Check your details and try again, or <Link to="/forgot-password" className="font-medium text-plum underline-offset-2 hover:underline">reset your password</Link>.</>
          ) : formError.code === 'EMAIL_NOT_VERIFIED' ? (
            <>
              We sent a link when you signed up.{' '}
              <Link to="/verify-email" state={{ email: form.values.email }} className="font-medium text-plum underline-offset-2 hover:underline">
                Verify now
              </Link>
            </>
          ) : (
            formError.message
          )}
        </FormAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@university.edu"
          disabled={form.submitting}
          {...form.field('email')}
        />
        <PasswordField
          autoComplete="current-password"
          placeholder="Your password"
          disabled={form.submitting}
          labelAction={
            <Link to="/forgot-password" className="text-[13px] text-plum underline-offset-2 hover:underline">
              Forgot password?
            </Link>
          }
          {...form.field('password')}
        />
        <Checkbox
          label="Remember me on this device"
          checked={form.values.remember}
          onChange={(e) => form.setValue('remember', e.target.checked)}
          disabled={form.submitting}
        />
        <Button type="submit" size="lg" rightIcon={ArrowRight} loading={form.submitting} className="w-full">
          {form.submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-muted">
        New to LUMORA?{' '}
        <Link to="/signup" className="font-medium text-ink underline-offset-4 hover:text-plum hover:underline">
          Create an account
        </Link>
      </p>

      {USE_MOCK_DATA && (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-paper/60 p-4">
          <div className="flex items-start gap-3">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-lavender-deep" strokeWidth={1.6} />
            <div className="flex-1 text-[12.5px] leading-relaxed text-muted">
              <p className="font-medium text-ink">Demo mode — no backend connected</p>
              <p className="mt-0.5">
                Use <span className="font-mono text-ink">{DEMO_ACCOUNT.email}</span> /{' '}
                <span className="font-mono text-ink">{DEMO_ACCOUNT.password}</span>, or create a new account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => form.setValues((v) => ({ ...v, email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }))}
              className="shrink-0 rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-medium transition-colors hover:border-mauve"
            >
              Fill in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
