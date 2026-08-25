import type { FakeStore, FakeUser } from "./state";

/**
 * Sessions, mirroring the real backend: an HS256 JWT returned as `signed_session` in the body
 * and set as a `session` cookie; accepted back as that cookie or as a `session` header (cookie
 * wins). The signature is real HMAC over a constant secret — this server protects nothing.
 */

export const SESSION_COOKIE_NAME = "session";
export const SESSION_HEADER_NAME = "session";

const SIGNING_SECRET = "artcraft-api-fake-development-only";
const COOKIE_MAX_AGE_SECONDS = 630_720_000;

let counter = 0;

export async function startSession(store: FakeStore, user: FakeUser): Promise<string> {
  counter += 1;
  const signedSession = await signJwt({
    session_token: `session_fake${String(counter).padStart(6, "0")}`,
    user_token: user.userToken,
    version: "3",
  });
  store.sessions.set(signedSession, user.userToken);
  return signedSession;
}

export function endSession(store: FakeStore, signedSession: string | undefined): void {
  if (signedSession !== undefined) store.sessions.delete(signedSession);
}

export function currentSignedSession(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return request.headers.get(SESSION_HEADER_NAME) ?? undefined;
}

export function currentUser(store: FakeStore, request: Request): FakeUser | undefined {
  const signedSession = currentSignedSession(request);
  if (signedSession === undefined) return undefined;
  const userToken = store.sessions.get(signedSession);
  return userToken === undefined ? undefined : store.usersByToken.get(userToken);
}

export function sessionCookieHeader(signedSession: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedSession)}; Path=/; Max-Age=${String(COOKIE_MAX_AGE_SECONDS)}; SameSite=Lax`;
}

export function clearedSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

async function signJwt(payload: Record<string, string>): Promise<string> {
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${base64Url(new Uint8Array(signature))}`;
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
