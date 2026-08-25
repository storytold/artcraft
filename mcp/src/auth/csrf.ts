/**
 * Double-submit CSRF protection for the consent form. GET /authorize sets a random token in a
 * cookie and echoes it in a hidden field; POST requires both and compares them in constant
 * time. This blocks login CSRF — a hostile page cannot submit our form with its own account's
 * credentials and complete an authorization the victim's client would then trust.
 *
 * The cookie is not `__Host-` prefixed because local development runs over plain http; it is
 * `Secure` whenever the page itself was served over https.
 */

export const CSRF_COOKIE_NAME = "artcraft_consent";
const TOKEN_BYTES = 32;
const COOKIE_MAX_AGE_SECONDS = 15 * 60;

export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return base64Url(bytes);
}

export function csrfCookieHeader(token: string, secure: boolean, path = "/authorize"): string {
  const attributes = [
    `${CSRF_COOKIE_NAME}=${token}`,
    `Path=${path}`,
    `Max-Age=${String(COOKIE_MAX_AGE_SECONDS)}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function readCsrfCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CSRF_COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

/** True only when both values are present, well-formed, and identical. */
export function csrfTokensMatch(
  cookieValue: string | undefined,
  formValue: string | undefined,
): boolean {
  if (!cookieValue || !formValue) return false;
  if (!/^[A-Za-z0-9_-]{43}$/.test(cookieValue) || !/^[A-Za-z0-9_-]{43}$/.test(formValue)) {
    return false;
  }
  return constantTimeEquals(cookieValue, formValue);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
