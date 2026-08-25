import type { AuthRequest, ClientInfo, OAuthHelpers } from "@cloudflare/workers-oauth-provider";

import type { AuthenticatedUser } from "./authenticator";
import { GRANT_ISSUED_AT_PROP } from "./grant-age";
import { type Scope, SCOPES } from "./oauth";

/**
 * The last step of consent, shared by every way a user can sign in (the M1 form, the planned
 * webapp hand-off): decide the granted scopes, record the grant with the upstream credential
 * in its encrypted props, and hand back the redirect the client is waiting for.
 */

export interface GrantProps {
  readonly credential: ReturnType<AuthenticatedUser["credential"]["toProps"]>;
  readonly [GRANT_ISSUED_AT_PROP]: number;
  readonly username: string;
  readonly displayName: string;
}

/**
 * Requested ∩ supported. An empty request means "whatever the resource offers", which is what
 * clients that read `scopes_supported` from the protected resource metadata send.
 */
export function grantedScopes(requested: readonly string[]): Scope[] {
  if (requested.length === 0) return [...SCOPES];
  return SCOPES.filter((scope) => requested.includes(scope));
}

export async function finishAuthorization(
  helpers: OAuthHelpers,
  authRequest: AuthRequest,
  client: ClientInfo,
  user: AuthenticatedUser,
  nowMs: number = Date.now(),
): Promise<string> {
  const props: GrantProps = {
    credential: user.credential.toProps(),
    [GRANT_ISSUED_AT_PROP]: nowMs,
    username: user.username,
    displayName: user.displayName,
  };
  const { redirectTo } = await helpers.completeAuthorization({
    request: authRequest,
    userId: user.userToken,
    // Storage-visible (not encrypted): only what the connections page needs to label a grant.
    metadata: { clientName: client.clientName ?? client.clientId },
    scope: grantedScopes(authRequest.scope),
    props,
  });
  return redirectTo;
}
