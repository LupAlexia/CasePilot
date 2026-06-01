const AUTH_STORAGE_KEY = 'casepilot:auth:user';

export function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return {};
    const user = JSON.parse(raw);
    if (!user.accessToken) return {};
    return {
      Authorization: `Bearer ${user.accessToken}`,
    };
  } catch {
    return {};
  }
}

export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user.accessToken ?? null;
  } catch {
    return null;
  }
}
