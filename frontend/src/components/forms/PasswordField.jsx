import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import TextField from './TextField';

/** Password input with a show/hide toggle. */
export default function PasswordField({ label = 'Password', icon = LockKeyhole, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      icon={icon}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sand/50 hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.6} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.6} />}
        </button>
      }
      {...props}
    />
  );
}
