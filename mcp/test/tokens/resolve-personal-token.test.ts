import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { principalFromProps } from "../../src/tokens/principal";
import { createPersonalTokenStore } from "../../src/tokens/personal-token-store";
import { resolvePersonalToken } from "../../src/tokens/resolve-personal-token";
import { SIGNED_SESSION } from "../helpers/fixtures";

const store = createPersonalTokenStore(env.OAUTH_KV);
const NOW = 1_800_000_000_000;
const OWNER = {
  userToken: "user_resolve",
  username: "resolver",
  displayName: "Resolver",
  credential: { kind: "session" as const, signedSession: SIGNED_SESSION },
};

function input(token: string, url = "https://mcp.test/mcp") {
  return { token, request: new Request(url, { method: "POST" }), env };
}

describe("resolvePersonalToken", () => {
  it("turns a live personal token into grant props the handler already understands", async () => {
    const { secret } = await store.create({
      user: OWNER,
      label: "api",
      ttlSeconds: 3600,
      nowMs: NOW,
    });
    const resolved = await resolvePersonalToken(input(secret), NOW + 1);
    expect(resolved).not.toBeNull();
    expect(resolved?.audience).toBe("https://mcp.test/mcp");

    const principal = principalFromProps(resolved?.props);
    expect(principal.userToken).toBe("user_resolve");
    expect(principal.username).toBe("resolver");
    expect(principal.scopes).toEqual(["read:account", "read:jobs", "read:catalog"]);
    const headers = new Headers();
    principal.credential.applyTo(headers);
    expect(headers.get("session")).toBe(SIGNED_SESSION);
  });

  it("binds the audience to the origin the token was presented at", async () => {
    const { secret } = await store.create({
      user: OWNER,
      label: "api",
      ttlSeconds: 3600,
      nowMs: NOW,
    });
    const resolved = await resolvePersonalToken(input(secret, "http://localhost:8787/mcp"), NOW);
    expect(resolved?.audience).toBe("http://localhost:8787/mcp");
  });

  it("answers null for foreign, unknown, revoked, and expired bearers alike", async () => {
    expect(await resolvePersonalToken(input("user:grant:secret"), NOW)).toBeNull();
    expect(await resolvePersonalToken(input("eyJhbGciOiJIUzI1NiJ9.x.y"), NOW)).toBeNull();
    expect(await resolvePersonalToken(input(`artcraft_pat_${"A".repeat(43)}`), NOW)).toBeNull();

    const { secret, summary } = await store.create({
      user: OWNER,
      label: "api",
      ttlSeconds: 60,
      nowMs: NOW,
    });
    expect(await resolvePersonalToken(input(secret), NOW + 60_000)).toBeNull();
    await store.revoke(OWNER.userToken, summary.id);
    expect(await resolvePersonalToken(input(secret), NOW)).toBeNull();
  });
});
