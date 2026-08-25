import { Hono } from "hono";

import {
  clearedSessionCookieHeader,
  currentSignedSession,
  currentUser,
  endSession,
  sessionCookieHeader,
  startSession,
} from "../session";
import { type FakeStore, type FakeUser, findUserByUsernameOrEmail } from "../state";

/**
 * Sign-in, sign-out, and session lookup — ported from `infra/fake-storyteller-web`
 * (routes/session.ts). Response shapes follow the spec snapshot exactly; the tests validate
 * every one of them against it. Login uses the backend's own error dialect
 * (`error_type` + `error_message`), everything else the shared `error_code` envelope.
 */
export function sessionRoutes(store: FakeStore): Hono {
  const app = new Hono();

  app.get("/v1/session", (c) => {
    const user = currentUser(store, c.req.raw);
    return c.json(
      user === undefined
        ? { success: true, logged_in: false, user: null }
        : { success: true, logged_in: true, user: sessionUserPayload(user) },
    );
  });

  app.post("/v1/login", async (c) => {
    const body = await c.req.json<{ username_or_email?: string; password?: string }>();
    const user = findUserByUsernameOrEmail(store, body.username_or_email ?? "");
    if (user === undefined || user.password !== body.password) {
      return c.json(
        { success: false, error_type: "InvalidCredentials", error_message: "invalid credentials" },
        401,
      );
    }
    const signedSession = await startSession(store, user);
    c.header("set-cookie", sessionCookieHeader(signedSession));
    return c.json({ success: true, signed_session: signedSession });
  });

  app.post("/v1/accounts/google_sso", async (c) => {
    const body = await c.req.json<{ google_credential?: string }>();
    if ((body.google_credential ?? "").length === 0) {
      return c.json(
        {
          success: false,
          error_code: 400,
          error_code_str: "BadInput",
          message: "google_credential is required",
        },
        400,
      );
    }
    // The fake accepts any credential and signs in the seeded user; the real backend verifies
    // the Google ID token's audience and issuer.
    const user = [...store.usersByToken.values()][0];
    if (user === undefined) {
      return c.json(
        {
          success: false,
          error_code: 500,
          error_code_str: "InternalError",
          message: "no seeded user",
        },
        500,
      );
    }
    const signedSession = await startSession(store, user);
    c.header("set-cookie", sessionCookieHeader(signedSession));
    return c.json({
      success: true,
      signed_session: signedSession,
      username_not_yet_customized: false,
      maybe_user_display_name: user.displayName,
    });
  });

  app.post("/v1/logout", (c) => {
    endSession(store, currentSignedSession(c.req.raw));
    c.header("set-cookie", clearedSessionCookieHeader());
    return c.json({ success: true });
  });

  return app;
}

/** SessionUserInfo as the real backend emits it (all required fields present). */
function sessionUserPayload(user: FakeUser): Record<string, unknown> {
  const gravatarHash = "0".repeat(32);
  return {
    core_info: {
      user_token: user.userToken,
      username: user.username,
      display_name: user.displayName,
      gravatar_hash: gravatarHash,
      default_avatar: { color_index: 0, image_index: 0 },
    },
    user_token: user.userToken,
    username: user.username,
    display_name: user.displayName,
    email_gravatar_hash: gravatarHash,
    onboarding: {
      email_not_set: false,
      email_not_confirmed: false,
      password_not_set: false,
      username_not_customized: false,
    },
    can_access_studio: false,
    maybe_feature_flags: [],
    fakeyou_plan: "free",
    storyteller_stream_plan: "free",
    can_use_tts: true,
    can_use_w2l: true,
    can_delete_own_tts_results: true,
    can_delete_own_w2l_results: true,
    can_delete_own_account: true,
    can_upload_tts_models: true,
    can_upload_w2l_templates: true,
    can_delete_own_tts_models: true,
    can_delete_own_w2l_templates: true,
    can_approve_w2l_templates: false,
    can_edit_other_users_profiles: false,
    can_edit_other_users_tts_models: false,
    can_edit_other_users_w2l_templates: false,
    can_delete_other_users_tts_models: false,
    can_delete_other_users_tts_results: false,
    can_delete_other_users_w2l_templates: false,
    can_delete_other_users_w2l_results: false,
    can_ban_users: false,
    can_delete_users: false,
  };
}
