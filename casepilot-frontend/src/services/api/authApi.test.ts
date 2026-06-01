import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_API_BASE_URL: 'http://localhost:5265/api' } } });

describe('authApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
  });

  describe('loginStep1', () => {
    it('should send POST to /auth/login and return verification token', async () => {
      const mockResponse = {
        requiresVerification: true,
        verificationToken: 'verify-token-abc',
        maskedEmail: 't***t@test.com',
        loginData: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { loginStep1 } = await import('../../services/api/authApi');
      const result = await loginStep1({ email: 'test@test.com', password: 'password123' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.email).toBe('test@test.com');
      expect(body.password).toBe('password123');

      expect(result.requiresVerification).toBe(true);
      expect(result.verificationToken).toBe('verify-token-abc');
      expect(result.maskedEmail).toBe('t***t@test.com');
    });

    it('should throw error on invalid credentials (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        url: 'http://localhost:5265/api/auth/login',
        text: () => Promise.resolve(JSON.stringify({ message: 'Email sau parolă incorectă.' })),
      });

      const { loginStep1 } = await import('../../services/api/authApi');

      await expect(loginStep1({ email: 'wrong@test.com', password: 'wrong' }))
        .rejects.toThrow();
    });
  });

  describe('verifyLoginCode', () => {
    it('should send POST to /auth/verify-code and return auth user', async () => {
      const mockResponse = {
        id: '123',
        email: 'test@test.com',
        fullName: 'Test User',
        roles: ['User'],
        permissions: ['cases.view'],
        accessToken: 'jwt.access.token',
        refreshToken: 'refresh-token-value',
        accessTokenExpiration: '2026-12-31T23:59:59Z',
        sessionId: 'session-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { verifyLoginCode } = await import('../../services/api/authApi');
      const result = await verifyLoginCode({
        verificationToken: 'verify-token-abc',
        code: '123456',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/verify-code');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.verificationToken).toBe('verify-token-abc');
      expect(body.code).toBe('123456');

      expect(result.accessToken).toBe('jwt.access.token');
      expect(result.roles).toContain('User');
    });
  });

  describe('registerUser', () => {
    it('should send POST to /auth/register with user data', async () => {
      const mockResponse = {
        id: '456',
        email: 'new@test.com',
        fullName: 'New User',
        roles: ['User'],
        permissions: ['cases.view'],
        accessToken: 'new.jwt.token',
        refreshToken: 'new-refresh-token',
        accessTokenExpiration: '2026-12-31T23:59:59Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { registerUser } = await import('../../services/api/authApi');
      const result = await registerUser({
        email: 'new@test.com',
        password: 'securepass',
        fullName: 'New User',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/register');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.email).toBe('new@test.com');
      expect(body.password).toBe('securepass');
      expect(body.fullName).toBe('New User');

      expect(result.accessToken).toBe('new.jwt.token');
    });

    it('should throw error when email already exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Un utilizator cu acest email există deja.' })),
      });

      const { registerUser } = await import('../../services/api/authApi');

      await expect(registerUser({
        email: 'existing@test.com',
        password: 'pass',
        fullName: 'Test',
      })).rejects.toThrow('Un utilizator cu acest email există deja.');
    });
  });

  describe('refreshAccessToken', () => {
    it('should send POST to /auth/refresh with refresh token', async () => {
      const mockResponse = {
        id: '123',
        email: 'test@test.com',
        fullName: 'Test User',
        roles: ['User'],
        permissions: [],
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
        accessTokenExpiration: '2026-12-31T23:59:59Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { refreshAccessToken } = await import('../../services/api/authApi');
      const result = await refreshAccessToken('old-refresh-token');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/refresh');

      const body = JSON.parse(options.body);
      expect(body.refreshToken).toBe('old-refresh-token');

      expect(result.accessToken).toBe('new.access.token');
      expect(result.refreshToken).toBe('new.refresh.token');
    });
  });

  describe('forgotPassword', () => {
    it('should send POST to /auth/forgot-password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Link trimis.' }),
      });

      const { forgotPassword } = await import('../../services/api/authApi');
      const result = await forgotPassword('user@test.com');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/forgot-password');
      expect(options.method).toBe('POST');

      expect(result.message).toBe('Link trimis.');
    });
  });

  describe('resetPassword', () => {
    it('should send POST to /auth/reset-password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Parola resetată.' }),
      });

      const { resetPassword } = await import('../../services/api/authApi');
      const result = await resetPassword('reset-token', 'newPass123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/reset-password');

      const body = JSON.parse(options.body);
      expect(body.token).toBe('reset-token');
      expect(body.newPassword).toBe('newPass123');

      expect(result.message).toBe('Parola resetată.');
    });
  });
});
