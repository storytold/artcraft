import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import {
  clearedUiSessionCookieHeader,
  createUiSessionStore,
  readUiSessionCookie,
  UI_SESSION_COOKIE_NAME,
  uiSessionCookieHeader,
} from "../../src/pages/ui-session";

const store = createUiSessionStore(env.OAUTH_KV);
const SESSION = { userToken: "user_ui", username: "ui" };

describe("ui session store", () => {
  it("creates, reads back, and destroys a session", async () => {
    const id = await store.create(SESSION);
    expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await store.read(id)).toEqual(SESSION);
    await store.destroy(id);
    expect(await store.read(id)).toBeUndefined();
  });

  it("never confuses two sessions", async () => {
    const a = await store.create(SESSION);
    const b = await store.create({ userToken: "user_other", username: "other" });
    expect(a).not.toBe(b);
    expect((await store.read(b))?.userToken).toBe("user_other");
  });

  it("ignores missing, malformed, or unknown ids", async () => {
    expect(await store.read(undefined)).toBeUndefined();
    expect(await store.read("short")).toBeUndefined();
    expect(await store.read("x".repeat(43))).toBeUndefined();
    await expect(store.destroy("../grant:evil")).resolves.toBeUndefined();
  });

  it("stores under its own key prefix, never a provider key", async () => {
    const id = await store.create(SESSION);
    const keys = await env.OAUTH_KV.list({ prefix: "mcpui:session:" });
    expect(keys.keys.some((k) => k.name === `mcpui:session:${id}`)).toBe(true);
    const value = await env.OAUTH_KV.get(`mcpui:session:${id}`);
    expect(value).not.toContain("eyJ"); // no JWT-looking secret in here, ever
  });
});

describe("ui session cookie", () => {
  it("round-trips and is scoped to /connections", () => {
    const header = uiSessionCookieHeader("a".repeat(43), true);
    expect(header).toBe(
      `${UI_SESSION_COOKIE_NAME}=${"a".repeat(43)}; Path=/connections; Max-Age=900; HttpOnly; SameSite=Lax; Secure`,
    );
    const request = new Request("https://mcp.test/connections", {
      headers: { cookie: `other=1; ${UI_SESSION_COOKIE_NAME}=${"a".repeat(43)}` },
    });
    expect(readUiSessionCookie(request)).toBe("a".repeat(43));
    expect(clearedUiSessionCookieHeader()).toContain("Max-Age=0");
  });
});
