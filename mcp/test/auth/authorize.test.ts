import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { CONSENT_FORM_FIELDS } from "../../src/auth/consent-page";
import { CSRF_COOKIE_NAME } from "../../src/auth/csrf";
import { OAUTH_ENDPOINTS } from "../../src/auth/oauth";
import { oauthProviderOptions } from "../../src/index";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SEEDED_USER } from "../../fake-upstream/src/state";
import {
  authorizeUrl,
  call,
  exchangeCode,
  mcpInitialize,
  ORIGIN,
  pkce,
  type TokenResponse,
} from "../helpers/oauth-client";

/**
 * The consent flow end to end through the real Worker: the runtime's default Authenticator
 * signs in against the fake upstream (served in-process by stubbing the global fetch for the
 * local upstream origin), then the provider issues a code that exchanges for a bearer.
 */

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

async function registerClient(): Promise<string> {
  const response = await call(OAUTH_ENDPOINTS.register, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Claude (consent test)",
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  const { client_id } = await response.json<{ client_id: string }>();
  return client_id;
}

interface ConsentPage {
  response: Response;
  html: string;
  csrfCookie: string;
  csrfField: string;
  authRequest: string;
}

async function openConsent(
  clientId: string,
  challenge: string,
  scope = "read:account read:jobs",
): Promise<ConsentPage> {
  const path = authorizeUrl({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope,
    state: "consent-state",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${ORIGIN}/mcp`,
  }).slice(ORIGIN.length);
  const response = await call(path);
  const html = await response.text();
  const csrfCookie =
    /artcraft_consent=([A-Za-z0-9_-]+)/.exec(response.headers.get("set-cookie") ?? "")?.[1] ?? "";
  const csrfField =
    new RegExp(`name="${CONSENT_FORM_FIELDS.csrf}" value="([^"]+)"`).exec(html)?.[1] ?? "";
  const authRequest = (
    new RegExp(`name="${CONSENT_FORM_FIELDS.authRequest}" value="([^"]+)"`).exec(html)?.[1] ?? ""
  ).replace(/&amp;/g, "&");
  return { response, html, csrfCookie, csrfField, authRequest };
}

async function submit(
  page: ConsentPage,
  fields: Record<string, string>,
  cookie = page.csrfCookie,
): Promise<Response> {
  const form = new URLSearchParams({
    [CONSENT_FORM_FIELDS.authRequest]: page.authRequest,
    [CONSENT_FORM_FIELDS.csrf]: page.csrfField,
    [CONSENT_FORM_FIELDS.method]: "password",
    [CONSENT_FORM_FIELDS.action]: "allow",
    ...fields,
  });
  return call(OAUTH_ENDPOINTS.authorize, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: `${CSRF_COOKIE_NAME}=${cookie}`,
    },
    body: form.toString(),
  });
}

describe("GET /authorize", () => {
  it("renders the consent page for a valid request with CSRF cookie and a nonce'd CSP", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    expect(page.response.status).toBe(200);
    expect(page.response.headers.get("content-type")).toMatch(/^text\/html/);
    expect(page.html).toContain("Allow <strong>Claude (consent test)</strong>");
    expect(page.html).toContain("<code>client.example</code>");
    expect(page.csrfCookie).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(page.csrfField).toBe(page.csrfCookie);
    expect(page.authRequest).toContain(`client_id=${clientId}`);
    const csp = page.response.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/script-src 'nonce-[A-Za-z0-9_-]{43}'/);
    expect(csp).toContain("form-action 'self'");
    expect(page.response.headers.get("cache-control")).toBe("no-store");
    expect(page.response.headers.get("x-frame-options")).toBe("DENY");
    expect(page.html).not.toContain("accounts.google.com"); // local has no Google client id
  });
});

describe("POST /authorize", () => {
  it("refuses a missing or mismatched CSRF token", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const missing = await submit(
      page,
      { username_or_email: SEEDED_USER.username, password: SEEDED_USER.password },
      "",
    );
    expect(missing.status).toBe(403);
    const other = await openConsent(clientId, challenge);
    const mismatched = await submit(
      page,
      { username_or_email: SEEDED_USER.username, password: SEEDED_USER.password },
      other.csrfCookie,
    );
    expect(mismatched.status).toBe(403);
    expect(mismatched.headers.get("location")).toBeNull();
  });

  it("sends access_denied back to the client when the user cancels", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const response = await submit(page, { [CONSENT_FORM_FIELDS.action]: "deny" });
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe(REDIRECT_URI);
    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.get("state")).toBe("consent-state");
    expect(location.searchParams.get("iss")).toBe(ORIGIN);
    expect(location.searchParams.get("code")).toBeNull();
  });

  it("re-renders with the upstream's message on a wrong password, and never redirects", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const response = await submit(page, {
      username_or_email: SEEDED_USER.username,
      password: "wrong",
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    const html = await response.text();
    expect(html).toContain("invalid credentials");
    expect(html).toContain(`value="${SEEDED_USER.username}"`);
    expect(html).not.toContain("wrong");
    expect(response.headers.get("set-cookie")).toMatch(/artcraft_consent=/);
  });

  it("asks for credentials when the form is incomplete", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const response = await submit(page, { username_or_email: "", password: "" });
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Enter your username or email");
  });

  it("refuses a tampered auth request instead of trusting the hidden field", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const tampered = {
      ...page,
      authRequest: page.authRequest.replace(
        encodeURIComponent(REDIRECT_URI),
        encodeURIComponent("https://evil.example/cb"),
      ),
    };
    const response = await submit(tampered, {
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("location")).toBeNull();
  });

  it("signs in against the upstream, records the grant under the Artcraft user, and redirects with a code that works", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const response = await submit(page, {
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    });
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe(REDIRECT_URI);
    expect(location.searchParams.get("state")).toBe("consent-state");
    expect(location.searchParams.get("iss")).toBe(ORIGIN);
    const code = location.searchParams.get("code") ?? "";
    expect(code).toMatch(/.+/);

    const exchanged = await exchangeCode(clientId, code, verifier, REDIRECT_URI);
    expect(exchanged.status).toBe(200);
    const tokens = await exchanged.json<TokenResponse>();
    expect(tokens.scope?.split(" ").sort()).toEqual(["read:account", "read:jobs"]);

    expect((await mcpInitialize(tokens.access_token)).status).toBe(200);

    const helpers = getOAuthApi(oauthProviderOptions, env);
    const grants = await helpers.listUserGrants(SEEDED_USER.userToken);
    expect(grants.items.some((g) => g.clientId === clientId)).toBe(true);
    const unwrapped = await helpers.unwrapToken(tokens.access_token);
    expect(unwrapped?.grant.props).toMatchObject({
      username: SEEDED_USER.username,
      credential: { kind: "session" },
    });

    // The upstream really was signed in: the fake knows the session held in the grant.
    const props = unwrapped?.grant.props as { credential: { signedSession: string } } | undefined;
    const session = await fakeUpstream.request("/v1/session", {
      headers: { session: props?.credential.signedSession ?? "" },
    });
    expect((await session.json<{ logged_in: boolean }>()).logged_in).toBe(true);
  });

  it("accepts a Google credential through the same form", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const page = await openConsent(clientId, challenge);
    const response = await submit(page, {
      [CONSENT_FORM_FIELDS.method]: "google",
      [CONSENT_FORM_FIELDS.googleCredential]: "google-id-token",
    });
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("code")).toMatch(/.+/);
  });
});
