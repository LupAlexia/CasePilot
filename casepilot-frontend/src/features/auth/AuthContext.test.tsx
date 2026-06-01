import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, type AuthUser } from './AuthContext';

const AUTH_STORAGE_KEY = 'casepilot:auth:user';

const mockUser: AuthUser = {
  id: '123',
  email: 'test@test.com',
  fullName: 'Test User',
  roles: ['User'],
  permissions: ['cases.view', 'cases.create'],
  accessToken: 'jwt.access.token',
  refreshToken: 'refresh-token',
  accessTokenExpiration: '2026-12-31T23:59:59Z',
};

const mockAdminUser: AuthUser = {
  ...mockUser,
  id: '456',
  email: 'admin@test.com',
  roles: ['Admin'],
  permissions: ['cases.view', 'users.manage', 'audit.view'],
};

// Helper component that exposes auth context for testing
function TestConsumer({ onRender }: { onRender: (ctx: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onRender(auth);
  return (
    <div>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="is-admin">{String(auth.isAdmin)}</span>
      <button data-testid="login-btn" onClick={() => auth.login(mockUser)}>Login</button>
      <button data-testid="admin-login-btn" onClick={() => auth.login(mockAdminUser)}>Admin Login</button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

// Mock fetch for logout call
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with null user when no stored data', () => {
    let capturedAuth: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <TestConsumer onRender={(ctx) => { capturedAuth = ctx; }} />
      </AuthProvider>
    );

    expect(capturedAuth!.user).toBeNull();
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('should restore user from localStorage on mount', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer onRender={() => {}} />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email').textContent).toBe('test@test.com');
  });

  it('should login and store user in localStorage', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <AuthProvider>
        <TestConsumer onRender={() => {}} />
      </AuthProvider>
    );

    await user.click(screen.getByTestId('login-btn'));

    expect(screen.getByTestId('user-email').textContent).toBe('test@test.com');

    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)!);
    expect(stored.accessToken).toBe('jwt.access.token');
    expect(stored.refreshToken).toBe('refresh-token');
  });

  it('should logout and clear localStorage', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <AuthProvider>
        <TestConsumer onRender={() => {}} />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email').textContent).toBe('test@test.com');

    await user.click(screen.getByTestId('logout-btn'));

    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('should correctly detect admin role', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <AuthProvider>
        <TestConsumer onRender={() => {}} />
      </AuthProvider>
    );

    // Not admin before login
    expect(screen.getByTestId('is-admin').textContent).toBe('false');

    // Login as admin
    await user.click(screen.getByTestId('admin-login-btn'));
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
  });

  it('should correctly check permissions', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    let capturedAuth: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <TestConsumer onRender={(ctx) => { capturedAuth = ctx; }} />
      </AuthProvider>
    );

    expect(capturedAuth!.hasPermission('cases.view')).toBe(true);
    expect(capturedAuth!.hasPermission('cases.create')).toBe(true);
    expect(capturedAuth!.hasPermission('users.manage')).toBe(false);
  });

  it('should store accessToken and refreshToken in user object', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    let capturedAuth: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <TestConsumer onRender={(ctx) => { capturedAuth = ctx; }} />
      </AuthProvider>
    );

    expect(capturedAuth!.user!.accessToken).toBe('jwt.access.token');
    expect(capturedAuth!.user!.refreshToken).toBe('refresh-token');
    expect(capturedAuth!.user!.accessTokenExpiration).toBe('2026-12-31T23:59:59Z');
  });
});
