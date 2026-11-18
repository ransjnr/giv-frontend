import type { RegistrationStatus, RequestStatus } from '@/api/schema';

/*
 * Staff-facing wording for statuses. (Students see their own wording in the student portal.)
 * `tone` picks the badge colour; see components/StatusBadge.tsx.
 */
export type Tone = 'new' | 'progress' | 'contacted' | 'done' | 'muted' | 'danger' | 'warning';

export type ActiveRegistrationStatus = Exclude<RegistrationStatus, 'draft'>;

export const registrationStatus: Record<
  ActiveRegistrationStatus,
  { label: string; tone: Tone; description: string }
> = {
  submitted: {
    label: 'New',
    tone: 'new',
    description: 'Sent by the student. Nobody has started reviewing it yet.',
  },
  in_review: {
    label: 'In review',
    tone: 'progress',
    description: 'An officer is going through the details.',
  },
  contacted: {
    label: 'Contacted',
    tone: 'contacted',
    description: 'GIV has spoken to the student to agree a support plan.',
  },
  support_active: {
    label: 'Support active',
    tone: 'done',
    description: 'The support plan is in place.',
  },
};

export const REGISTRATION_FLOW: ActiveRegistrationStatus[] = ['submitted', 'in_review', 'contacted', 'support_active'];

export const nextRegistrationStatus = (s: ActiveRegistrationStatus): ActiveRegistrationStatus | null =>
  REGISTRATION_FLOW[REGISTRATION_FLOW.indexOf(s) + 1] ?? null;

/** Suggested notes to the student for each step. Officers can edit or clear them. */
export const suggestedNotes: Partial<Record<ActiveRegistrationStatus, string>> = {
  in_review: 'Thank you for registering. An officer is going through your details this week.',
  contacted: "We've spoken with you about your support plan. We'll confirm the arrangements soon.",
  support_active: 'Your support plan is in place. Contact us any time your needs change.',
};

export const requestStatus: Record<RequestStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'new' },
  in_progress: { label: 'In progress', tone: 'progress' },
  resolved: { label: 'Resolved', tone: 'done' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
};

export const urgencyTone = { urgent: 'danger', soon: 'warning', normal: 'muted' } as const satisfies Record<string, Tone>;
export const urgencyLabel = { urgent: 'Urgent', soon: 'Soon', normal: 'No rush' } as const;
