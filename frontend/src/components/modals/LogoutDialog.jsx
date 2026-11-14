import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/** Logout confirmation, shared by the sidebar and the profile menu. */
export default function LogoutDialog({ open, onClose }) {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450)); // let the button show its loading state
    logout();
    setLoading(false);
    onClose();
    toast.info('Signed out', 'See you soon — your progress is saved.');
    navigate('/login', { replace: true });
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      loading={loading}
      tone="logout"
      title="Log out of LUMORA?"
      description="You’ll need to sign in again to see your roadmap and progress."
      confirmLabel="Log out"
      cancelLabel="Stay signed in"
    />
  );
}
