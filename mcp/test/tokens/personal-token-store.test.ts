import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { SCOPES } from "../../src/auth/oauth";
import {
  createPersonalTokenStore,
  isPersonalTokenSecret,
  PERSONAL_TOKEN_LABEL_MAX_LENGTH,
  PERSONAL_TOKEN_MAX_TTL_SECONDS,
  PERSONAL_TOKENS_PER_USER_LIMIT,
  PersonalTokenError,
} from "../../src/tokens/personal-token-store";
import { SIGNED_SESSION } from "../helpers/fixtures";

const store = createPersonalTokenStore(env.OAUTH_KV);
const NOW = 1_800_000_000_000;
const DAY_SECONDS = 24 * 60 * 60;

let counter = 0;
/** Every test gets its own user so parallel tests never share an index. */
function user(prefix = "user_pat") {
  counter += 1;
  return {
    userToken: `${prefix}_${String(counter)}`,
    username: "pat-owner",
    displayName: "PAT Owner",
    credential: { kind: "session" as const, signedSession: SIGNED_SESSION },
  };
}

function create(owner = user(), overrides: Partial<{ label: string; ttlSeconds: number }> = {}) {
  return store.create({
    user: owner,
    label: "OpenAI Responses",
    ttlSeconds: 30 * DAY_SECONDS,
    nowMs: NOW,
    ...overrides,
  });
}

describe("personal token store", () => {
  describe("minting and resolving", () => {
    it("mints a prefixed secret and resolves it to the full record", async () => {
      const owner = user();
      const { secret, summary } = await create(owner);
      expect(secret).toMatch(/^artcraft_pat_[A-Za-z0-9_-]{43}$/);
      expect(isPersonalTokenSecret(secret)).toBe(true);
      expect(summary.hint).toBe(`artcraft_pat_…${secret.slice(-4)}`);
      expect(summary.expiresAt).toBe(NOW + 30 * DAY_SECONDS * 1000);

      const record = await store.resolve(secret, NOW + 1000);
      expect(record).toMatchObject({
        id: summary.id,
        userToken: owner.userToken,
        username: "pat-owner",
        displayName: "PAT Owner",
        scopes: [...SCOPES],
        credential: { kind: "session", signedSession: SIGNED_SESSION },
        label: "OpenAI Responses",
        createdAt: NOW,
      });
    });

    it("resolves nothing for a wrong, malformed, or empty secret", async () => {
      const { secret } = await create();
      const flipped = secret.slice(0, -1) + (secret.endsWith("A") ? "B" : "A");
      expect(await store.resolve(flipped, NOW)).toBeUndefined();
      expect(await store.resolve(secret.slice(0, -1), NOW)).toBeUndefined();
      expect(await store.resolve("", NOW)).toBeUndefined();
      expect(await store.resolve("user:grant:secret", NOW)).toBeUndefined();
      expect(isPersonalTokenSecret("artcraft_pat_short")).toBe(false);
    });

    it("stops resolving once the token has expired", async () => {
      const { secret } = await create(user(), { ttlSeconds: 60 });
      expect(await store.resolve(secret, NOW + 59_000)).toBeDefined();
      expect(await store.resolve(secret, NOW + 60_000)).toBeUndefined();
    });
  });

  describe("at rest", () => {
    it("keeps the session and identity unreadable without the secret", async () => {
      const owner = user();
      const { secret } = await create(owner);
      const records = await env.OAUTH_KV.list({ prefix: "mcppat:token:" });
      expect(records.keys.length).toBeGreaterThan(0);
      for (const { name } of records.keys) {
        const raw = await env.OAUTH_KV.get(name);
        expect(raw).not.toContain(SIGNED_SESSION);
        expect(raw).not.toContain("pat-owner");
        expect(raw).not.toContain(secret);
        expect(name).not.toContain(secret);
      }
      const index = await env.OAUTH_KV.get(`mcppat:user:${owner.userToken}`);
      expect(index).not.toBeNull();
      expect(index).not.toContain(SIGNED_SESSION);
      expect(index).not.toContain(secret.slice(13, 30)); // no more than the 4-char hint
    });

    it("expires the record from KV with the token", async () => {
      const { secret } = await create(user(), { ttlSeconds: 60 });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
      const key =
        "mcppat:token:" +
        Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      const listed = (await env.OAUTH_KV.list({ prefix: key })).keys;
      expect(listed).toHaveLength(1);
      expect(listed[0]?.expiration).toBeDefined();
    });
  });

  describe("listing and revoking", () => {
    it("lists a user's live tokens newest first, without secrets", async () => {
      const owner = user();
      const first = await create(owner, { label: "first" });
      const second = await store.create({
        user: owner,
        label: "second",
        ttlSeconds: DAY_SECONDS,
        nowMs: NOW + 1000,
      });
      const listed = await store.list(owner.userToken, NOW + 2000);
      expect(listed.map((entry) => entry.label)).toEqual(["second", "first"]);
      expect(Object.keys(listed[0] ?? {}).sort()).toEqual(
        ["createdAt", "expiresAt", "hint", "id", "label"].sort(),
      );
      expect(JSON.stringify(listed)).not.toContain(first.secret);
      expect(JSON.stringify(listed)).not.toContain(second.secret);
    });

    it("hides expired tokens from the list", async () => {
      const owner = user();
      await create(owner, { label: "short", ttlSeconds: 60 });
      await create(owner, { label: "long" });
      expect((await store.list(owner.userToken, NOW + 61_000)).map((t) => t.label)).toEqual([
        "long",
      ]);
    });

    it("revokes a token so it neither resolves nor lists", async () => {
      const owner = user();
      const { secret, summary } = await create(owner);
      expect(await store.revoke(owner.userToken, summary.id)).toBe(true);
      expect(await store.resolve(secret, NOW)).toBeUndefined();
      expect(await store.list(owner.userToken, NOW)).toEqual([]);
      expect(await store.revoke(owner.userToken, summary.id)).toBe(false);
    });

    it("cannot revoke another user's token", async () => {
      const owner = user();
      const other = user("user_other");
      const { secret, summary } = await create(owner);
      expect(await store.revoke(other.userToken, summary.id)).toBe(false);
      expect(await store.resolve(secret, NOW)).toBeDefined();
    });

    it("returns an empty list for a user with no tokens", async () => {
      expect(await store.list("user_nobody", NOW)).toEqual([]);
    });
  });

  describe("guardrails", () => {
    it("rejects a lifetime beyond 90 days, zero, or fractional", async () => {
      const owner = user();
      for (const ttlSeconds of [PERSONAL_TOKEN_MAX_TTL_SECONDS + 1, 0, -1, 1.5]) {
        const attempt = create(owner, { ttlSeconds });
        await expect(attempt).rejects.toBeInstanceOf(PersonalTokenError);
        await expect(attempt).rejects.toMatchObject({ reason: "ttl" });
      }
      expect(PERSONAL_TOKEN_MAX_TTL_SECONDS).toBe(90 * DAY_SECONDS);
      await expect(
        create(owner, { ttlSeconds: PERSONAL_TOKEN_MAX_TTL_SECONDS }),
      ).resolves.toBeDefined();
    });

    it("rejects an empty or oversized label", async () => {
      const owner = user();
      await expect(create(owner, { label: "   " })).rejects.toMatchObject({ reason: "label" });
      await expect(
        create(owner, { label: "x".repeat(PERSONAL_TOKEN_LABEL_MAX_LENGTH + 1) }),
      ).rejects.toMatchObject({ reason: "label" });
      const { summary } = await create(owner, { label: "  trimmed  " });
      expect(summary.label).toBe("trimmed");
    });

    it("caps live tokens per account, not counting expired ones", async () => {
      const owner = user();
      await create(owner, { label: "expired", ttlSeconds: 60 });
      for (let i = 0; i < PERSONAL_TOKENS_PER_USER_LIMIT; i += 1) {
        await store.create({
          user: owner,
          label: `token ${String(i)}`,
          ttlSeconds: DAY_SECONDS,
          nowMs: NOW + 61_000,
        });
      }
      await expect(
        store.create({
          user: owner,
          label: "one too many",
          ttlSeconds: DAY_SECONDS,
          nowMs: NOW + 61_000,
        }),
      ).rejects.toMatchObject({ reason: "limit" });
    });
  });
});
