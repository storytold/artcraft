import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { ACCESS_TOKEN_TTL_SECONDS, OAUTH_ENDPOINTS, SCOPES } from "../../src/auth/oauth";
import worker, { oauthProviderOptions } from "../../src/index";
import { createSessionCredential } from "../../src/upstream/credential";

/**
 * The full OAuth loop as Claude, ChatGPT, or Claude Code drive it — with the consent step
 * (sign-in + completeAuthorization) performed through the library helpers, exactly as the
 * consent page will do in the next PR.
 */

const ORIGIN = "https://mcp.test";
const REDIRECT_URI = "https://client.example/callback";
const USER_ID = "user_test";
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

interface TokenError {
  error: string;
  error_description?: string;
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function registerClient(): Promise<string> {
  const response = await call(OAUTH_ENDPOINTS.register, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Token flow test client",
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  expect(response.status).toBe(201);
  const client = await response.json<{ client_id: string }>();
  return client.client_id;
}

/** What the consent page will do once the user has signed in: complete the authorization. */
async function consent(
  clientId: string,
  challenge: string,
  scope: readonly string[] = SCOPES,
): Promise<URL> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: scope.join(" "),
    state: "state-123",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${ORIGIN}/mcp`,
  });
  const helpers = getOAuthApi(oauthProviderOptions, env);
  const authRequest = await helpers.parseAuthRequest(
    new Request(`${ORIGIN}${OAUTH_ENDPOINTS.authorize}?${params.toString()}`),
  );
  const { redirectTo } = await helpers.completeAuthorization({
    request: authRequest,
    userId: USER_ID,
    metadata: { clientName: "Token flow test client" },
    scope: [...scope],
    props: {
      credential: createSessionCredential(SIGNED_SESSION).toProps(),
      grantIssuedAt: Date.now(),
    },
  });
  return new URL(redirectTo);
}

async function tokenRequest(form: Record<string, string>): Promise<Response> {
  return call(OAUTH_ENDPOINTS.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
}

async function exchangeCode(clientId: string, code: string, verifier: string): Promise<Response> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
    resource: `${ORIGIN}/mcp`,
  });
}

async function refresh(clientId: string, refreshToken: string): Promise<Response> {
  return tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
}

async function callMcp(accessToken: string): Promise<Response> {
  return call("/mcp", { method: "POST", headers: { authorization: `Bearer ${accessToken}` } });
}

/** Register → consent → exchange, returning everything a client would hold afterwards. */
async function connect(): Promise<{ clientId: string; tokens: TokenResponse }> {
  const clientId = await registerClient();
  const { verifier, challenge } = await pkce();
  const redirect = await consent(clientId, challenge);
  const code = redirect.searchParams.get("code") ?? "";
  const exchanged = await exchangeCode(clientId, code, verifier);
  expect(exchanged.status).toBe(200);
  return { clientId, tokens: await exchanged.json<TokenResponse>() };
}

describe("authorization code + PKCE", () => {
  it("redirects with code, the original state, and an RFC 9207 iss", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const redirect = await consent(clientId, challenge);
    expect(redirect.origin + redirect.pathname).toBe(REDIRECT_URI);
    expect(redirect.searchParams.get("code")).toMatch(/.+/);
    expect(redirect.searchParams.get("state")).toBe("state-123");
    expect(redirect.searchParams.get("iss")).toBe(ORIGIN);
  });

  it("exchanges the code over a form-encoded request for a 1h bearer plus a refresh token", async () => {
    const { tokens } = await connect();
    expect(tokens.token_type.toLowerCase()).toBe("bearer");
    expect(tokens.expires_in).toBe(ACCESS_TOKEN_TTL_SECONDS);
    expect(tokens.refresh_token).toMatch(/.+/);
    expect(tokens.scope?.split(" ").sort()).toEqual([...SCOPES].sort());
  });

  it("lets the bearer reach the protected route with the grant props decrypted", async () => {
    const { tokens } = await connect();
    const response = await callMcp(tokens.access_token);
    expect(response.status).toBe(501);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({
      error: "MCP transport not available yet",
      authenticated: true,
      credential: "session credential",
    });
    expect(body).not.toContain(SIGNED_SESSION);
  });

  it("rejects the exchange with the wrong PKCE verifier", async () => {
    const clientId = await registerClient();
    const { challenge } = await pkce();
    const redirect = await consent(clientId, challenge);
    const response = await exchangeCode(clientId, redirect.searchParams.get("code") ?? "", "wrong");
    expect(response.status).toBe(400);
    expect((await response.json<TokenError>()).error).toBe("invalid_grant");
  });

  it("rejects a code presented twice", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = await pkce();
    const code = (await consent(clientId, challenge)).searchParams.get("code") ?? "";
    expect((await exchangeCode(clientId, code, verifier)).status).toBe(200);
    const replay = await exchangeCode(clientId, code, verifier);
    expect(replay.status).toBe(400);
    expect((await replay.json<TokenError>()).error).toBe("invalid_grant");
  });
});

describe("refresh rotation", () => {
  it("rotates on use and answers a superseded refresh token with invalid_grant", async () => {
    const { clientId, tokens } = await connect();
    const first = await refresh(clientId, tokens.refresh_token ?? "");
    expect(first.status).toBe(200);
    const rotated = await first.json<TokenResponse>();
    expect(rotated.refresh_token).toMatch(/.+/);
    expect(rotated.refresh_token).not.toBe(tokens.refresh_token);
    expect(rotated.access_token).not.toBe(tokens.access_token);

    // Using the replacement retires the original for good.
    const second = await refresh(clientId, rotated.refresh_token ?? "");
    expect(second.status).toBe(200);
    const reuse = await refresh(clientId, tokens.refresh_token ?? "");
    expect(reuse.status).toBe(400);
    expect((await reuse.json<TokenError>()).error).toBe("invalid_grant");
  });

  it("issues access tokens that still reach the protected route after rotation", async () => {
    const { clientId, tokens } = await connect();
    const rotated = await (
      await refresh(clientId, tokens.refresh_token ?? "")
    ).json<TokenResponse>();
    expect((await callMcp(rotated.access_token)).status).toBe(501);
  });
});

describe("revocation", () => {
  it("stops a revoked access token at the resource", async () => {
    const { clientId, tokens } = await connect();
    const metadata = await (
      await call("/.well-known/oauth-authorization-server")
    ).json<{ revocation_endpoint: string }>();
    const revoked = await call(new URL(metadata.revocation_endpoint).pathname, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: tokens.access_token, client_id: clientId }).toString(),
    });
    expect(revoked.status).toBe(200);
    expect((await callMcp(tokens.access_token)).status).toBe(401);
  });

  it("stops every token of a grant revoked through the helpers (what the connections page will call)", async () => {
    const { clientId, tokens } = await connect();
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const grants = await helpers.listUserGrants(USER_ID);
    const grant = grants.items.find((g) => g.clientId === clientId);
    expect(grant).toBeDefined();
    await helpers.revokeGrant(grant?.id ?? "", USER_ID);
    expect((await callMcp(tokens.access_token)).status).toBe(401);
    expect((await refresh(clientId, tokens.refresh_token ?? "")).status).toBe(400);
  });
});

describe("storage", () => {
  it("never holds the upstream session in clear in KV", async () => {
    await connect();
    const keys = await env.OAUTH_KV.list();
    expect(keys.keys.length).toBeGreaterThan(0);
    for (const key of keys.keys) {
      const value = (await env.OAUTH_KV.get(key.name)) ?? "";
      expect(value).not.toContain(SIGNED_SESSION);
    }
  });
});
