import { OAuthError } from "@cloudflare/workers-oauth-provider";
import { z } from "zod";

/**
 * Absolute grant lifetime. The library bounds tokens (1h access, 30d idle refresh) but a grant
 * that keeps being refreshed would live forever, holding an upstream session that cannot be
 * refreshed — only held or deleted. So every token issuance re-checks the grant's age from
 * `grantIssuedAt` in its (encrypted) props and fails closed with `invalid_grant`, which is what
 * Claude expects when a refresh is no longer valid.
 *
 * Props without a timestamp are treated as expired: fail closed, never open.
 */

/**
 * Absolute lifetime of a grant regardless of refresh activity: 90 days. Also the runway for
 * swapping the upstream credential later (mcp/CLAUDE.md → Lifetimes).
 */
export const GRANT_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** Props key holding the grant's issue time (epoch ms); set by consent, checked on every exchange. */
export const GRANT_ISSUED_AT_PROP = "grantIssuedAt";

const IssuedAtSchema = z.object({ [GRANT_ISSUED_AT_PROP]: z.number().int().positive() });

export function assertGrantWithinMaxAge(
  props: unknown,
  nowMs: number,
  maxAgeSeconds: number = GRANT_MAX_AGE_SECONDS,
): void {
  const parsed = IssuedAtSchema.safeParse(props);
  if (!parsed.success) {
    throw new OAuthError("invalid_grant", {
      description: "grant has no issue time and is treated as expired",
    });
  }
  const ageMs = nowMs - parsed.data[GRANT_ISSUED_AT_PROP];
  if (ageMs > maxAgeSeconds * 1000) {
    throw new OAuthError("invalid_grant", {
      description: "grant is older than the maximum lifetime; the user must connect again",
    });
  }
}
