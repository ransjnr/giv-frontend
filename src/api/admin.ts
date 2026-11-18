/*
 * COPY of pwd-giv-backend/src/contract/admin.ts (the master). Change the backend copy first, then copy it here.
 */
import { z } from 'zod';
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  STATUSES,
  URGENCY,
  type RegistrationStatus,
  type RequestStatus,
  type SupportRequest,
} from './schema';

/*
 * ADMIN CONTRACT: owned by the admin team (GIV admin frontend + src/modules/admin).
 * Request and response shapes used only by /api/admin/*. The admin frontend copies this file
 * (giv-frontend/src/api/admin.ts). Shared shapes stay in ./schema.ts. See docs/api-admin.md.
 */

// ───────── Staff ─────────

export const STAFF_ROLES = ['officer', 'admin'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffMember = { id: string; email: string; fullName: string; role: StaffRole };

export const staffLoginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
});

/** POST /api/admin/auth/login response. */
export type StaffLoginResponse = { token: string; expiresAt: string; staff: StaffMember };

// ───────── Lists (shared paging) ─────────

const page = z.coerce.number().int().min(1).max(10_000).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(25);
const dir = z.enum(['asc', 'desc']).default('desc');

/** Every list response. `total` is the number of matches across all pages. */
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

// ───────── Registrations ─────────

/** GET /api/admin/registrations query string. */
export const registrationListQuery = z.object({
  status: z.enum(STATUSES).exclude(['draft']).optional(),
  q: z.string().trim().max(100).optional(),
  college: z.string().trim().max(200).optional(),
  level: z.string().trim().max(20).optional(),
  sort: z.enum(['updated', 'submitted', 'name']).default('updated'),
  dir,
  page,
  pageSize,
});
/** What a client sends: every field optional (the server applies the defaults). */
export type RegistrationListQuery = Partial<z.output<typeof registrationListQuery>>;

/** One row of the registrations table. */
export type RegistrationSummary = {
  studentId: string;
  fullName: string;
  programme: string;
  college: string;
  level: string;
  status: RegistrationStatus;
  submittedAt: string;
  updatedAt: string;
  confirmedAt?: string;
};

/** The registrations list, plus the values the filters can offer. */
export type RegistrationList = Paged<RegistrationSummary> & {
  facets: { colleges: string[]; levels: string[] };
};

/** POST /api/admin/registrations/:studentId/status. The note is shown to the student. */
export const setRegistrationStatusSchema = z.object({
  status: z.enum(STATUSES).refine((s) => s !== 'draft', 'A registration cannot be moved back to draft'),
  note: z.string().trim().max(1000).optional(),
});

// ───────── Support requests ─────────

/** GET /api/admin/requests query string. `status=active` means open or in progress. */
export const requestListQuery = z.object({
  status: z.union([z.enum(REQUEST_STATUSES), z.literal('active')]).optional(),
  category: z.enum(REQUEST_CATEGORIES).optional(),
  urgency: z.enum(URGENCY).optional(),
  /** `awaiting=true`: only active requests where the student is waiting for GIV. */
  awaiting: z.enum(['true']).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['updated', 'created', 'neededBy', 'urgency']).default('updated'),
  dir,
  page,
  pageSize,
});
/** What a client sends: every field optional (the server applies the defaults). */
export type RequestListQuery = Partial<z.output<typeof requestListQuery>>;

/** One row of the requests queue. */
export type RequestSummary = Pick<
  SupportRequest,
  'id' | 'category' | 'title' | 'urgency' | 'neededBy' | 'status' | 'createdAt' | 'updatedAt'
> & {
  studentId: string;
  studentName: string;
  programme: string;
  messageCount: number;
  /** True when the student is waiting for GIV: no GIV reply yet, or the student wrote last. */
  awaitingReply: boolean;
  lastMessageAt?: string;
};

/** POST /api/admin/requests/:id/messages */
export const staffReplySchema = z.object({
  body: z.string().trim().min(1, 'Write a message before sending.').max(3000),
});

/** POST /api/admin/requests/:id/status. Only the student can withdraw. */
export const setRequestStatusSchema = z.object({ status: z.enum(['open', 'in_progress', 'resolved']) });

// ───────── Overview ─────────

export type ActivityItem = {
  kind: 'registration_submitted' | 'registration_updated' | 'request_created' | 'student_message';
  at: string;
  studentId: string;
  studentName: string;
  /** The request, for request activity. */
  requestId?: string;
  requestTitle?: string;
};

/** GET /api/admin/stats */
export type AdminStats = {
  registrations: Record<Exclude<RegistrationStatus, 'draft'>, number> & { total: number; submittedThisWeek: number };
  requests: Record<RequestStatus, number> & {
    /** Open or in progress, by urgency. */
    activeByUrgency: Record<(typeof URGENCY)[number], number>;
    /** Active requests waiting for a GIV reply. */
    awaitingReply: number;
    /** Active requests whose needed-by date has passed. */
    overdue: number;
    /** Active requests needed within the next 7 days. */
    dueThisWeek: number;
  };
  /** Active requests that need attention first: overdue, urgent or due soon. Up to 6. */
  attention: RequestSummary[];
  /** The latest student activity. Up to 12. */
  recent: ActivityItem[];
};
