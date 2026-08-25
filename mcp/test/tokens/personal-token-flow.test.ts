import { env } from "cloudflare:workers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createPersonalTokenStore } from "../../src/tokens/personal-token-store";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SEEDED_USER } from "../../fake-upstream/src/state";
import { call, mcpInitialize } from "../helpers/oauth-client";

/**
 * A personal token through the real Worker, the way the Responses API or the Messages API
 * connector would present it: a static `Authorization: Bearer` with no OAuth dance. The fake
 * upstream is served in-process; the token carries a session the seeded user really signed in
 * for.
 */

const LOCAL_UPSTREAM = "http://localhost:12345";
const fakeUpstream = createFakeUpstream();
const store = createPersonalTokenStore(env.OAUTH_KV);

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

/** Sign the seeded user into the fake (as creation does) and mint a token holding that session. */
async function mintForSeededUser(): Promise<{ secret: string; id: string; signedSession: string }> {
  const login = await fakeUpstream.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    }),
  });
  const { signed_session } = await login.json<{ signed_session: string }>();
  const { secret, summary } = await store.create({
    user: {
      userToken: SEEDED_USER.userToken,
      username: SEEDED_USER.username,
      displayName: SEEDED_USER.displayName,
      credential: { kind: "session", signedSession: signed_session },
    },
    label: "flow test",
    ttlSeconds: 3600,
    nowMs: Date.now(),
  });
  return { secret, id: summary.id, signedSession: signed_session };
}

async function callTool(bearer: string, name: string): Promise<Response> {
  return call("/mcp", {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name, arguments: {} },
    }),
  });
}

interface ToolCallResponse {
  result?: { isError?: boolean; structuredContent?: { username?: string } };
}

describe("a personal token at the protected route", () => {
  it("initializes and calls tools exactly like an access token", async () => {
    const { secret } = await mintForSeededUser();
    const init = await mcpInitialize(secret);
    expect(init.status).toBe(200);
    expect(await init.text()).toContain('"name":"artcraft"');

    const account = await callTool(secret, "get_account");
    expect(account.status).toBe(200);
    const body = await account.json<ToolCallResponse>();
    expect(body.result?.isError).toBeFalsy();
    expect(body.result?.structuredContent?.username).toBe(SEEDED_USER.username);
  });

  it("is refused with the standard challenge once revoked, unknown, or malformed", async () => {
    const { secret, id } = await mintForSeededUser();
    expect((await mcpInitialize(secret)).status).toBe(200);
    await store.revoke(SEEDED_USER.userToken, id);
    const revoked = await mcpInitialize(secret);
    expect(revoked.status).toBe(401);
    expect(revoked.headers.get("www-authenticate")).toContain('error="invalid_token"');

    for (const bearer of [`artcraft_pat_${"B".repeat(43)}`, "artcraft_pat_nope", "not-a-token"]) {
      expect((await mcpInitialize(bearer)).status).toBe(401);
    }
  });

  it("is deleted once upstream no longer accepts its session, so the next call is a 401", async () => {
    const { secret, signedSession } = await mintForSeededUser();
    expect((await mcpInitialize(secret)).status).toBe(200);

    // The user signs out of Artcraft elsewhere: the fake forgets the session.
    await fakeUpstream.request("/v1/logout", {
      method: "POST",
      headers: { session: signedSession },
    });

    const failed = await callTool(secret, "get_credit_balance");
    expect(failed.status).toBe(200);
    expect((await failed.json<ToolCallResponse>()).result?.isError).toBe(true);

    expect((await mcpInitialize(secret)).status).toBe(401);
    expect(await store.list(SEEDED_USER.userToken, Date.now())).not.toContainEqual(
      expect.objectContaining({ label: "flow test", hint: `artcraft_pat_…${secret.slice(-4)}` }),
    );
  });
});
