import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "../../src/auth/authenticator";
import { finishAuthorization } from "../../src/auth/finish-authorization";
import { OAUTH_ENDPOINTS } from "../../src/auth/oauth";
import worker, { oauthProviderOptions } from "../../src/index";
import { createSessionCredential } from "../../src/upstream/credential";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SEEDED_USER } from "../../fake-upstream/src/state";
import {
  authorizeUrl,
  call,
  exchangeCode,
  ORIGIN,
  pkce,
  type TokenResponse,
} from "../helpers/oauth-client";

/**
 * The protected route end to end: the SDK's real Client and Streamable HTTP transport, routed
 * into the Worker's fetch, with the fake upstream served in-process for the tool's calls.
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

/** Routes the MCP client's HTTP into the Worker, exactly as a real client would over the network. */
async function workerFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request(url, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

/** Sign the seeded user into the fake and consent as them; returns a bearer for /mcp. */
async function connectAsSeededUser(scopes = "read:account read:jobs read:catalog") {
  const registration = await call(OAUTH_ENDPOINTS.register, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Handler test client",
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
        scope: scopes,
        state: "h",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: `${ORIGIN}/mcp`,
      }),
    ),
  );
  const client = await helpers.lookupClient(client_id);
  if (!client) throw new Error("client not found");
  const redirect = new URL(await finishAuthorization(helpers, authRequest, client, user));
  const exchanged = await exchangeCode(
    client_id,
    redirect.searchParams.get("code") ?? "",
    verifier,
    REDIRECT_URI,
  );
  const tokens = await exchanged.json<TokenResponse>();
  return { accessToken: tokens.access_token, signedSession: signed_session };
}

async function mcpClient(accessToken?: string) {
  const transport = new StreamableHTTPClientTransport(new URL(`${ORIGIN}/mcp`), {
    fetch: workerFetch,
    ...(accessToken
      ? { requestInit: { headers: { authorization: `Bearer ${accessToken}` } } }
      : {}),
  });
  const client = new Client({ name: "handler-test", version: "0.0.0" });
  // The SDK declares the client transport's optional fields as `T | undefined`, which
  // exactOptionalPropertyTypes rejects against `Transport`; the runtime shape is the same.
  await client.connect(transport as unknown as Transport);
  return client;
}

describe("the protected MCP route", () => {
  it("serves a real MCP client: initialize, list tools, call get_credit_balance", async () => {
    const { accessToken } = await connectAsSeededUser();
    const client = await mcpClient(accessToken);
    expect(client.getServerVersion()?.name).toBe("artcraft");

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(["get_credit_balance"]);

    const result = await client.callTool({ name: "get_credit_balance", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      free_credits: 0,
      monthly_credits: 500,
      banked_credits: 120,
      total_credits: 620,
      subscription: {
        product_slug: "artcraft_creator_monthly",
        next_bill_at: "2026-09-24T00:00:00Z",
        ends_at: null,
      },
    });
    await client.close();
  });

  it("lists nothing for a grant without read:account, but still answers", async () => {
    const { accessToken } = await connectAsSeededUser("read:catalog");
    const client = await mcpClient(accessToken);
    expect((await client.listTools()).tools).toEqual([]);
    await client.close();
  });

  it("refuses an unauthenticated client at the transport with 401", async () => {
    await expect(mcpClient()).rejects.toThrow();
    const raw = await workerFetch(`${ORIGIN}/mcp`, { method: "POST" });
    expect(raw.status).toBe(401);
  });

  it("refuses a grant whose props this build cannot read with 403", async () => {
    const registration = await call(OAUTH_ENDPOINTS.register, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: "Legacy grant client",
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code"],
        response_types: ["code"],
      }),
    });
    const { client_id } = await registration.json<{ client_id: string }>();
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const { verifier, challenge } = await pkce();
    const authRequest = await helpers.parseAuthRequest(
      new Request(
        authorizeUrl({
          response_type: "code",
          client_id,
          redirect_uri: REDIRECT_URI,
          state: "legacy",
          code_challenge: challenge,
          code_challenge_method: "S256",
          resource: `${ORIGIN}/mcp`,
        }),
      ),
    );
    const { redirectTo } = await helpers.completeAuthorization({
      request: authRequest,
      userId: "user_legacy",
      metadata: {},
      scope: ["read:account"],
      props: { legacy: true, grantIssuedAt: Date.now() },
    });
    const code = new URL(redirectTo).searchParams.get("code") ?? "";
    const tokens = await (
      await exchangeCode(client_id, code, verifier, REDIRECT_URI)
    ).json<TokenResponse>();
    const raw = await workerFetch(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
    expect(raw.status).toBe(403);
  });

  it("revokes the grant once the upstream session is gone, so the next request re-authorizes", async () => {
    const { accessToken, signedSession } = await connectAsSeededUser();
    const client = await mcpClient(accessToken);
    expect(
      (await client.callTool({ name: "get_credit_balance", arguments: {} })).isError,
    ).toBeFalsy();

    // The user signs out of Artcraft (or the session is deleted): the fake forgets it.
    await fakeUpstream.request("/v1/logout", {
      method: "POST",
      headers: { session: signedSession },
    });

    const failed = await client.callTool({ name: "get_credit_balance", arguments: {} });
    expect(failed.isError).toBe(true);
    expect(JSON.stringify(failed.content)).toMatch(/no longer valid/);

    const afterwards = await workerFetch(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: "{}",
    });
    expect(afterwards.status).toBe(401);
    await client.close();
  });

  it("points the legacy /sse route at /mcp without demanding a token", async () => {
    const raw = await workerFetch(`${ORIGIN}/sse`);
    expect(raw.status).toBe(405);
    expect(await raw.json()).toMatchObject({ mcp_endpoint: `${ORIGIN}/mcp` });
  });
});
