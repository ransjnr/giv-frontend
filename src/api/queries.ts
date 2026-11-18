import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RegistrationListQuery, RequestListQuery } from './admin';
import type { RegistrationStatus } from './schema';
import { api } from './client';

/** Query keys in one place, so mutations can refresh exactly what changed. */
export const keys = {
  stats: ['stats'] as const,
  registrations: (q?: RegistrationListQuery) => (q ? (['registrations', q] as const) : (['registrations'] as const)),
  registration: (id: string) => ['registration', id] as const,
  requests: (q?: RequestListQuery) => (q ? (['requests', q] as const) : (['requests'] as const)),
  request: (id: string) => ['request', id] as const,
};

export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: api.stats, refetchInterval: 60_000 });

export const useRegistrations = (q: RegistrationListQuery) =>
  useQuery({ queryKey: keys.registrations(q), queryFn: () => api.registrations(q), placeholderData: keepPreviousData });

export const useRegistration = (id: string) =>
  useQuery({ queryKey: keys.registration(id), queryFn: () => api.registration(id) });

export const useRequests = (q: RequestListQuery) =>
  useQuery({ queryKey: keys.requests(q), queryFn: () => api.requests(q), placeholderData: keepPreviousData });

export const useRequest = (id: string) =>
  useQuery({ queryKey: keys.request(id), queryFn: () => api.request(id), refetchInterval: 30_000 });

export function useSetRegistrationStatus(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { status: Exclude<RegistrationStatus, 'draft'>; note?: string }) =>
      api.setRegistrationStatus(studentId, v.status, v.note),
    onSuccess: (registration) => {
      qc.setQueryData(keys.registration(studentId), (old: { student: unknown } | undefined) =>
        old ? { ...old, registration } : old,
      );
      void qc.invalidateQueries({ queryKey: keys.registrations() });
      void qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useReply(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.reply(id, body),
    onSuccess: (request) => {
      qc.setQueryData(keys.request(id), (old: { student: unknown } | undefined) => (old ? { ...old, request } : old));
      void qc.invalidateQueries({ queryKey: keys.requests() });
      void qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useSetRequestStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: 'open' | 'in_progress' | 'resolved') => api.setRequestStatus(id, status),
    onSuccess: (request) => {
      qc.setQueryData(keys.request(id), (old: { student: unknown } | undefined) => (old ? { ...old, request } : old));
      void qc.invalidateQueries({ queryKey: keys.requests() });
      void qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}
