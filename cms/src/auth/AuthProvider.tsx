import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, UserRole } from '../types/auth';
import { loginApi, logoutApi, refreshTokenApi, fetchMe } from '../api/authEndpoints';
import { setAccessTokenGetter, setAccessTokenSetter } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Module-level access token — never stored in localStorage */
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire up the Axios interceptor access token getter/setter
  useEffect(() => {
    setAccessTokenGetter(getAccessToken);
    setAccessTokenSetter(setAccessToken);
  }, []);

  // Silent refresh on mount
  useEffect(() => {
    let cancelled = false;
    let tokenSet = false;

    async function tryRefresh() {
      try {
        const resp = await refreshTokenApi();
        if (cancelled) return;
        setAccessToken(resp.access_token);
        tokenSet = true;
        const me = await fetchMe();
        if (cancelled) {
          // Component unmounted between setting token and fetching user — clean up
          setAccessToken(null);
          return;
        }
        setUser(me);
      } catch {
        if (tokenSet) setAccessToken(null); // clear inconsistent token state
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for session expiry events dispatched by the Axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Session idle timeout — auto-logout after inactivity while authenticated
  useEffect(() => {
    if (!user) return;
    const timeoutMs = Number(
      (import.meta.env.VITE_IDLE_TIMEOUT_MS as string | undefined) ?? 30 * 60 * 1000,
    );
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }, timeoutMs);
    };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await loginApi({ email: email.trim().toLowerCase(), password });
    setAccessToken(resp.access_token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors on logout
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
