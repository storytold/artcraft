import { describe, expect, it } from "vitest";

import { expectValid } from "../../test/helpers/contract";
import { createFakeUpstream } from "../src/index";
import { SEEDED_USER } from "../src/state";

function fake() {
  return createFakeUpstream();
}

async function login(app: ReturnType<typeof fake>, password = SEEDED_USER.password) {
  return app.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username_or_email: SEEDED_USER.username, password }),
  });
}

describe("sign-in", () => {
  it("signs the seeded user in and returns a spec-shaped LoginSuccessResponse plus a cookie", async () => {
    const response = await login(fake());
    expect(response.status).toBe(200);
    const body = await response.json<{ signed_session: string }>();
    expectValid("LoginSuccessResponse", body);
    expect(body.signed_session.split(".")).toHaveLength(3);
    expect(response.headers.get("set-cookie")).toMatch(/^session=/);
  });

  it("accepts the email address too", async () => {
    const app = fake();
    const response = await app.request("/v1/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username_or_email: SEEDED_USER.email,
        password: SEEDED_USER.password,
      }),
    });
    expect(response.status).toBe(200);
  });

  it("rejects a wrong password with the login error dialect", async () => {
    const response = await login(fake(), "nope");
    expect(response.status).toBe(401);
    const body = await response.json();
    expectValid("LoginErrorResponse", body);
    expect(body).toEqual({
      success: false,
      error_type: "InvalidCredentials",
      error_message: "invalid credentials",
    });
  });
});

describe("session lookup", () => {
  it("is anonymous without a credential", async () => {
    const response = await fake().request("/v1/session");
    const body = await response.json();
    expectValid("SessionInfoSuccessResponse", body);
    expect(body).toEqual({ success: true, logged_in: false, user: null });
  });

  it("identifies the user by the session header, the way the MCP server calls it", async () => {
    const app = fake();
    const { signed_session } = await (await login(app)).json<{ signed_session: string }>();
    const response = await app.request("/v1/session", { headers: { session: signed_session } });
    const body = await response.json<{ logged_in: boolean; user: { user_token: string } }>();
    expectValid("SessionInfoSuccessResponse", body);
    expect(body.logged_in).toBe(true);
    expect(body.user.user_token).toBe(SEEDED_USER.userToken);
  });

  it("identifies the user by the session cookie as well", async () => {
    const app = fake();
    const { signed_session } = await (await login(app)).json<{ signed_session: string }>();
    const response = await app.request("/v1/session", {
      headers: { cookie: `visitor=abc; session=${encodeURIComponent(signed_session)}` },
    });
    expect((await response.json<{ logged_in: boolean }>()).logged_in).toBe(true);
  });

  it("does not recognise a session it did not issue", async () => {
    const response = await fake().request("/v1/session", { headers: { session: "a.b.c" } });
    expect((await response.json<{ logged_in: boolean }>()).logged_in).toBe(false);
  });
});

describe("sign-out", () => {
  it("ends exactly the presented session", async () => {
    const app = fake();
    const first = await (await login(app)).json<{ signed_session: string }>();
    const second = await (await login(app)).json<{ signed_session: string }>();

    const logout = await app.request("/v1/logout", {
      method: "POST",
      headers: { session: first.signed_session },
    });
    expectValid("LogoutSuccessResponse", await logout.json());

    const afterFirst = await app.request("/v1/session", {
      headers: { session: first.signed_session },
    });
    expect((await afterFirst.json<{ logged_in: boolean }>()).logged_in).toBe(false);
    const afterSecond = await app.request("/v1/session", {
      headers: { session: second.signed_session },
    });
    expect((await afterSecond.json<{ logged_in: boolean }>()).logged_in).toBe(true);
  });
});

describe("Google sign-in", () => {
  it("accepts any credential and signs in the seeded user", async () => {
    const app = fake();
    const response = await app.request("/v1/accounts/google_sso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ google_credential: "anything" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json<{ signed_session: string }>();
    expectValid("GoogleCreateAccountSuccessResponse", body);
    const session = await app.request("/v1/session", { headers: { session: body.signed_session } });
    expect((await session.json<{ logged_in: boolean }>()).logged_in).toBe(true);
  });

  it("rejects an empty credential with the common error envelope", async () => {
    const response = await fake().request("/v1/accounts/google_sso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ google_credential: "" }),
    });
    expect(response.status).toBe(400);
    expectValid("CommonWebError", await response.json());
  });
});
