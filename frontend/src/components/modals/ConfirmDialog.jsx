import { CircleAlert, LogOut, Trash2 } from 'lucide-react';
import Modal from './Modal';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

const TONES = {
  danger: { icon: Trash2, ring: 'bg-blush/70 text-blush-deep', button: 'bg-blush-deep! text-white! hover:bg-plum!' },
  neutral: { icon: CircleAlert, ring: 'bg-lavender/70 text-lavender-deep', button: '' },
  logout: { icon: LogOut, ring: 'bg-sand/80 text-sand-deep', button: '' },
};

/**
 * Reusable "are you sure?" dialog — logout, delete, discard changes.
 * <ConfirmDialog open={open} onClose={…} onConfirm={…} tone="danger" title="Delete entry?" />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'neutral',
  loading = false,
}) {
  const { icon: Icon, ring, button } = TONES[tone];
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} loading={loading} className={button}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-full', ring)}>
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 text-[28px] leading-tight font-medium">{title}</h2>
      {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
    </Modal>
  );
}
