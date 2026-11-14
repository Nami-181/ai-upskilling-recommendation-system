import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MailOpen, BadgeCheck, RotateCcw, PencilLine, FlaskConical, ArrowRight, ArrowLeft, CircleHelp } from 'lucide-react';
import AuthHeader from './AuthHeader';
import Button from '../../components/common/Button';
import FormAlert from '../../components/forms/FormAlert';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useCooldown } from '../../hooks/useCooldown';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { USE_MOCK_DATA } from '../../services/api';

/** SCREEN 10 — Email verification */
export default function VerifyEmailPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const toast = useToast();
  const cooldown = useCooldown(30);

  const email = location.state?.email || params.get('email');
  const [status, setStatus] = useState('pending'); // pending | verifying | verified
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [changeOpen, setChangeOpen] = useState(false);

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      await authService.resendVerification({ email });
      cooldown.start();
      toast.success('Verification email sent', `A new link is on its way to ${email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const verify = async () => {
    setStatus('verifying');
    setError(null);
    try {
      await verifyEmail(email);
      setStatus('verified');
    } catch (err) {
      setStatus('pending');
      setError(err.message);
    }
  };

  const changeEmail = async () => {
    await authService.discardUnverified({ email });
    setChangeOpen(false);
    navigate('/signup', { state: { email } });
  };

  // No email to verify (page opened directly)
  if (!email) {
    return (
      <div className="animate-fade-up">
        <AuthHeader
          icon={CircleHelp}
          tint="bg-lavender/80 text-lavender-deep"
          title={
            <>
              Which email should we <em>verify?</em>
            </>
          }
          description="Open the verification link from your inbox, or create an account to receive one."
        />
        <div className="space-y-3">
          <Button to="/signup" size="lg" className="w-full">Create an account</Button>
          <Button to="/login" size="lg" variant="secondary" className="w-full">Back to login</Button>
        </div>
      </div>
    );
  }

  // Verified success state
  if (status === 'verified') {
    return (
      <div className="flex animate-fade-up flex-col items-center py-8 text-center" role="status">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sage text-sage-deep">
          <BadgeCheck className="h-9 w-9" strokeWidth={1.4} />
        </span>
        <h1 className="mt-8 text-[40px] leading-tight font-medium">
          Email <em className="text-plum italic">verified.</em>
        </h1>
        <p className="mt-2 max-w-sm text-muted">
          <span className="text-ink">{email}</span> is confirmed. Your LUMORA account is ready.
        </p>
        <Button to="/welcome" size="lg" rightIcon={ArrowRight} className="mt-8">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <AuthHeader
        icon={MailOpen}
        tint="bg-lavender/80 text-lavender-deep"
        title={
          <>
            Verify your <em>email.</em>
          </>
        }
        description="We’ve sent a verification link to:"
      />

      <div className="-mt-4 mb-8 flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3.5">
        <span className="truncate text-[15px] font-medium">{email}</span>
        <button
          type="button"
          onClick={() => setChangeOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] text-plum transition-colors hover:bg-blush/50"
        >
          <PencilLine className="h-3.5 w-3.5" /> Change
        </button>
      </div>

      <p className="text-[14.5px] leading-relaxed text-muted">
        Click the link in that email to activate your account. It can take a minute to arrive — check your spam or
        promotions folder if you can’t see it.
      </p>

      {error && (
        <FormAlert title="Something went wrong" onDismiss={() => setError(null)} className="mt-6">
          {error}
        </FormAlert>
      )}

      <div className="mt-8 space-y-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          leftIcon={RotateCcw}
          loading={resending}
          disabled={cooldown.active || status === 'verifying'}
          onClick={resend}
        >
          {cooldown.active ? `Resend in ${cooldown.remaining}s` : 'Resend verification email'}
        </Button>
      </div>

      {USE_MOCK_DATA && (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper/60 p-4 text-[12.5px] leading-relaxed text-muted">
          <p className="flex items-center gap-2 font-medium text-ink">
            <FlaskConical className="h-4 w-4 text-lavender-deep" strokeWidth={1.6} /> Demo mode — no email is actually sent
          </p>
          <p className="mt-1">Simulate opening the link from your inbox:</p>
          <Button size="sm" className="mt-3" onClick={verify} loading={status === 'verifying'}>
            {status === 'verifying' ? 'Verifying…' : 'Simulate verification link'}
          </Button>
        </div>
      )}

      <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <ConfirmDialog
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        onConfirm={changeEmail}
        title="Use a different email?"
        description={`We’ll cancel the unverified sign-up for ${email} and take you back to create your account with another address.`}
        confirmLabel="Change email"
      />
    </div>
  );
}
