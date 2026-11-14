import { useState } from 'react';
import { CircleHelp, Send } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FormAlert from '../../components/forms/FormAlert';
import Select from '../../components/forms/Select';
import TextArea from '../../components/forms/TextArea';
import { PageHeader } from '../../components/app/PageStates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { supportService } from '../../services/supportService';
import { rules } from '../../utils/validation';

const TOPICS = ['Question about my roadmap', 'A recommendation looks wrong', 'Report a problem', 'Account help', 'Other'];

/** Screen 46: help & support — FAQ link and a message form (POST /feedback type=contact). */
export default function SupportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [error, setError] = useState(null);
  const form = useForm({ subject: TOPICS[0], message: '' }, () => ({ message: rules.minLength('Message', 10) }));

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await supportService.sendContactMessage({ name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, subject: v.subject, message: v.message });
      form.reset({ subject: TOPICS[0], message: '' });
      toast.success('Message sent', 'We usually reply within two working days.');
    } catch (err) {
      setError(err);
    }
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader eyebrow="Help & support" title={<>How can we <em>help?</em></>} description="Most answers are in the FAQ. If not, send us a message." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card tint="lavender" padding="lg">
          <CircleHelp className="h-6 w-6 text-plum" strokeWidth={1.5} />
          <h3 className="mt-3 text-[24px] font-medium">Frequently asked questions</h3>
          <p className="mt-2 text-[14px] text-muted">How recommendations work, how quizzes change your roadmap, privacy and more.</p>
          <Button to="/faq" variant="secondary" className="mt-5">Read the FAQ</Button>
        </Card>
        <Card padding="lg">
          <h3 className="text-[24px] font-medium">Send a message</h3>
          {error && <FormAlert className="mt-4" onDismiss={() => setError(null)}>{error.message}</FormAlert>}
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Select label="Topic" options={TOPICS} {...form.field('subject')} />
            <TextArea label="Message" required rows={5} maxLength={2000} {...form.field('message')} />
            <Button type="submit" as="button" leftIcon={Send} loading={form.submitting}>Send message</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
