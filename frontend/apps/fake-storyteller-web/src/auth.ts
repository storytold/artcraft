/**
 * Session handling.
 *
 * The real backend issues an HS256 JWT, returns it as `signed_session` in the
 * body, and sets the same string as a `session` cookie. The frontend uses both:
 * the cookie normally, and a `session` header when cookies are unavailable. The
 * fake mirrors all three so no client path has to be special-cased.
 *
 * The signature is real HMAC but the secret is a constant in this file. That is
 * fine — this server has nothing to protect — and it keeps tokens inspectable.
 */

import { createHmac } from "node:crypto";
import type { RequestContext } from "./http/context.ts";
import type { UserRecord } from "./state/entities.ts";
import { store } from "./state/store.ts";
import { nowIso } from "./state/clock.ts";
import { makeToken, TOKEN_PREFIX } from "./state/tokens.ts";

const SESSION_COOKIE_NAME = "session";
const VISITOR_COOKIE_NAME = "visitor";
const SIGNING_SECRET = "fake-storyteller-web-development-only";
const COOKIE_MAX_AGE_SECONDS = 630_720_000;

/** Create a session for a user and register it. Returns the signed session string. */
export function startSession(user: UserRecord): string {
  const signedSession = signJwt({
    session_token: makeToken(TOKEN_PREFIX.appSession),
    user_token: user.userToken,
    version: "3",
  });

  store.sessionsBySignedSession.set(signedSession, {
    signedSession,
    userToken: user.userToken,
    createdAt: nowIso(),
  });

  return signedSession;
}

export function endSession(signedSession: string | undefined): void {
  if (signedSession !== undefined) {
    store.sessionsBySignedSession.delete(signedSession);
  }
}

/** The logged-in user for this request, or undefined. Cookie wins over header, as in the real backend. */
export function currentUser(context: RequestContext): UserRecord | undefined {
  const signedSession = currentSignedSession(context);
  if (signedSession === undefined) {
    return undefined;
  }

  const session = store.sessionsBySignedSession.get(signedSession);
  if (session === undefined) {
    return undefined;
  }

  return store.usersByToken.get(session.userToken);
}

export function currentSignedSession(context: RequestContext): string | undefined {
  return context.cookie(SESSION_COOKIE_NAME) ?? context.sessionHeader();
}

/** `Set-Cookie` value establishing the session. Not `Secure`, because dev runs over http. */
export function sessionCookieHeader(signedSession: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedSession)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearedSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/** The anonymous-visitor cookie the real `/v1/session` sets when one is absent. */
export function visitorCookieHeaderIfMissing(context: RequestContext): string | undefined {
  if (context.cookie(VISITOR_COOKIE_NAME) !== undefined) {
    return undefined;
  }
  const visitor = signJwt({ visitor_token: makeToken(TOKEN_PREFIX.appSession), version: "1" });
  return `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitor)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function signJwt(payload: Record<string, string>): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", SIGNING_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
