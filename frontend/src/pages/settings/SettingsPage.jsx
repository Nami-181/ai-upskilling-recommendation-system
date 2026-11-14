import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, KeyRound, SlidersHorizontal, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FormAlert from '../../components/forms/FormAlert';
import PasswordField from '../../components/forms/PasswordField';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { PageHeader } from '../../components/app/PageStates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { accountService } from '../../services/learningService';
import { rules } from '../../utils/validation';

/** Screen 45: settings — password, preferences and account deletion. */
export default function SettingsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const form = useForm({ current: '', password: '', confirm: '' }, (v) => ({
    current: rules.required('Current password'),
    password: rules.newPassword,
    confirm: rules.matches(v.password),
  }));

  const changePassword = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await accountService.changePassword(v.current, v.password);
      form.reset();
      toast.success('Password updated');
    } catch (err) {
      if (err.code === 'WRONG_PASSWORD') form.setFieldError('current', err.message);
      else setError(err);
    }
  });

  const [exporting, setExporting] = useState(false);
  const exportData = async () => {
    setExporting(true);
    try {
      const data = await accountService.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'lumora-my-data.json' });
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export ready', 'Your data was downloaded as JSON.');
    } catch (err) {
      toast.error('Couldn’t export your data', err.message);
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await accountService.deleteAccount();
      logout();
      toast.info('Account deleted', 'All your data was removed.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Couldn’t delete the account', err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Settings" title={<>Your <em>account.</em></>} description={`Signed in as ${user?.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="flex items-center gap-2 text-[24px] font-medium"><KeyRound className="h-5 w-5 text-plum" />Change password</h3>
          {error && <FormAlert className="mt-4" onDismiss={() => setError(null)}>{error.message}</FormAlert>}
          <form onSubmit={changePassword} className="mt-5 space-y-4" noValidate>
            <PasswordField label="Current password" autoComplete="current-password" {...form.field('current')} />
            <PasswordField label="New password" autoComplete="new-password" {...form.field('password')} />
            <PasswordField label="Confirm new password" autoComplete="new-password" {...form.field('confirm')} />
            <Button type="submit" as="button" loading={form.submitting}>Update password</Button>
          </form>
        </Card>
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="flex items-center gap-2 text-[24px] font-medium"><SlidersHorizontal className="h-5 w-5 text-plum" />Learning preferences</h3>
            <p className="mt-2 text-[14px] text-muted">Weekly study hours, preferred resource type, career goal and interests live in your profile.</p>
            <Button to="/app/profile/edit#preferences" variant="secondary" className="mt-5">Edit preferences</Button>
          </Card>
          <Card padding="lg">
            <h3 className="flex items-center gap-2 text-[24px] font-medium"><Download className="h-5 w-5 text-plum" />Download your data</h3>
            <p className="mt-2 text-[14px] text-muted">A JSON copy of your profile, roadmaps, recommendations, quiz scores, progress and feedback.</p>
            <Button variant="secondary" className="mt-5" loading={exporting} onClick={exportData}>Download my data</Button>
          </Card>
          <Card tint="pink" padding="lg">
            <h3 className="flex items-center gap-2 text-[24px] font-medium"><Trash2 className="h-5 w-5 text-blush-deep" />Delete account</h3>
            <p className="mt-2 text-[14px] text-muted">Permanently removes your profile, roadmaps, quiz scores and progress. This can’t be undone.</p>
            <Button variant="secondary" className="mt-5" onClick={() => setConfirmDelete(true)}>Delete my account</Button>
          </Card>
        </div>
      </div>
      <ConfirmDialog open={confirmDelete} tone="danger" loading={deleting} onClose={() => setConfirmDelete(false)} onConfirm={remove}
        title="Delete your account?" confirmLabel="Delete forever"
        description="Your profile, roadmaps, quiz history and progress will be erased immediately." />
    </div>
  );
}
