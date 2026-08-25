import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { MCP_ROUTES, OAUTH_ENDPOINTS, SCOPES } from "../../src/auth/oauth";
import worker from "../../src/index";

const ORIGIN = "https://mcp.test";

async function call(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

async function json(path: string): Promise<Record<string, unknown>> {
  const response = await call(path);
  expect(response.status).toBe(200);
  return response.json<Record<string, unknown>>();
}

describe("lazy authentication on the MCP route", () => {
  it.each(MCP_ROUTES)("answers %s with 401 and a resource_metadata challenge", async (route) => {
    const response = await call(route, { method: "POST" });
    expect(response.status).toBe(401);
    const challenge = response.headers.get("www-authenticate") ?? "";
    expect(challenge).toMatch(/^Bearer /);
    expect(challenge).toContain(
      `resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource${route}"`,
    );
  });

  it("rejects a made-up bearer token with 401, not 500", async () => {
    const response = await call("/mcp", {
      method: "POST",
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(response.status).toBe(401);
  });

  it("keeps the unprotected routes reachable", async () => {
    const response = await call("/healthz");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, environment: "local" });
  });
});

describe("protected resource metadata (RFC 9728)", () => {
  it("is served at the root well-known path with a derived resource and this origin as issuer", async () => {
    const metadata = await json("/.well-known/oauth-protected-resource");
    expect(metadata.authorization_servers).toEqual([ORIGIN]);
    expect(metadata.scopes_supported).toEqual([...SCOPES]);
    expect(metadata.bearer_methods_supported).toEqual(["header"]);
    expect(metadata.resource_name).toBe("Artcraft");
    expect(typeof metadata.resource).toBe("string");
    expect(metadata.resource).toMatch(new RegExp(`^${ORIGIN}`));
  });

  it("derives the MCP endpoint as the resource on the path-specific document", async () => {
    const metadata = await json("/.well-known/oauth-protected-resource/mcp");
    expect(metadata.resource).toBe(`${ORIGIN}/mcp`);
    expect(metadata.authorization_servers).toEqual([ORIGIN]);
  });
});

describe("authorization server metadata (RFC 8414)", () => {
  it("advertises exactly what Claude and ChatGPT need to pick CIMD and S256 PKCE", async () => {
    const metadata = await json("/.well-known/oauth-authorization-server");
    expect(metadata.issuer).toBe(ORIGIN);
    expect(metadata.authorization_endpoint).toBe(`${ORIGIN}${OAUTH_ENDPOINTS.authorize}`);
    expect(metadata.token_endpoint).toBe(`${ORIGIN}${OAUTH_ENDPOINTS.token}`);
    expect(metadata.registration_endpoint).toBe(`${ORIGIN}${OAUTH_ENDPOINTS.register}`);
    expect(metadata.code_challenge_methods_supported).toEqual(["S256"]);
    expect(metadata.client_id_metadata_document_supported).toBe(true);
    expect(metadata.token_endpoint_auth_methods_supported).toContain("none");
    expect(metadata.authorization_response_iss_parameter_supported).toBe(true);
    expect(metadata.scopes_supported).toEqual([...SCOPES]);
    expect(metadata.response_types_supported).toEqual(["code"]);
    expect(metadata.grant_types_supported).toEqual(
      expect.arrayContaining(["authorization_code", "refresh_token"]),
    );
    expect(typeof metadata.revocation_endpoint).toBe("string");
  });
});

describe("the authorization endpoint before sign-in exists", () => {
  it("renders a malformed request locally as 400", async () => {
    const response = await call(`${OAUTH_ENDPOINTS.authorize}?response_type=code`);
    expect(response.status).toBe(400);
    expect(await response.text()).toMatch(/^Invalid authorization request/);
  });

  it("renders an unknown client locally as 400 and never redirects", async () => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "does-not-exist",
      redirect_uri: "https://client.example/callback",
      state: "s",
      code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      code_challenge_method: "S256",
    });
    const response = await call(`${OAUTH_ENDPOINTS.authorize}?${params.toString()}`);
    expect(response.status).toBe(400);
    expect(response.headers.get("location")).toBeNull();
  });

  it("validates a registered client's request and then stops with 501 — never auto-approves", async () => {
    const registration = await call(OAUTH_ENDPOINTS.register, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: "Test client",
        redirect_uris: ["https://client.example/callback"],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      }),
    });
    expect(registration.status).toBe(201);
    const client = await registration.json<{ client_id: string }>();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: client.client_id,
      redirect_uri: "https://client.example/callback",
      scope: "read:account read:jobs",
      state: "s",
      code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      code_challenge_method: "S256",
      resource: `${ORIGIN}/mcp`,
    });
    const response = await call(`${OAUTH_ENDPOINTS.authorize}?${params.toString()}`);
    expect(response.status).toBe(501);
    expect(response.headers.get("location")).toBeNull();
  });
});
