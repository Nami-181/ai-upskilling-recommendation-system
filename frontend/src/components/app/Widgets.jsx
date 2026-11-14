import { Bookmark, BookmarkCheck, Clock, ExternalLink, Star, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import Badge from '../common/Badge';
import Card from '../common/Card';
import { DIFFICULTY, LEVEL_LABELS, STATUS_LABELS } from '../../services/learningService';
import { cn } from '../../utils/cn';

export function StatCard({ icon: Icon, label, value, hint, tint = 'paper' }) {
  return (
    <Card tint={tint} className="flex items-start gap-4">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-plum">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <p className="font-display text-[30px] leading-tight font-medium">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}

const SEVERITY_TONE = { High: 'pink', Medium: 'lavender', Low: 'sage', None: 'outline' };
export function SeverityBadge({ severity }) {
  return <Badge tone={SEVERITY_TONE[severity] ?? 'neutral'}>{severity === 'None' ? 'Met' : `${severity} gap`}</Badge>;
}

const STATUS_TONE = { not_started: 'outline', in_progress: 'lavender', completed: 'sage' };
export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status] ?? status}</Badge>;
}

/** 0–5 skill level picker (radio group). */
export function LevelPicker({ value = 0, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {LEVEL_LABELS.map((name, level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          title={`${level} · ${name}`}
          onClick={() => onChange(level)}
          className={cn(
            'h-8 w-8 rounded-full border text-xs font-medium transition-colors',
            value === level
              ? 'border-plum bg-plum text-cream'
              : level <= value
                ? 'border-mauve/60 bg-blush/60 text-ink'
                : 'border-line bg-paper text-muted hover:border-mauve/60',
          )}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

export function LevelDots({ value, max = 5, required }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Level ${value} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-2 rounded-full',
            i < value ? 'bg-plum' : required && i < required ? 'bg-blush-deep/35' : 'bg-sand',
          )}
        />
      ))}
    </span>
  );
}

const FEEDBACK = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'too_hard', label: 'Too hard' },
  { value: 'not_relevant', label: 'Not relevant' },
];

/** Recommendation card for a course / resource inside the roadmap. */
export function ResourceCard({ item, onStatus, onFeedback, onSave, compact = false }) {
  const [menu, setMenu] = useState(false);
  return (
    <Card tint="white" padding="sm" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1.5 text-[15px] font-medium hover:text-plum">
            {item.title}
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted group-hover:text-plum" />
          </a>
          <p className="mt-0.5 text-[13px] text-muted">{item.provider}</p>
        </div>
        {onSave && (
          <button type="button" onClick={() => onSave(item)} className="rounded-full p-1.5 text-muted hover:bg-sand/50 hover:text-plum" aria-label={item.saved ? 'Remove from wishlist' : 'Save to wishlist'}>
            {item.saved ? <BookmarkCheck className="h-4 w-4 text-plum" /> : <Bookmark className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{item.type}</Badge>
        <Badge tone="lavender">{DIFFICULTY[item.level]}</Badge>
        {item.is_free && <Badge tone="sage">Free</Badge>}
        <Badge tone="outline" icon={Clock}>{item.duration_hrs} h</Badge>
        <Badge tone="outline" icon={Star}>{item.rating}</Badge>
      </div>
      {!compact && item.reason && <p className="text-[13px] leading-snug text-muted">{item.reason}</p>}
      {(onStatus || onFeedback) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          {onStatus && (
            <select
              value={item.status}
              onChange={(e) => onStatus(item, e.target.value)}
              aria-label={`Status of ${item.title}`}
              className="h-8 rounded-full border border-line bg-paper px-3 text-[12.5px] focus:border-mauve focus:outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}
          {onFeedback && (
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] text-muted hover:bg-sand/50 hover:text-ink" aria-expanded={menu}>
                <ThumbsDown className="h-3.5 w-3.5" /> Not for me
              </button>
              {menu && (
                <div className="absolute right-0 bottom-full z-20 mb-1 w-40 animate-scale-in overflow-hidden rounded-xl border border-line bg-paper shadow-lift">
                  {FEEDBACK.map((f) => (
                    <button key={f.value} type="button" className="block w-full px-3 py-2 text-left text-[13px] hover:bg-linen" onClick={() => { setMenu(false); onFeedback(item, f.value); }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
