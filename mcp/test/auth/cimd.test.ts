import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { SCOPES } from "../../src/auth/oauth";
import { oauthProviderOptions } from "../../src/index";
import { createSessionCredential } from "../../src/upstream/credential";
import {
  authorizeUrl,
  call,
  callMcp,
  exchangeCode,
  ORIGIN,
  pkce,
  type TokenResponse,
} from "../helpers/oauth-client";

/**
 * Client ID Metadata Documents — the registration path Claude.ai, ChatGPT, and Claude Code
 * prefer: the client_id is an HTTPS URL serving a JSON document, which the provider fetches
 * and validates. Tests and the Worker share one isolate, so stubbing the global fetch
 * intercepts the provider's outbound CIMD fetch; every other host is refused. Each test uses
 * its own document URL so the provider's metadata cache cannot bleed across tests.
 */

const CLIENT_ORIGIN = "https://client.example";
const CALLBACK = `${CLIENT_ORIGIN}/callback`;
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

const documents = new Map<string, { status: number; body: string }>();

beforeAll(() => {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(new Request(input, init).url);
    const served = documents.get(url.href);
    if (url.origin !== CLIENT_ORIGIN || !served) {
      return Promise.reject(new Error(`outbound fetch refused in tests: ${url.href}`));
    }
    return Promise.resolve(
      new Response(served.body, {
        status: served.status,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      }),
    );
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function serveMetadata(path: string, document: unknown, status = 200): string {
  const clientId = `${CLIENT_ORIGIN}${path}`;
  documents.set(clientId, { status, body: JSON.stringify(document) });
  return clientId;
}

function metadataDocument(clientId: string, redirectUris: string[]): Record<string, unknown> {
  return {
    client_id: clientId,
    client_name: "Claude (test)",
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  };
}

async function consentAs(clientId: string, redirectUri: string, challenge: string): Promise<URL> {
  const helpers = getOAuthApi(oauthProviderOptions, env);
  const authRequest = await helpers.parseAuthRequest(
    new Request(
      authorizeUrl({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: SCOPES.join(" "),
        state: "cimd-state",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: `${ORIGIN}/mcp`,
      }),
    ),
  );
  const { redirectTo } = await helpers.completeAuthorization({
    request: authRequest,
    userId: "user_cimd",
    metadata: { clientName: "Claude (test)" },
    scope: [...SCOPES],
    props: {
      credential: createSessionCredential(SIGNED_SESSION).toProps(),
      grantIssuedAt: Date.now(),
    },
  });
  return new URL(redirectTo);
}

describe("CIMD clients", () => {
  it("resolves the client from its metadata URL and completes the whole loop with client_id = URL", async () => {
    const clientId = serveMetadata(
      "/oauth/client-a.json",
      metadataDocument(`${CLIENT_ORIGIN}/oauth/client-a.json`, [CALLBACK]),
    );
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const client = await helpers.lookupClient(clientId);
    expect(client?.clientName).toBe("Claude (test)");
    expect(client?.redirectUris).toEqual([CALLBACK]);

    const { verifier, challenge } = await pkce();
    const redirect = await consentAs(clientId, CALLBACK, challenge);
    expect(redirect.searchParams.get("state")).toBe("cimd-state");

    const exchanged = await exchangeCode(
      clientId,
      redirect.searchParams.get("code") ?? "",
      verifier,
      CALLBACK,
    );
    expect(exchanged.status).toBe(200);
    const tokens = await exchanged.json<TokenResponse>();
    expect((await callMcp(tokens.access_token)).status).toBe(501);
  });

  it("accepts Claude Code's loopback redirect on any port (RFC 8252)", async () => {
    const clientId = serveMetadata(
      "/oauth/client-loopback.json",
      metadataDocument(`${CLIENT_ORIGIN}/oauth/client-loopback.json`, [
        "http://localhost/callback",
        "http://127.0.0.1/callback",
      ]),
    );
    const { challenge } = await pkce();
    const viaLocalhost = await consentAs(clientId, "http://localhost:3118/callback", challenge);
    expect(viaLocalhost.origin + viaLocalhost.pathname).toBe("http://localhost:3118/callback");
    const viaLoopbackIp = await consentAs(clientId, "http://127.0.0.1:41234/callback", challenge);
    expect(viaLoopbackIp.origin + viaLoopbackIp.pathname).toBe("http://127.0.0.1:41234/callback");
  });

  it("still requires an exact match for non-loopback redirect URIs", async () => {
    const clientId = serveMetadata(
      "/oauth/client-strict.json",
      metadataDocument(`${CLIENT_ORIGIN}/oauth/client-strict.json`, [CALLBACK]),
    );
    const { challenge } = await pkce();
    await expect(
      consentAs(clientId, `${CLIENT_ORIGIN}/other-callback`, challenge),
    ).rejects.toThrow();
    await expect(
      consentAs(clientId, `${CLIENT_ORIGIN}:8443/callback`, challenge),
    ).rejects.toThrow();
  });

  it("renders locally, without redirecting, when the metadata document cannot be fetched", async () => {
    const clientId = serveMetadata("/oauth/missing.json", { error: "not here" }, 404);
    const response = await call(
      authorizeUrl({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CALLBACK,
        state: "s",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        code_challenge_method: "S256",
      }).slice(ORIGIN.length),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).toMatch(/metadata document/);
  });

  it("rejects a document whose client_id does not match its own URL", async () => {
    const clientId = serveMetadata(
      "/oauth/impostor.json",
      metadataDocument(`${CLIENT_ORIGIN}/oauth/someone-else.json`, [CALLBACK]),
    );
    const response = await call(
      authorizeUrl({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CALLBACK,
        state: "s",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        code_challenge_method: "S256",
      }).slice(ORIGIN.length),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("location")).toBeNull();
  });
});
