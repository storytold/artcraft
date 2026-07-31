/**
 * Authentication, session, and account management.
 *
 * These endpoints use three different error dialects in the real backend and
 * the frontend reads a different field from each, so they are reproduced
 * exactly: login sends `error_type` + `error_message`, create_account sends
 * `error_type` + `error_fields`, password reset sends `kind` + `message`, and
 * everything else uses the shared `error_code` envelope.
 */

import {
  clearedSessionCookieHeader,
  currentSignedSession,
  currentUser,
  endSession,
  sessionCookieHeader,
  startSession,
  visitorCookieHeaderIfMissing,
} from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import type { UserRecord } from "../state/entities.ts";
import { md5, registerUser } from "../state/seed.ts";
import { store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { sessionUserPayload, userProfilePayload } from "../wire/users.ts";
import { config } from "../config.ts";

const RESERVED_USERNAMES = new Set(["demo", "admin", "test", "dev", "root", "artcraft"]);

export function registerSessionRoutes(router: Router): void {
  for (const prefix of ["/v1", ""]) {
    router.get(`${prefix}/session`, getSession);
    router.post(`${prefix}/login`, login);
    router.post(`${prefix}/logout`, logout);
    router.post(`${prefix}/create_account`, createAccount);
  }

  router.get("/v1/session_token", getSessionToken);
  router.post("/v1/accounts/google_sso", googleSso);
  router.get("/v1/user/:username/profile", getProfile);
  router.post("/v1/user/change_password", changePassword);
  router.post("/v1/user/edit_email", editEmail);
  router.post("/v1/user/edit_username", editUsername);
  router.post("/v1/web_referrals/record", recordWebReferral);
  router.post("/v1/password_reset/request", requestPasswordReset);
  router.post("/v1/password_reset/redeem", redeemPasswordReset);
}

function getSession(context: RequestContext): HttpResult {
  const user = currentUser(context);
  const payload = user === undefined
    ? { success: true, logged_in: false, user: null }
    : { success: true, logged_in: true, user: sessionUserPayload(user) };

  const result = new HttpResult(200, payload);
  const visitorCookie = visitorCookieHeaderIfMissing(context);
  return visitorCookie === undefined ? result : result.withHeader("Set-Cookie", visitorCookie);
}

function login(context: RequestContext): HttpResult {
  const body = context.json<{ username_or_email: string; password: string }>();
  const user = findUserByUsernameOrEmail(body.username_or_email);

  if (user === undefined || user.password !== body.password) {
    return new HttpResult(401, {
      success: false,
      error_type: "InvalidCredentials",
      error_message: "invalid credentials",
    });
  }

  const signedSession = startSession(user);
  return new HttpResult(200, { success: true, signed_session: signedSession }).withHeader(
    "Set-Cookie",
    sessionCookieHeader(signedSession),
  );
}

function logout(context: RequestContext): HttpResult {
  endSession(currentSignedSession(context));
  return success().withHeader("Set-Cookie", clearedSessionCookieHeader());
}

function createAccount(context: RequestContext): HttpResult {
  const body = context.json<{
    username: string;
    password: string;
    password_confirmation: string;
    email_address: string;
  }>();

  const username = (body.username ?? "").trim();
  const email = (body.email_address ?? "").trim();

  if (username.length < 3) {
    return badInput("BadInput", { username: "username is too short" });
  }
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return badInput("UsernameReserved", { username: "username is reserved" });
  }
  if (store.usersByUsername.has(username.toLowerCase())) {
    return badInput("UsernameTaken", { username: "username is taken" });
  }
  if (!email.includes("@")) {
    return badInput("BadInput", { email_address: "invalid email address" });
  }
  if (body.password !== body.password_confirmation) {
    return badInput("BadInput", { password: "passwords do not match" });
  }
  if ((body.password ?? "").length < 8) {
    return badInput("BadInput", { password: "password is too short" });
  }

  const user: UserRecord = {
    userToken: makeToken(TOKEN_PREFIX.user),
    username: username.toLowerCase(),
    displayName: username,
    emailAddress: email,
    password: body.password ?? "",
    gravatarHash: md5(email),
    featureFlags: ["explore_media", "studio", "upload_3d", "referrals", "api_key"],
    defaultAvatar: { image_index: 4, color_index: 2 },
    bankedCredits: config.demoCredits,
    monthlyCredits: 0,
    subscriptionSlug: undefined,
    createdAt: nowIso(),
  };

  registerUser(user);
  const signedSession = startSession(user);

  return new HttpResult(200, { success: true, signed_session: signedSession }).withHeader(
    "Set-Cookie",
    sessionCookieHeader(signedSession),
  );
}

/**
 * There is no Google to talk to, so any credential logs in the demo user. This
 * keeps the SSO button working rather than dead-ending a developer who clicks it.
 */
function googleSso(context: RequestContext): HttpResult {
  const body = context.json<{ google_credential: string }>();
  if ((body.google_credential ?? "").length === 0) {
    return failure(400, "BadInput", "google_credential is required");
  }

  const user = [...store.usersByToken.values()][0];
  if (user === undefined) {
    return failure(500, "InternalError", "fake-storyteller-web has no seeded user to sign in as");
  }

  const signedSession = startSession(user);
  return new HttpResult(200, {
    success: true,
    signed_session: signedSession,
    username_not_yet_customized: false,
    maybe_user_display_name: user.displayName,
  }).withHeader("Set-Cookie", sessionCookieHeader(signedSession));
}

function getSessionToken(context: RequestContext): HttpResult {
  return new HttpResult(200, { maybe_signed_session: currentSignedSession(context) ?? null });
}

function getProfile(context: RequestContext): HttpResult {
  const user = store.usersByUsername.get((context.params["username"] ?? "").toLowerCase());
  if (user === undefined) {
    return notFound();
  }
  return success({ user: userProfilePayload(user) });
}

function changePassword(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ password: string; password_confirmation: string }>();
  if (body.password !== body.password_confirmation) {
    return failure(400, "BadInput", "the passwords do not match");
  }
  if ((body.password ?? "").length < 8) {
    return failure(400, "BadInput", "password is too short");
  }

  user.password = body.password ?? "";
  return success();
}

function editEmail(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ email_address: string }>();
  if (!(body.email_address ?? "").includes("@")) {
    return failure(400, "BadInput", "bad email: invalid email address");
  }

  user.emailAddress = body.email_address ?? "";
  user.gravatarHash = md5(user.emailAddress);
  return success();
}

function editUsername(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ display_name: string }>();
  const displayName = (body.display_name ?? "").trim();
  if (displayName.length < 3) {
    return failure(400, "BadInput", "bad username: username is too short");
  }

  const existing = store.usersByUsername.get(displayName.toLowerCase());
  if (existing !== undefined && existing.userToken !== user.userToken) {
    return failure(400, "BadInput", "username is taken");
  }

  store.usersByUsername.delete(user.username);
  user.username = displayName.toLowerCase();
  user.displayName = displayName;
  store.usersByUsername.set(user.username, user);
  return success();
}

function recordWebReferral(): HttpResult {
  return success();
}

/** Always succeeds, matching the real handler's anti-enumeration behaviour. */
function requestPasswordReset(): HttpResult {
  return success();
}

/**
 * There is no email to read a token out of, so the fake accepts any non-empty
 * reset token and logs the user in as the demo user.
 */
function redeemPasswordReset(context: RequestContext): HttpResult {
  const body = context.json<{
    reset_token: string;
    new_password: string;
    new_password_validation: string;
  }>();

  if (body.new_password !== body.new_password_validation) {
    return new HttpResult(400, {
      success: false,
      kind: "PasswordsDoNotMatch",
      message: "The passwords do not match.",
    });
  }

  const user = [...store.usersByToken.values()][0];
  if ((body.reset_token ?? "").length === 0 || user === undefined) {
    return new HttpResult(400, {
      success: false,
      kind: "InvalidRedemption",
      message:
        "The redemption code is invalid, has already been redeemed, or has been replaced by a newer code.",
    });
  }

  user.password = body.new_password ?? "";
  const signedSession = startSession(user);
  return new HttpResult(200, { success: true, signed_session: signedSession }).withHeader(
    "Set-Cookie",
    sessionCookieHeader(signedSession),
  );
}

function findUserByUsernameOrEmail(usernameOrEmail: string | undefined): UserRecord | undefined {
  const needle = (usernameOrEmail ?? "").trim().toLowerCase();
  if (needle.length === 0) {
    return undefined;
  }

  if (needle.includes("@")) {
    for (const user of store.usersByToken.values()) {
      if (user.emailAddress.toLowerCase() === needle) {
        return user;
      }
    }
    return undefined;
  }

  return store.usersByUsername.get(needle);
}

function badInput(errorType: string, errorFields: Record<string, string>): HttpResult {
  return new HttpResult(400, { success: false, error_type: errorType, error_fields: errorFields });
}
