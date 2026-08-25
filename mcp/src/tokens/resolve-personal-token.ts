import type {
  ResolveExternalTokenInput,
  ResolveExternalTokenResult,
} from "@cloudflare/workers-oauth-provider";

import type { GrantProps } from "../auth/finish-authorization";
import { GRANT_ISSUED_AT_PROP } from "../auth/grant-age";
import { MCP_ROUTES } from "../auth/resource";
import { createPersonalTokenStore, isPersonalTokenSecret } from "./personal-token-store";

/**
 * The provider's `resolveExternalToken` hook: every bearer that is not one of its own access
 * tokens lands here. A personal token resolves to the same props a grant carries, so the
 * protected handler builds the same `Principal` and never learns which kind of token it was.
 *
 * Anything else — a foreign token, a revoked or expired one, a typo — is `null`, which the
 * provider answers with the standard `401 invalid_token` challenge. No distinct message for
 * "expired" versus "unknown": the record is gone from KV either way, and telling the two apart
 * would only help someone probing for tokens.
 */
export async function resolvePersonalToken(
  input: ResolveExternalTokenInput,
  nowMs: number = Date.now(),
): Promise<ResolveExternalTokenResult | null> {
  if (!isPersonalTokenSecret(input.token)) return null;
  const record = await createPersonalTokenStore(input.env.OAUTH_KV).resolve(input.token, nowMs);
  if (!record) return null;
  const props: GrantProps = {
    credential: record.credential,
    [GRANT_ISSUED_AT_PROP]: record.createdAt,
    userToken: record.userToken,
    username: record.username,
    displayName: record.displayName,
    scopes: record.scopes,
  };
  // Same binding as an access token: this origin's MCP endpoint, nothing else.
  return { props, audience: `${new URL(input.request.url).origin}${MCP_ROUTES[0]}` };
}
