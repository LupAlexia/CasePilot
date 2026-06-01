export interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const { days = 180, path = '/', sameSite = 'Lax', secure = window.location.protocol === 'https:' } = options;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Expires=${expires}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : ''
  ]
    .filter(Boolean)
    .join('; ');
}

export function getCookie(name: string): string | null {
  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split('; ');

  for (const part of parts) {
    if (part.startsWith(encodedName)) {
      return decodeURIComponent(part.slice(encodedName.length));
    }
  }

  return null;
}

export function removeCookie(name: string, path = '/'): void {
  document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}; SameSite=Lax`;
}

export function setJsonCookie<T>(name: string, value: T, options?: CookieOptions): void {
  setCookie(name, JSON.stringify(value), options);
}

export function getJsonCookie<T>(name: string): T | null {
  const raw = getCookie(name);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
