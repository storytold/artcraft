import { describe, expect, it } from "vitest";

import { createArtcraftAuthenticator, type SignInOutcome } from "../../src/auth/authenticator";
import { SESSION_HEADER_NAME } from "../../src/upstream/credential";
import { fixture } from "../helpers/contract";

const UPSTREAM = "https://api.example.test";
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";
const PASSWORD = "localdev1pass";

// Fixtures are validated against the spec snapshot when declared.
const LOGIN_OK = fixture("LoginSuccessResponse", { success: true, signed_session: SIGNED_SESSION });
const LOGIN_INVALID = fixture("LoginErrorResponse", {
  success: false,
  error_type: "InvalidCredentials",
  error_message: "invalid credentials",
});
const LOGIN_NEEDS_PASSWORD = fixture("LoginErrorResponse", {
  success: false,
  error_type: "AccountNeedsPassword",
  error_message: "account was created without a password; please try password reset",
});
const GOOGLE_OK = fixture("GoogleCreateAccountSuccessResponse", {
  success: true,
  signed_session: SIGNED_SESSION,
  username_not_yet_customized: false,
  maybe_user_display_name: "Local Dev",
});
const GOOGLE_REJECTED = fixture("CommonWebError", {
  success: false,
  error_code: 401,
  error_code_str: "NotAuthorized",
  message: "google credential was not accepted",
});
const SESSION_USER = {
  core_info: {
    user_token: "user_localdev1",
    username: "localdev1",
    display_name: "Local Dev",
    gravatar_hash: "0".repeat(32),
    default_avatar: { color_index: 0, image_index: 0 },
  },
  user_token: "user_localdev1",
  username: "localdev1",
  display_name: "Local Dev",
  email_gravatar_hash: "0".repeat(32),
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
const SESSION_OK = fixture("SessionInfoSuccessResponse", {
  success: true,
  logged_in: true,
  user: SESSION_USER,
});
const SESSION_ANONYMOUS = fixture("SessionInfoSuccessResponse", {
  success: true,
  logged_in: false,
  user: null,
});

interface Route {
  status: number;
  body: unknown;
}

/** A scripted upstream: one canned response per path, recording what was sent. */
function scriptedUpstream(routes: Record<string, Route>) {
  const requests: Request[] = [];
  const fetchImpl: typeof globalThis.fetch = (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    const route = routes[new URL(request.url).pathname];
    if (!route) return Promise.resolve(new Response("not scripted", { status: 599 }));
    return Promise.resolve(
      new Response(JSON.stringify(route.body), {
        status: route.status,
        headers: { "content-type": "application/json" },
      }),
    );
  };
  return { requests, fetch: fetchImpl };
}

function authenticator(routes: Record<string, Route>) {
  const upstream = scriptedUpstream(routes);
  return {
    ...upstream,
    auth: createArtcraftAuthenticator({ upstreamApiHost: UPSTREAM, fetch: upstream.fetch }),
  };
}

function expectFailure(outcome: SignInOutcome, reason: string): string {
  expect(outcome.ok).toBe(false);
  if (outcome.ok) throw new Error("unreachable");
  expect(outcome.reason).toBe(reason);
  return outcome.message;
}

describe("password sign-in", () => {
  it("signs in, then identifies the user with the new session", async () => {
    const { auth, requests } = authenticator({
      "/v1/login": { status: 200, body: LOGIN_OK },
      "/v1/session": { status: 200, body: SESSION_OK },
    });
    const outcome = await auth.authenticate({
      method: "password",
      usernameOrEmail: "localdev1",
      password: PASSWORD,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("unreachable");
    expect(outcome.user.userToken).toBe("user_localdev1");
    expect(outcome.user.username).toBe("localdev1");
    expect(outcome.user.displayName).toBe("Local Dev");

    const headers = new Headers();
    outcome.user.credential.applyTo(headers);
    expect(headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);

    expect(requests.map((r) => `${r.method} ${new URL(r.url).pathname}`)).toEqual([
      "POST /v1/login",
      "GET /v1/session",
    ]);
    const login = requests[0];
    expect(await login?.json()).toEqual({ username_or_email: "localdev1", password: PASSWORD });
    expect(login?.headers.get(SESSION_HEADER_NAME)).toBeNull();
    expect(requests[1]?.headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });

  it("maps InvalidCredentials to a user-facing failure carrying the server's message", async () => {
    const { auth, requests } = authenticator({ "/v1/login": { status: 401, body: LOGIN_INVALID } });
    const message = expectFailure(
      await auth.authenticate({ method: "password", usernameOrEmail: "x", password: PASSWORD }),
      "invalid_credentials",
    );
    expect(message).toBe("invalid credentials");
    expect(requests).toHaveLength(1);
  });

  it("maps AccountNeedsPassword", async () => {
    const { auth } = authenticator({ "/v1/login": { status: 401, body: LOGIN_NEEDS_PASSWORD } });
    expectFailure(
      await auth.authenticate({ method: "password", usernameOrEmail: "x", password: PASSWORD }),
      "account_needs_password",
    );
  });

  it("treats a 5xx as upstream unavailable, without echoing anything", async () => {
    const { auth } = authenticator({
      "/v1/login": {
        status: 500,
        body: { success: false, error_type: "ServerError", error_message: "boom" },
      },
    });
    const message = expectFailure(
      await auth.authenticate({ method: "password", usernameOrEmail: "x", password: PASSWORD }),
      "upstream_unavailable",
    );
    expect(message).not.toContain("boom");
    expect(message).not.toContain(PASSWORD);
  });

  it("treats a network failure as upstream unavailable", async () => {
    const auth = createArtcraftAuthenticator({
      upstreamApiHost: UPSTREAM,
      fetch: () => Promise.reject(new Error("ECONNREFUSED")),
    });
    expectFailure(
      await auth.authenticate({ method: "password", usernameOrEmail: "x", password: PASSWORD }),
      "upstream_unavailable",
    );
  });

  it("fails when the new session does not identify a logged-in user", async () => {
    const { auth } = authenticator({
      "/v1/login": { status: 200, body: LOGIN_OK },
      "/v1/session": { status: 200, body: SESSION_ANONYMOUS },
    });
    expectFailure(
      await auth.authenticate({ method: "password", usernameOrEmail: "x", password: PASSWORD }),
      "not_signed_in",
    );
  });
});

describe("Google sign-in", () => {
  it("forwards the Google credential and identifies the user", async () => {
    const { auth, requests } = authenticator({
      "/v1/accounts/google_sso": { status: 200, body: GOOGLE_OK },
      "/v1/session": { status: 200, body: SESSION_OK },
    });
    const outcome = await auth.authenticate({ method: "google", credential: "google-id-token" });
    expect(outcome.ok).toBe(true);
    expect(await requests[0]?.json()).toEqual({ google_credential: "google-id-token" });
  });

  it("maps a rejected Google credential to google_rejected with the server's message", async () => {
    const { auth } = authenticator({
      "/v1/accounts/google_sso": { status: 401, body: GOOGLE_REJECTED },
    });
    const message = expectFailure(
      await auth.authenticate({ method: "google", credential: "bad" }),
      "google_rejected",
    );
    expect(message).toBe("google credential was not accepted");
  });
});
