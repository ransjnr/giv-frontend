import type {
  AdminStats,
  RegistrationList,
  RegistrationListQuery,
  RequestListQuery,
  RequestSummary,
  Paged,
  StaffLoginResponse,
  StaffMember,
} from './admin';
import type { RegistrationRecord, RegistrationStatus, StudentRecord, SupportRequest } from './schema';

/*
 * The only place the dashboard talks to the server (pwd-giv-backend, /api/admin/*).
 * VITE_API_URL is the API's address; without it, the local backend is used.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/+$/, '');
const SESSION_KEY = 'giv.session';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type StoredSession = { token: string; expiresAt: string; staff: StaffMember };

/** The staff session lives in sessionStorage: it ends when the browser tab closes. */
export const session = {
  get(): StoredSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },
  set(s: StoredSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  },
  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  },
};

/** Fired when the server says the session is no longer valid, so the app can sign out. */
export const SESSION_ENDED_EVENT = 'giv:session-ended';

type Query = Record<string, string | number | undefined | null>;

async function request<T>(path: string, init: { method?: string; body?: unknown; query?: Query } = {}): Promise<T> {
  const token = session.get()?.token;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  const url = `${BASE_URL}/api/admin${path}${qs.size ? `?${qs}` : ''}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && path !== '/auth/login') window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    throw new ApiError(body?.message ?? 'Something went wrong. Please try again.', res.status);
  }
  return body as T;
}

export type RegistrationDetail = { student: StudentRecord; registration: Omit<RegistrationRecord, 'draft'> };
export type RequestDetail = { request: SupportRequest; student: StudentRecord };

export const api = {
  login: (email: string, password: string) =>
    request<StaffLoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request<null>('/auth/logout', { method: 'POST' }),
  me: () => request<{ staff: StaffMember }>('/me'),

  stats: () => request<AdminStats>('/stats'),

  registrations: (q: RegistrationListQuery) => request<RegistrationList>('/registrations', { query: q }),
  registration: (studentId: string) => request<RegistrationDetail>(`/registrations/${encodeURIComponent(studentId)}`),
  setRegistrationStatus: (studentId: string, status: Exclude<RegistrationStatus, 'draft'>, note?: string) =>
    request<RegistrationDetail['registration']>(`/registrations/${encodeURIComponent(studentId)}/status`, {
      method: 'POST',
      body: { status, ...(note ? { note } : {}) },
    }),

  requests: (q: RequestListQuery) => request<Paged<RequestSummary>>('/requests', { query: q }),
  request: (id: string) => request<RequestDetail>(`/requests/${encodeURIComponent(id)}`),
  reply: (id: string, body: string) =>
    request<SupportRequest>(`/requests/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { body } }),
  setRequestStatus: (id: string, status: 'open' | 'in_progress' | 'resolved') =>
    request<SupportRequest>(`/requests/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }),
};
