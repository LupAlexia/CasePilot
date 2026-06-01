import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: string;
  sessionId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  updateTokens: (accessToken: string, refreshToken: string, expiration: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AUTH_STORAGE_KEY = 'casepilot:auth:user';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    const storedUser = loadStoredUser();

    // Revoke the refresh token server-side (best-effort, fire-and-forget)
    if (storedUser?.accessToken && storedUser?.refreshToken) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5265/api';
      fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedUser.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: storedUser.refreshToken }),
      }).catch(() => { /* best effort */ });
    }

    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateTokens = useCallback((accessToken: string, refreshToken: string, expiration: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, accessToken, refreshToken, accessTokenExpiration: expiration };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Inactivity detection ──────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, hasPermission, updateTokens, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
