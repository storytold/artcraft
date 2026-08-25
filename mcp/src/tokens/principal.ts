import { z } from "zod";

import { GRANT_ISSUED_AT_PROP } from "../auth/grant-age";
import { type Scope, SCOPES } from "../auth/oauth";
import {
  CredentialError,
  credentialFromProps,
  type UpstreamCredential,
} from "../upstream/credential";

/**
 * Who is calling, and with what — the single shape every token kind resolves to
 * (mcp/CLAUDE.md → Architecture, swap point 2/3). OAuth access tokens resolve here through the
 * provider's decrypted grant props; personal tokens (M2) will resolve here through
 * `resolveExternalToken`. Tools and the upstream client never learn which kind it was.
 */
export interface Principal {
  /** The Artcraft user token (`user_…`). */
  readonly userToken: string;
  readonly username: string;
  readonly displayName: string;
  readonly scopes: readonly Scope[];
  readonly credential: UpstreamCredential;
}

export class PrincipalError extends Error {
  override readonly name = "PrincipalError";
}

const PropsSchema = z.object({
  userToken: z.string().regex(/^user_/),
  username: z.string().min(1),
  displayName: z.string(),
  scopes: z.array(z.enum(SCOPES)),
  credential: z.unknown(),
  [GRANT_ISSUED_AT_PROP]: z.number().int().positive(),
});

/**
 * Build a `Principal` from decrypted grant props. Anything unexpected is a `PrincipalError`,
 * which the handler turns into a 403 — a valid token whose grant this build cannot read is
 * refused, never guessed at.
 */
export function principalFromProps(props: unknown): Principal {
  const parsed = PropsSchema.safeParse(props);
  if (!parsed.success) {
    throw new PrincipalError("grant props do not describe a principal this build understands");
  }
  let credential: UpstreamCredential;
  try {
    credential = credentialFromProps(parsed.data.credential);
  } catch (error) {
    if (error instanceof CredentialError) throw new PrincipalError(error.message);
    throw error;
  }
  return {
    userToken: parsed.data.userToken,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    scopes: parsed.data.scopes,
    credential,
  };
}

export function hasScope(principal: Principal, scope: Scope): boolean {
  return principal.scopes.includes(scope);
}
