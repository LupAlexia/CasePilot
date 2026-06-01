import { API_BASE_URL } from './config'
import { getAuthHeaders } from './authHeaders'

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = 'A apărut o eroare.'
    try {
      const err = await response.json()
      if (err?.message) message = err.message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function updateProfile(fullName: string): Promise<{ fullName: string }> {
  return request('PUT', '/users/me', { fullName })
}

export async function getPreferences(): Promise<{ hearingNotificationsEnabled: boolean; createdAt: string }> {
  return request('GET', '/users/me/preferences')
}

export async function updatePreferences(hearingNotificationsEnabled: boolean): Promise<void> {
  return request('PUT', '/users/me/preferences', { hearingNotificationsEnabled })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request('POST', '/auth/change-password', { currentPassword, newPassword })
}

export interface SessionInfo {
  id: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivityAt: string
  isCurrent: boolean
}

export async function getSessions(): Promise<SessionInfo[]> {
  return request('GET', '/auth/sessions')
}

export async function revokeSession(sessionId: string): Promise<void> {
  return request('DELETE', `/auth/sessions/${sessionId}`)
}
