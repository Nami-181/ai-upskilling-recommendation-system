import { useEffect, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import Modal from '../modals/Modal';
import Button from '../common/Button';
import FormAlert from '../forms/FormAlert';
import { roadmapService } from '../../services/learningService';
import { cn } from '../../utils/cn';

/** Skill check quiz. The score updates the skill level and adapts the roadmap on the server. */
export default function QuizModal({ skill, open, onClose, onDone }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !skill) return;
    setQuiz(null); setAnswers({}); setResult(null); setError(null);
    roadmapService.quiz(skill.skill_id).then(setQuiz).catch(setError);
  }, [open, skill]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await roadmapService.submitQuiz(skill.skill_id, answers);
      setResult(r);
      onDone?.(r);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const total = quiz?.questions.length ?? 0;
  const answered = Object.keys(answers).length;
  return (
    <Modal open={open} onClose={onClose} size="lg" title={`${skill?.skill_name ?? ''} skill check`}
      description={result ? null : '80% or more marks the skill as learned; under 50% adds easier material and more time.'}>
      {error && <FormAlert className="mt-4">{error.message}</FormAlert>}
      {!quiz && !error && <p className="mt-6 text-sm text-muted">Loading questions…</p>}
      {quiz && (
        <ol className="mt-6 space-y-6">
          {quiz.questions.map((q, qi) => (
            <li key={q.id}>
              <p className="font-medium">{qi + 1}. {q.question}</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[q.id] === oi;
                  const correct = result && result.correct[q.id] === oi;
                  const wrong = result && chosen && !correct;
                  return (
                    <button key={oi} type="button" disabled={!!result} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={cn('flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[14px] transition-colors',
                        correct ? 'border-sage-deep/50 bg-sage' : wrong ? 'border-blush-deep/50 bg-blush/60'
                          : chosen ? 'border-plum bg-lavender/60' : 'border-line bg-paper hover:border-mauve/60')}
                      aria-pressed={chosen}>
                      {opt}
                      {correct && <CircleCheck className="h-4 w-4 text-sage-deep" />}
                      {wrong && <CircleX className="h-4 w-4 text-blush-deep" />}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
      {result && (
        <FormAlert tone={result.action === 'remediate' ? 'info' : 'success'} title={`You scored ${result.score}%`} className="mt-6">
          {result.messages.join(' ')}
        </FormAlert>
      )}
      <div className="mt-8 flex justify-end gap-3">
        {result ? (
          <Button onClick={onClose}>Back to roadmap</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={!quiz || answered < total}>
              Submit {total ? `(${answered}/${total})` : ''}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
