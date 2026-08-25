import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";

import { OAUTH_ENDPOINTS } from "../../src/auth/oauth";
import worker from "../../src/index";

/** What an MCP client does, expressed as test helpers against the Worker's default export. */

export const ORIGIN = "https://mcp.test";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface TokenError {
  error: string;
  error_description?: string;
}

export async function call(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

export async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

export function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function tokenRequest(form: Record<string, string>): Promise<Response> {
  return call(OAUTH_ENDPOINTS.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
}

export async function exchangeCode(
  clientId: string,
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<Response> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
    resource: `${ORIGIN}/mcp`,
  });
}

export async function refresh(clientId: string, refreshToken: string): Promise<Response> {
  return tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
}

/** A bare POST with the bearer: enough to see whether the transport lets the token through. */
export async function callMcp(accessToken: string): Promise<Response> {
  return call("/mcp", { method: "POST", headers: { authorization: `Bearer ${accessToken}` } });
}

/** A JSON-RPC `initialize` over the protected route; 200 with serverInfo proves the token works. */
export async function mcpInitialize(accessToken: string): Promise<Response> {
  return call("/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test", version: "0.0.0" },
      },
    }),
  });
}

/** Grant props as consent records them (mirrors finishAuthorization). */
export function grantProps(credentialProps: unknown, scopes: readonly string[]) {
  return {
    credential: credentialProps,
    grantIssuedAt: Date.now(),
    userToken: "user_test",
    username: "tester",
    displayName: "Tester",
    scopes: [...scopes],
  };
}

export function authorizeUrl(params: Record<string, string>): string {
  return `${ORIGIN}${OAUTH_ENDPOINTS.authorize}?${new URLSearchParams(params).toString()}`;
}
