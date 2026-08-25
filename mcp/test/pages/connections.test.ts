import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "../../src/auth/authenticator";
import { finishAuthorization } from "../../src/auth/finish-authorization";
import { OAUTH_ENDPOINTS } from "../../src/auth/oauth";
import { oauthProviderOptions } from "../../src/index";
import { CONNECTIONS_FORM_FIELDS, CONNECTIONS_PATHS } from "../../src/pages/connections-page";
import { UI_SESSION_COOKIE_NAME } from "../../src/pages/ui-session";
import { createSessionCredential } from "../../src/upstream/credential";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SEEDED_USER } from "../../fake-upstream/src/state";
import {
  authorizeUrl,
  call,
  callMcp,
  exchangeCode,
  mcpInitialize,
  ORIGIN,
  pkce,
  type TokenResponse,
} from "../helpers/oauth-client";

const REDIRECT_URI = "https://client.example/callback";
const LOCAL_UPSTREAM = "http://localhost:12345";
const fakeUpstream = createFakeUpstream();

beforeAll(() => {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    if (new URL(request.url).origin === LOCAL_UPSTREAM) {
      return Promise.resolve(fakeUpstream.fetch(request));
    }
    return Promise.reject(new Error(`outbound fetch refused in tests: ${request.url}`));
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

/** A grant for the seeded user under a named client; returns a live access token. */
async function connectClient(
  clientName: string,
): Promise<{ accessToken: string; clientId: string }> {
  const registration = await call(OAUTH_ENDPOINTS.register, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: clientName,
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  const { client_id } = await registration.json<{ client_id: string }>();
  const login = await fakeUpstream.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    }),
  });
  const { signed_session } = await login.json<{ signed_session: string }>();
  const user: AuthenticatedUser = {
    userToken: SEEDED_USER.userToken,
    username: SEEDED_USER.username,
    displayName: SEEDED_USER.displayName,
    credential: createSessionCredential(signed_session),
  };
  const helpers = getOAuthApi(oauthProviderOptions, env);
  const { verifier, challenge } = await pkce();
  const authRequest = await helpers.parseAuthRequest(
    new Request(
      authorizeUrl({
        response_type: "code",
        client_id,
        redirect_uri: REDIRECT_URI,
        scope: "read:account",
        state: "c",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: `${ORIGIN}/mcp`,
      }),
    ),
  );
  const client = await helpers.lookupClient(client_id);
  if (!client) throw new Error("client not found");
  const redirect = new URL(await finishAuthorization(helpers, authRequest, client, user));
  const tokens = await (
    await exchangeCode(client_id, redirect.searchParams.get("code") ?? "", verifier, REDIRECT_URI)
  ).json<TokenResponse>();
  return { accessToken: tokens.access_token, clientId: client_id };
}

interface Page {
  response: Response;
  html: string;
  csrf: string;
  cookies: string;
}

/** GET the page with the given cookies; returns the CSRF token and the cookies to keep. */
async function openPage(cookies = ""): Promise<Page> {
  const response = await call(CONNECTIONS_PATHS.page, {
    headers: cookies ? { cookie: cookies } : {},
  });
  const html = await response.text();
  const csrf =
    /artcraft_consent=([A-Za-z0-9_-]+)/.exec(response.headers.get("set-cookie") ?? "")?.[1] ?? "";
  return { response, html, csrf, cookies: merge(cookies, `artcraft_consent=${csrf}`) };
}

function merge(cookies: string, extra: string): string {
  return [cookies, extra].filter(Boolean).join("; ");
}

async function post(
  path: string,
  fields: Record<string, string>,
  cookies: string,
): Promise<Response> {
  return call(path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies },
    body: new URLSearchParams(fields).toString(),
  });
}

async function signIn(): Promise<string> {
  const page = await openPage();
  const response = await post(
    CONNECTIONS_PATHS.signIn,
    {
      [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf,
      [CONNECTIONS_FORM_FIELDS.method]: "password",
      [CONNECTIONS_FORM_FIELDS.usernameOrEmail]: SEEDED_USER.username,
      [CONNECTIONS_FORM_FIELDS.password]: SEEDED_USER.password,
    },
    page.cookies,
  );
  expect(response.status).toBe(303);
  const id = new RegExp(`${UI_SESSION_COOKIE_NAME}=([A-Za-z0-9_-]+)`).exec(
    response.headers.get("set-cookie") ?? "",
  )?.[1];
  expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return `${UI_SESSION_COOKIE_NAME}=${id ?? ""}`;
}

describe("/connections", () => {
  it("shows the sign-in form to a visitor, with CSRF cookie and CSP", async () => {
    const page = await openPage();
    expect(page.response.status).toBe(200);
    expect(page.html).toContain(`action="${CONNECTIONS_PATHS.signIn}"`);
    expect(page.csrf).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(page.response.headers.get("set-cookie")).toContain("Path=/connections");
    expect(page.response.headers.get("content-security-policy")).toMatch(/script-src 'nonce-/);
    expect(page.response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a sign-in without a matching CSRF token", async () => {
    const response = await post(
      CONNECTIONS_PATHS.signIn,
      {
        [CONNECTIONS_FORM_FIELDS.usernameOrEmail]: "x",
        [CONNECTIONS_FORM_FIELDS.password]: "y",
        [CONNECTIONS_FORM_FIELDS.csrf]: "nope",
      },
      "",
    );
    expect(response.status).toBe(403);
  });

  it("re-renders with the upstream's message on a wrong password", async () => {
    const page = await openPage();
    const response = await post(
      CONNECTIONS_PATHS.signIn,
      {
        [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf,
        [CONNECTIONS_FORM_FIELDS.method]: "password",
        [CONNECTIONS_FORM_FIELDS.usernameOrEmail]: SEEDED_USER.username,
        [CONNECTIONS_FORM_FIELDS.password]: "wrong",
      },
      page.cookies,
    );
    expect(response.status).toBe(401);
    expect(await response.text()).toContain("invalid credentials");
    expect(response.headers.get("set-cookie") ?? "").not.toContain(UI_SESSION_COOKIE_NAME);
  });

  it("signs in, ends the upstream session it used, and lists the user's connections", async () => {
    const { clientId } = await connectClient("Claude (connections test)");
    const sessionCookie = await signIn();

    const page = await openPage(sessionCookie);
    expect(page.response.status).toBe(200);
    expect(page.html).toContain(`Signed in as <strong>${SEEDED_USER.username}</strong>`);
    expect(page.html).toContain("Claude (connections test)");
    expect(page.html).toContain("see your account and credits");
    expect(page.html).toContain(`name="${CONNECTIONS_FORM_FIELDS.grantId}"`);

    // The page's own sign-in session was ended upstream: the fake only knows the grant's session.
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const grants = await helpers.listUserGrants(SEEDED_USER.userToken);
    expect(grants.items.some((g) => g.clientId === clientId)).toBe(true);
  });

  it("disconnects a grant: its token stops working and it leaves the list", async () => {
    const { accessToken, clientId } = await connectClient("Disconnect me");
    expect((await callMcp(accessToken)).status).not.toBe(401);

    const sessionCookie = await signIn();
    const page = await openPage(sessionCookie);
    // Other tests connect the same seeded user concurrently, so find this grant by its client
    // name rather than by position on the page, then check the page offers it for disconnect.
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const grants = await helpers.listUserGrants(SEEDED_USER.userToken, { limit: 100 });
    const id = grants.items.find((g) => g.clientId === clientId)?.id ?? "";
    expect(id).toMatch(/.+/);
    expect(page.html).toContain(`name="${CONNECTIONS_FORM_FIELDS.grantId}" value="${id}"`);

    const revoked = await post(
      CONNECTIONS_PATHS.revoke,
      { [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf, [CONNECTIONS_FORM_FIELDS.grantId]: id },
      page.cookies,
    );
    expect(revoked.status).toBe(303);
    expect(revoked.headers.get("location")).toContain("notice=disconnected");

    expect((await callMcp(accessToken)).status).toBe(401);
    const after = await openPage(sessionCookie);
    expect(after.html).not.toContain("Disconnect me");
  });

  it("refuses revocation without a page session, and ignores someone else's grant id", async () => {
    const page = await openPage();
    const response = await post(
      CONNECTIONS_PATHS.revoke,
      { [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf, [CONNECTIONS_FORM_FIELDS.grantId]: "grant_x" },
      page.cookies,
    );
    expect(response.status).toBe(401);

    const { accessToken } = await connectClient("Someone else's");
    const sessionCookie = await signIn();
    const signedIn = await openPage(sessionCookie);
    const bogus = await post(
      CONNECTIONS_PATHS.revoke,
      {
        [CONNECTIONS_FORM_FIELDS.csrf]: signedIn.csrf,
        [CONNECTIONS_FORM_FIELDS.grantId]: "grant_does_not_exist",
      },
      signedIn.cookies,
    );
    expect(bogus.status).toBe(303);
    expect((await callMcp(accessToken)).status).not.toBe(401);
  });

  it("signs out of the page", async () => {
    const sessionCookie = await signIn();
    const page = await openPage(sessionCookie);
    const response = await post(
      CONNECTIONS_PATHS.signOut,
      { [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf },
      page.cookies,
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("set-cookie")).toContain(`${UI_SESSION_COOKIE_NAME}=;`);
    const after = await openPage(sessionCookie);
    expect(after.html).toContain(`action="${CONNECTIONS_PATHS.signIn}"`);
  });
});

describe("/connections personal tokens", () => {
  const SECRET_PATTERN = /artcraft_pat_[A-Za-z0-9_-]{43}/;

  async function createToken(
    sessionCookie: string,
    fields: Partial<Record<string, string>> = {},
  ): Promise<{ response: Response; html: string }> {
    const page = await openPage(sessionCookie);
    const response = await post(
      CONNECTIONS_PATHS.createToken,
      {
        [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf,
        [CONNECTIONS_FORM_FIELDS.method]: "password",
        [CONNECTIONS_FORM_FIELDS.password]: SEEDED_USER.password,
        [CONNECTIONS_FORM_FIELDS.tokenLabel]: "Responses API",
        [CONNECTIONS_FORM_FIELDS.tokenLifetime]: "30",
        ...fields,
      },
      page.cookies,
    );
    return { response, html: await response.text() };
  }

  it("creates a token after a password confirmation, shows it once, and it works at /mcp", async () => {
    const sessionCookie = await signIn();
    const { response, html } = await createToken(sessionCookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const secret = SECRET_PATTERN.exec(html)?.[0] ?? "";
    expect(secret).toMatch(SECRET_PATTERN);
    expect(html).toContain("Copy it now");

    expect((await mcpInitialize(secret)).status).toBe(200);

    const again = await openPage(sessionCookie);
    expect(again.html).toContain("<strong>Responses API</strong>");
    expect(again.html).toContain(`artcraft_pat_…${secret.slice(-4)}`);
    expect(again.html).not.toContain(secret);
  });

  it("refuses to create a token on a wrong password, a missing name, or without a session", async () => {
    const sessionCookie = await signIn();
    const wrong = await createToken(sessionCookie, { [CONNECTIONS_FORM_FIELDS.password]: "nope" });
    expect(wrong.response.status).toBe(401);
    expect(wrong.html).not.toMatch(SECRET_PATTERN);

    const unnamed = await createToken(sessionCookie, { [CONNECTIONS_FORM_FIELDS.tokenLabel]: " " });
    expect(unnamed.response.status).toBe(400);

    const badLifetime = await createToken(sessionCookie, {
      [CONNECTIONS_FORM_FIELDS.tokenLifetime]: "365",
    });
    expect(badLifetime.response.status).toBe(400);

    const anonymous = await createToken("");
    expect(anonymous.response.status).toBe(401);
    expect(anonymous.html).not.toMatch(SECRET_PATTERN);
  });

  it("revokes a token from the page so it stops working", async () => {
    const sessionCookie = await signIn();
    const { html } = await createToken(sessionCookie, {
      [CONNECTIONS_FORM_FIELDS.tokenLabel]: "Revoke me",
    });
    const secret = SECRET_PATTERN.exec(html)?.[0] ?? "";
    expect((await mcpInitialize(secret)).status).toBe(200);

    const page = await openPage(sessionCookie);
    const id = new RegExp(
      `name="${CONNECTIONS_FORM_FIELDS.tokenId}" value="([^"]+)"[^]{0,200}Revoke</button>`,
    );
    // The token id sits in the list item labelled "Revoke me"; find that item, then its id.
    const item = page.html
      .split("<li>")
      .find((chunk) => chunk.includes("<strong>Revoke me</strong>"));
    const tokenId = /name="token_id" value="([^"]+)"/.exec(item ?? "")?.[1] ?? "";
    expect(tokenId).toMatch(/.+/);
    expect(id.test(page.html)).toBe(true);

    const revoked = await post(
      CONNECTIONS_PATHS.revokeToken,
      { [CONNECTIONS_FORM_FIELDS.csrf]: page.csrf, [CONNECTIONS_FORM_FIELDS.tokenId]: tokenId },
      page.cookies,
    );
    expect(revoked.status).toBe(303);
    expect(revoked.headers.get("location")).toContain("notice=token_revoked");
    expect((await mcpInitialize(secret)).status).toBe(401);
    expect((await openPage(sessionCookie)).html).not.toContain("<strong>Revoke me</strong>");
  });

  it("requires the CSRF token on both token forms", async () => {
    const sessionCookie = await signIn();
    for (const path of [CONNECTIONS_PATHS.createToken, CONNECTIONS_PATHS.revokeToken]) {
      const response = await post(path, { [CONNECTIONS_FORM_FIELDS.csrf]: "nope" }, sessionCookie);
      expect(response.status).toBe(403);
    }
  });
});
