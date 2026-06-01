import { getCookie, getJsonCookie, setCookie, setJsonCookie } from './cookieStore';

const CONSENT_COOKIE = 'casepilot_cookie_consent';
const ACTIVITY_COOKIE = 'casepilot_activity';
const PREFERENCES_COOKIE = 'casepilot_preferences';

export type CookieConsent = 'accepted' | 'rejected';

export interface UserActivity {
  firstSeenAt: string;
  lastSeenAt: string;
  lastPath: string;
  pageViews: number;
  clickCount: number;
  scrollDepth: number;
}

export interface UserPreferences {
  casesDefaultView: 'table' | 'statistics';
  emailNotifications: boolean;
  reminderNotifications: boolean;
  lastUpdatedAt: string;
}

const defaultPreferences: UserPreferences = {
  casesDefaultView: 'table',
  emailNotifications: true,
  reminderNotifications: true,
  lastUpdatedAt: new Date().toISOString()
};

export function getCookieConsent(): CookieConsent | null {
  const value = getCookie(CONSENT_COOKIE);
  if (value === 'accepted' || value === 'rejected') return value;
  return null;
}

export function hasAcceptedCookies(): boolean {
  return getCookieConsent() === 'accepted';
}

export function setCookieConsent(consent: CookieConsent): void {
  setCookie(CONSENT_COOKIE, consent, { days: 365 });
}

export function getPreferences(): UserPreferences {
  return getJsonCookie<UserPreferences>(PREFERENCES_COOKIE) ?? defaultPreferences;
}

export function setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
  if (!hasAcceptedCookies()) return;

  const current = getPreferences();
  setJsonCookie<UserPreferences>(
    PREFERENCES_COOKIE,
    {
      ...current,
      [key]: value,
      lastUpdatedAt: new Date().toISOString()
    },
    { days: 365 }
  );
}

export function trackPageView(path: string): void {
  if (!hasAcceptedCookies()) return;

  const now = new Date().toISOString();
  const current = getJsonCookie<UserActivity>(ACTIVITY_COOKIE);

  const next: UserActivity = {
    firstSeenAt: current?.firstSeenAt ?? now,
    lastSeenAt: now,
    lastPath: path,
    pageViews: (current?.pageViews ?? 0) + 1,
    clickCount: current?.clickCount ?? 0,
    scrollDepth: current?.scrollDepth ?? 0
  };

  setJsonCookie(ACTIVITY_COOKIE, next, { days: 30 });
}

export function trackClick(): void {
  if (!hasAcceptedCookies()) return;

  const now = new Date().toISOString();
  const current = getJsonCookie<UserActivity>(ACTIVITY_COOKIE);
  if (!current) {
    trackPageView(window.location.pathname);
    return;
  }

  setJsonCookie<UserActivity>(
    ACTIVITY_COOKIE,
    {
      ...current,
      lastSeenAt: now,
      clickCount: current.clickCount + 1
    },
    { days: 30 }
  );
}

export function trackScrollDepth(depth: number): void {
  if (!hasAcceptedCookies()) return;

  const current = getJsonCookie<UserActivity>(ACTIVITY_COOKIE);
  if (!current) return;

  if (depth <= current.scrollDepth) return;

  setJsonCookie<UserActivity>(
    ACTIVITY_COOKIE,
    {
      ...current,
      scrollDepth: Math.min(100, Math.max(0, Math.round(depth))),
      lastSeenAt: new Date().toISOString()
    },
    { days: 30 }
  );
}

export function markLastSeen(): void {
  if (!hasAcceptedCookies()) return;

  const current = getJsonCookie<UserActivity>(ACTIVITY_COOKIE);
  if (!current) return;

  setJsonCookie<UserActivity>(
    ACTIVITY_COOKIE,
    {
      ...current,
      lastSeenAt: new Date().toISOString()
    },
    { days: 30 }
  );
}
