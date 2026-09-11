// Tracks landing context (referral username, referral code, landing URL,
// referrer) so signup attribution survives the getartcraft.com →
// app.getartcraft.com hop. Values are persisted to cookies scoped to the apex
// domain (shared across subdomains) plus localStorage as a fallback for
// environments where the apex cookie isn't available (eg. localhost).
//
// First visit wins for landing URL / referrer; latest visit wins for referral
// attribution (`?u=` / `?r=`) so a fresh share link gets credit.

const REFERRAL_USERNAME_KEY = "referral_username";
const REFERRAL_CODE_KEY = "referral_code";
const LANDING_URL_KEY = "referral_landing_url";
const REFERRER_KEY = "referral_referrer";

const URL_MAX_LENGTH = 1024;
const REFERRAL_CODE_MAX_LENGTH = 30;
const COOKIE_MAX_AGE_DAYS = 90;
const APEX_DOMAINS = ["getartcraft.com"];

/**
 * Capture referral username (`?u=`), referral code (`?r=`), landing URL
 * (`window.location.href`), and referrer (`document.referrer`).
 *
 * - Referral username / code: a fresh `?u=` / `?r=` always wins so the latest
 *   referrer gets credit, but a page load without the param leaves the
 *   existing value alone.
 * - Landing URL and referrer: first visit wins, so the original entry point
 *   survives navigation within and between getartcraft.com and
 *   app.getartcraft.com.
 */
export function captureLandingContext(): void {
  try {
    const params = new URLSearchParams(window.location.search);

    const rawReferralUsername = params.get("u");
    const sanitizedReferralUsername = rawReferralUsername
      ? sanitizeReferralUsername(rawReferralUsername)
      : undefined;
    if (sanitizedReferralUsername) {
      persist(REFERRAL_USERNAME_KEY, sanitizedReferralUsername);
    }

    const rawReferralCode = params.get("r");
    const sanitizedReferralCode = rawReferralCode
      ? sanitizeReferralCode(rawReferralCode)
      : undefined;
    if (sanitizedReferralCode) {
      persist(REFERRAL_CODE_KEY, sanitizedReferralCode);
    }

    const landingUrl = sanitizeUrl(window.location.href);
    if (landingUrl && !getLandingUrl()) {
      persist(LANDING_URL_KEY, landingUrl);
    }

    const referrer = sanitizeUrl(document.referrer);
    if (referrer && !getReferrer()) {
      persist(REFERRER_KEY, referrer);
    }
  } catch (e) {
    console.warn("Failed to capture landing context", e);
  }
}

export function getReferralUsername(): string | undefined {
  const stored = read(REFERRAL_USERNAME_KEY);
  return stored ? sanitizeReferralUsername(stored) || undefined : undefined;
}

export function getReferralCode(): string | undefined {
  const stored = read(REFERRAL_CODE_KEY);
  return stored ? sanitizeReferralCode(stored) || undefined : undefined;
}

export function getLandingUrl(): string | undefined {
  return read(LANDING_URL_KEY);
}

export function getReferrer(): string | undefined {
  return read(REFERRER_KEY);
}

function sanitizeReferralUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

function sanitizeReferralCode(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "")
    .slice(0, REFERRAL_CODE_MAX_LENGTH);
}

function sanitizeUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, URL_MAX_LENGTH);
}

function persist(key: string, value: string): void {
  writeCookie(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may throw in private mode — cookie still covers us.
  }
}

function read(key: string): string | undefined {
  const fromCookie = readCookie(key);
  if (fromCookie) return fromCookie;

  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeCookie(key: string, value: string): void {
  const maxAgeSeconds = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domainAttr = getApexCookieDomainAttr();
  document.cookie = `${key}=${encodeURIComponent(
    value,
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}${domainAttr}`;
}

function readCookie(key: string): string | undefined {
  const prefix = `${key}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(prefix.length)) || undefined;
}

function getApexCookieDomainAttr(): string {
  const hostname = window.location.hostname;
  const apex = APEX_DOMAINS.find(
    (d) => hostname === d || hostname.endsWith(`.${d}`),
  );
  return apex ? `; Domain=.${apex}` : "";
}
