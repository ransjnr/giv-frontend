import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, session, SESSION_ENDED_EVENT, type StoredSession } from '@/api/client';
import type { StaffMember } from '@/api/admin';

/** Why the last session ended, shown on the sign-in page. */
export type SignOutReason = 'signed_out' | 'expired';

type AuthState = {
  staff: StaffMember | null;
  signOutReason: SignOutReason | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: SignOutReason) => void;
};

const AuthContext = createContext<AuthState | null>(null);
const WARN_BEFORE_MS = 5 * 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [current, setCurrent] = useState<StoredSession | null>(() => {
    const s = session.get();
    return s && new Date(s.expiresAt).getTime() > Date.now() ? s : null;
  });
  const [signOutReason, setSignOutReason] = useState<SignOutReason | null>(null);

  const logout = useCallback(
    (reason: SignOutReason = 'signed_out') => {
      if (reason === 'signed_out') api.logout().catch(() => {});
      session.clear();
      qc.clear(); // never keep student data in memory after sign-out
      setCurrent(null);
      setSignOutReason(reason);
    },
    [qc],
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    session.set(res);
    setSignOutReason(null);
    setCurrent(res);
  }, []);

  // The server ended the session (expired, or signed out elsewhere).
  useEffect(() => {
    const onEnded = () => logout('expired');
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
  }, [logout]);

  // Warn five minutes before the session ends, then sign out when it does.
  useEffect(() => {
    if (!current) return;
    const left = new Date(current.expiresAt).getTime() - Date.now();
    const warn = setTimeout(
      () =>
        toast.warning('Your session ends in 5 minutes', {
          description: 'Finish what you are doing and sign in again to keep working.',
          duration: 60_000,
        }),
      Math.max(0, left - WARN_BEFORE_MS),
    );
    const end = setTimeout(() => logout('expired'), Math.max(0, left));
    return () => {
      clearTimeout(warn);
      clearTimeout(end);
    };
  }, [current, logout]);

  const value = useMemo(
    () => ({ staff: current?.staff ?? null, signOutReason, login, logout }),
    [current, signOutReason, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Wrap private routes. Sends signed-out staff to /login and back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { staff } = useAuth();
  const location = useLocation();
  if (!staff) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}
