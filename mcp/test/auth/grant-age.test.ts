import { OAuthError } from "@cloudflare/workers-oauth-provider";
import { describe, expect, it } from "vitest";

import {
  assertGrantWithinMaxAge,
  GRANT_ISSUED_AT_PROP,
  GRANT_MAX_AGE_SECONDS,
} from "../../src/auth/grant-age";

const NOW = 1_800_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_MS = GRANT_MAX_AGE_SECONDS * 1000;

function check(props: unknown, maxAgeSeconds?: number): () => void {
  return () => {
    assertGrantWithinMaxAge(props, NOW, maxAgeSeconds);
  };
}

function issuedAt(ageMs: number): { [GRANT_ISSUED_AT_PROP]: number } {
  return { [GRANT_ISSUED_AT_PROP]: NOW - ageMs };
}

describe("assertGrantWithinMaxAge", () => {
  it("passes a fresh grant", () => {
    expect(check(issuedAt(0))).not.toThrow();
  });

  it("passes a grant one second inside the limit", () => {
    expect(check(issuedAt(MAX_AGE_MS - 1000))).not.toThrow();
  });

  it("fires one second past the limit with invalid_grant", () => {
    expect(check(issuedAt(MAX_AGE_MS + 1000))).toThrow(OAuthError);
    expect(check(issuedAt(MAX_AGE_MS + 1000))).toThrow(/older than the maximum lifetime/);
    try {
      check(issuedAt(MAX_AGE_MS + 1000))();
    } catch (error) {
      expect(error).toBeInstanceOf(OAuthError);
      expect((error as OAuthError).code).toBe("invalid_grant");
    }
  });

  it("uses 90 days as the default maximum", () => {
    expect(GRANT_MAX_AGE_SECONDS).toBe(90 * 24 * 60 * 60);
    expect(check(issuedAt(89 * DAY_MS))).not.toThrow();
    expect(check(issuedAt(91 * DAY_MS))).toThrow(OAuthError);
  });

  it("fails closed when the timestamp is missing or malformed", () => {
    const malformed: unknown[] = [
      {},
      null,
      undefined,
      { [GRANT_ISSUED_AT_PROP]: "yesterday" },
      { [GRANT_ISSUED_AT_PROP]: -1 },
      { [GRANT_ISSUED_AT_PROP]: 1.5 },
    ];
    for (const props of malformed) {
      expect(check(props)).toThrow(/no issue time/);
    }
  });

  it("honours an explicit maximum", () => {
    expect(check(issuedAt(2 * DAY_MS), DAY_MS / 1000)).toThrow(OAuthError);
    expect(check(issuedAt(2 * DAY_MS), (3 * DAY_MS) / 1000)).not.toThrow();
  });
});
