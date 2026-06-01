import { API_BASE_URL } from './config';
import { getAuthHeaders } from './authHeaders';
import type { AuthUser } from '../../features/auth/AuthContext';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyCodeRequest {
  verificationToken: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface LoginStepResponse {
  requiresVerification: boolean;
  verificationToken: string;
  maskedEmail: string;
  loginData: AuthUser | null;
}

export interface SessionEntry {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface SuspiciousUserEntry {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  reason: string;
  severityScore: number;
  detectedAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Parse the server error message first (works for all status codes)
    let message = 'A apărut o eroare.';
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          if (json.message) message = json.message;
          else if (json.title) message = json.title;
          else message = text.replace(/^"|"$/g, '');
        } catch {
          message = text.replace(/^"|"$/g, '');
        }
      }
    } catch { /* keep default */ }

    // For 401 on non-auth endpoints: session expired → clear & redirect
    if (response.status === 401) {
      const isAuthEndpoint = response.url.includes('/auth/login') || response.url.includes('/auth/register')
        || response.url.includes('/auth/verify-code');
      if (!isAuthEndpoint) {
        localStorage.removeItem('casepilot:auth:user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        throw new Error(message || 'Sesiunea a expirat. Vă rugăm să vă autentificați din nou.');
      }
    }

    if (response.status === 403) {
      throw new Error(message || 'Nu aveți permisiunea pentru această acțiune.');
    }

    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── 3-Way Authentication ────────────────────────────────

/** Step 1: Submit credentials → get verification token */
export async function loginStep1(data: LoginRequest): Promise<LoginStepResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<LoginStepResponse>(response);
}

/** Step 2: Submit OTP code → get full auth tokens */
export async function verifyLoginCode(data: VerifyCodeRequest): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthUser>(response);
}

/** Resend OTP code */
export async function resendVerificationCode(verificationToken: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationToken }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function registerUser(data: RegisterRequest): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthUser>(response);
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse<AuthUser>(response);
}

export async function logoutUser(refreshToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ refreshToken }),
  });
  await handleResponse(response);
}

// ── Password Recovery ───────────────────────────────────

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return handleResponse<{ message: string }>(response);
}

// ── Session Management ──────────────────────────────────

export async function getActiveSessions(): Promise<SessionEntry[]> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<SessionEntry[]>(response);
}

export async function revokeSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(response);
}

// ── Admin: Users ────────────────────────────────────────

export async function getAllUsers(): Promise<UserResponse[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<UserResponse[]>(response);
}

export async function deactivateUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}/deactivate`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(response);
}

export async function activateUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}/activate`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
  });
  await handleResponse(response);
}

// ── Admin: Audit Logs ───────────────────────────────────

export async function getAuditLogs(page = 1, pageSize = 50): Promise<AuditLogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs?page=${page}&pageSize=${pageSize}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<AuditLogEntry[]>(response);
}

// ── Admin: Suspicious Users ─────────────────────────────

export async function getSuspiciousUsers(): Promise<SuspiciousUserEntry[]> {
  const response = await fetch(`${API_BASE_URL}/admin/suspicious-users`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<SuspiciousUserEntry[]>(response);
}

export async function resolveSuspiciousUser(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/suspicious-users/${id}/resolve`,
    {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    }
  );
  await handleResponse(response);
}
