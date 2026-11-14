import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, MailCheck, RotateCcw, FlaskConical, ArrowRight } from 'lucide-react';
import AuthHeader from './AuthHeader';
import Button from '../../components/common/Button';
import TextField from '../../components/forms/TextField';
import FormAlert from '../../components/forms/FormAlert';
import { useForm } from '../../hooks/useForm';
import { useCooldown } from '../../hooks/useCooldown';
import { rules } from '../../utils/validation';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { USE_MOCK_DATA } from '../../services/api';

/** SCREEN 8 — Forgot password */
export default function ForgotPasswordPage() {
  const toast = useToast();
  const cooldown = useCooldown(30);
  const [sentTo, setSentTo] = useState(null);
  const [demoToken, setDemoToken] = useState(null);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);

  const schema = useCallback(() => ({ email: rules.email }), []);
  const form = useForm({ email: '' }, schema);

  const send = async (email) => {
    const result = await authService.forgotPassword({ email });
    setDemoToken(result.demoToken ?? null);
    setSentTo(email.trim());
    cooldown.start();
  };

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await send(email);
    } catch (err) {
      setError(err.message);
    }
  });

  const resend = async () => {
    setResending(true);
    try {
      await send(sentTo);
      toast.success('Link sent again', `Check ${sentTo} — and your spam folder, just in case.`);
    } catch (err) {
      toast.error('Couldn’t resend the link', err.message);
    } finally {
      setResending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="animate-fade-up">
        <AuthHeader
          icon={MailCheck}
          tint="bg-sage text-sage-deep"
          title={
            <>
              Check your <em>inbox.</em>
            </>
          }
          description={
            <>
              If an account exists for <span className="font-medium text-ink">{sentTo}</span>, we’ve sent a link to
              reset your password. It expires in 30 minutes.
            </>
          }
        />

        <div className="space-y-3">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            leftIcon={RotateCcw}
            loading={resending}
            disabled={cooldown.active}
            onClick={resend}
          >
            {cooldown.active ? `Resend link in ${cooldown.remaining}s` : 'Resend link'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => {
              setSentTo(null);
              setDemoToken(null);
            }}
          >
            Use a different email
          </Button>
        </div>

        {(USE_MOCK_DATA || demoToken) && (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper/60 p-4 text-[12.5px] leading-relaxed text-muted">
            <p className="flex items-center gap-2 font-medium text-ink">
              <FlaskConical className="h-4 w-4 text-lavender-deep" strokeWidth={1.6} /> Demo mode — no email is actually sent
            </p>
            {demoToken ? (
              <Link
                to={`/reset-password?token=${demoToken}`}
                className="mt-2 inline-flex items-center gap-1.5 font-medium text-plum underline-offset-2 hover:underline"
              >
                Open the reset link <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <p className="mt-1">No account with this email exists in this browser’s demo data, so no reset link was created.</p>
            )}
          </div>
        )}

        <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <AuthHeader
        icon={KeyRound}
        title={
          <>
            Forgot your <em>password?</em>
          </>
        }
        description="Enter the email you signed up with and we’ll send you a link to choose a new one."
      />

      {error && (
        <FormAlert title="We couldn’t send the link" onDismiss={() => setError(null)} className="mb-6">
          {error}
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
        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          {form.submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </div>
  );
}
