import type { Registration, RegistrationStatus, RegistrationSummary, Staff, Student, SupportRequest, RequestStatus } from './types';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/+$/, '');
const key = 'ac.giv.session';
export const staffSession = { get: () => sessionStorage.getItem(key), set: (value: string) => sessionStorage.setItem(key, value), clear: () => sessionStorage.removeItem(key) };
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = staffSession.get();
  let response: Response;
  try { response = await fetch(baseUrl + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } }); }
  catch { throw new ApiError("We couldn't reach the Ability Connect server.", 0); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.message || 'Something went wrong. Please try again.', response.status);
  return body as T;
}

export const api = {
  login: (email: string, password: string) => request<{ token: string; staff: Staff }>('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/api/admin/auth/logout', { method: 'POST' }),
  me: () => request<{ staff: Staff }>('/api/admin/me'),
  registrations: (query = '') => request<RegistrationSummary[]>(`/api/admin/registrations${query}`),
  registration: (id: string) => request<{ student: Student; registration: Registration }>(`/api/admin/registrations/${encodeURIComponent(id)}`),
  setRegistrationStatus: (id: string, status: Exclude<RegistrationStatus, 'draft'>, note: string) => request<Registration>(`/api/admin/registrations/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status, note: note || undefined }) }),
  requests: (query = '') => request<SupportRequest[]>(`/api/admin/requests${query}`),
  request: (id: string) => request<{ request: SupportRequest; student: Student }>(`/api/admin/requests/${encodeURIComponent(id)}`),
  reply: (id: string, body: string) => request<SupportRequest>(`/api/admin/requests/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  setRequestStatus: (id: string, status: Exclude<RequestStatus, 'withdrawn'>) => request<SupportRequest>(`/api/admin/requests/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
};
