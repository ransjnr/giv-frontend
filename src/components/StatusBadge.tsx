import { AlertTriangleIcon, CalendarClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RequestStatus, SupportRequest } from '@/api/schema';
import {
  registrationStatus,
  requestStatus,
  urgencyLabel,
  urgencyTone,
  type ActiveRegistrationStatus,
  type Tone,
} from '@/content/staff';
import { neededByState } from '@/lib/format';
import { cn } from '@/lib/utils';

/* Each tone pairs text and background at 4.5:1 or more, in both themes. A dot adds a cue beyond colour. */
const TONES: Record<Tone, { badge: string; dot: string }> = {
  new: { badge: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200', dot: 'bg-sky-600 dark:bg-sky-400' },
  progress: { badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200', dot: 'bg-amber-500' },
  contacted: { badge: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200', dot: 'bg-violet-600 dark:bg-violet-400' },
  done: { badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200', dot: 'bg-emerald-600 dark:bg-emerald-400' },
  muted: { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/60' },
  danger: { badge: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200', dot: 'bg-red-600 dark:bg-red-400' },
  warning: { badge: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200', dot: 'bg-orange-500' },
};

export function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('h-6 gap-1.5 rounded-full px-2.5 font-medium', TONES[tone].badge, className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', TONES[tone].dot)} />
      {children}
    </Badge>
  );
}

export function RegistrationStatusBadge({ status }: { status: ActiveRegistrationStatus }) {
  const s = registrationStatus[status];
  return <ToneBadge tone={s.tone}>{s.label}</ToneBadge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const s = requestStatus[status];
  return <ToneBadge tone={s.tone}>{s.label}</ToneBadge>;
}

export function UrgencyBadge({ urgency }: { urgency: SupportRequest['urgency'] }) {
  if (urgency === 'normal') return <span className="text-sm text-muted-foreground">{urgencyLabel.normal}</span>;
  return (
    <ToneBadge tone={urgencyTone[urgency]}>
      {urgency === 'urgent' && <AlertTriangleIcon aria-hidden className="size-3" />}
      {urgencyLabel[urgency]}
    </ToneBadge>
  );
}

/** "Due 21 Nov" with a warning style when overdue or close. Only for requests still being worked on. */
export function NeededBy({ neededBy, active }: { neededBy?: string; active: boolean }) {
  const s = neededByState(neededBy);
  if (!s) return <span className="text-sm text-muted-foreground">No date</span>;
  if (!active) return <span className="text-sm text-muted-foreground">{s.label}</span>;
  const text =
    s.state === 'overdue'
      ? `Overdue · ${s.label}`
      : s.state === 'today'
        ? 'Due today'
        : s.state === 'soon'
          ? `In ${s.days} day${s.days === 1 ? '' : 's'} · ${s.label}`
          : s.label;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm whitespace-nowrap',
        s.state === 'overdue' && 'font-medium text-red-700 dark:text-red-300',
        (s.state === 'today' || s.state === 'soon') && 'font-medium text-orange-800 dark:text-orange-300',
      )}
    >
      {(s.state === 'overdue' || s.state === 'today') && <CalendarClockIcon aria-hidden className="size-4" />}
      {text}
    </span>
  );
}
