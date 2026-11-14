import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LockKeyhole, ShieldCheck, LinkIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthHeader from './AuthHeader';
import Button from '../../components/common/Button';
import PasswordField from '../../components/forms/PasswordField';
import PasswordStrength from '../../components/forms/PasswordStrength';
import FormAlert from '../../components/forms/FormAlert';
import { useForm } from '../../hooks/useForm';
import { rules } from '../../utils/validation';
import { authService } from '../../services/authService';

/** SCREEN 9 — Reset password (reached from the emailed link: /reset-password?token=…) */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const schema = useCallback(
    (values) => ({ password: rules.newPassword, confirmPassword: rules.matches(values.password) }),
    [],
  );
  const form = useForm({ password: '', confirmPassword: '' }, schema);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await authService.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError({ code: err.code, message: err.message });
    }
  });

  // Missing token → the link is broken
  if (!token) {
    return (
      <div className="animate-fade-up">
        <AuthHeader
          icon={LinkIcon}
          title={
            <>
              This link isn’t <em>complete.</em>
            </>
          }
          description="The reset link is missing its security token. Request a new link and open it straight from your email."
        />
        <Button to="/forgot-password" size="lg" className="w-full">Request a new link</Button>
        <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  // Success screen
  if (done) {
    return (
      <div className="flex animate-fade-up flex-col items-center py-8 text-center" role="status">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sage text-sage-deep">
          <ShieldCheck className="h-9 w-9" strokeWidth={1.4} />
        </span>
        <h1 className="mt-8 text-[40px] leading-tight font-medium">
          Password <em className="text-plum italic">reset.</em>
        </h1>
        <p className="mt-2 max-w-sm text-muted">Your new password is ready. Sign in with it to continue your learning path.</p>
        <Button to="/login" size="lg" rightIcon={ArrowRight} className="mt-8">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <AuthHeader
        icon={LockKeyhole}
        tint="bg-lavender/80 text-lavender-deep"
        title={
          <>
            Choose a new <em>password.</em>
          </>
        }
        description="Make it strong and unique — at least 8 characters with a mix of letters, numbers and symbols."
      />

      {error && (
        <FormAlert title={error.code === 'INVALID_TOKEN' ? 'Link expired' : 'Couldn’t reset your password'} onDismiss={() => setError(null)} className="mb-6">
          {error.message}{' '}
          {error.code === 'INVALID_TOKEN' && (
            <Link to="/forgot-password" className="font-medium text-plum underline-offset-2 hover:underline">
              Request a new link
            </Link>
          )}
        </FormAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <PasswordField label="New password" autoComplete="new-password" placeholder="Create a new password" disabled={form.submitting} {...form.field('password')} />
          <PasswordStrength password={form.values.password} />
        </div>
        <PasswordField label="Confirm new password" autoComplete="new-password" placeholder="Re-enter the new password" disabled={form.submitting} {...form.field('confirmPassword')} />
        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          {form.submitting ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </div>
  );
}
