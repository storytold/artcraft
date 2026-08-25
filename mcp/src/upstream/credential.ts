import { z } from "zod";

/**
 * What this service holds on a user's behalf and how it is attached to an upstream request.
 *
 * Today there is one kind — an Artcraft session (the `signed_session` JWT returned by
 * `POST /v1/login` / `google_sso`), sent as the `session` header. The interface exists so a
 * stronger backend-issued credential can replace it later without touching tools or the
 * client (mcp/CLAUDE.md → Architecture, swap point 2). `kind` is stored in grant props from
 * day one; nothing outside this module may assume "session".
 *
 * Revocation (`POST /v1/logout` with the session header) is performed by the auth module
 * through the upstream client; it is not a method here so the credential stays a value.
 */

export const SESSION_HEADER_NAME = "session";

export type CredentialKind = "session";

export interface UpstreamCredential {
  readonly kind: CredentialKind;
  /** Attach the credential to an outgoing upstream request. Replaces any existing value. */
  applyTo(headers: Headers): void;
  /** The serialisable form kept (encrypted) in grant props. Contains the secret — never log. */
  toProps(): CredentialProps;
  /** Safe for logs and error messages: names the kind, never the secret. */
  describe(): string;
  /** Accidental string or JSON conversion must yield `describe()`, never the secret. */
  toString(): string;
  toJSON(): string;
}

const SessionPropsSchema = z.object({
  kind: z.literal("session"),
  signedSession: z.string().min(1),
});

const CredentialPropsSchema = z.discriminatedUnion("kind", [SessionPropsSchema]);

export type CredentialProps = z.infer<typeof CredentialPropsSchema>;

export class CredentialError extends Error {
  override readonly name = "CredentialError";
}

/** Build a session credential from the `signed_session` value returned by sign-in. */
export function createSessionCredential(signedSession: string): UpstreamCredential {
  assertHeaderSafe(signedSession);
  return new SessionCredential(signedSession);
}

/** Rebuild a credential from grant props. Unknown kinds are an error, not a fallthrough. */
export function credentialFromProps(props: unknown): UpstreamCredential {
  const parsed = CredentialPropsSchema.safeParse(props);
  if (!parsed.success) {
    throw new CredentialError("grant props do not hold a recognised upstream credential");
  }
  return createSessionCredential(parsed.data.signedSession);
}

class SessionCredential implements UpstreamCredential {
  readonly kind = "session" as const;
  readonly #signedSession: string;

  constructor(signedSession: string) {
    this.#signedSession = signedSession;
  }

  applyTo(headers: Headers): void {
    headers.set(SESSION_HEADER_NAME, this.#signedSession);
  }

  toProps(): CredentialProps {
    return { kind: this.kind, signedSession: this.#signedSession };
  }

  describe(): string {
    return "session credential";
  }

  toString(): string {
    return this.describe();
  }

  toJSON(): string {
    return this.describe();
  }
}

/** A header value must be a single line of visible ASCII; anything else is rejected outright. */
function assertHeaderSafe(value: string): void {
  if (value.length === 0) throw new CredentialError("session credential is empty");
  if (!/^[\x21-\x7e]+$/.test(value)) {
    throw new CredentialError("session credential contains whitespace or non-ASCII characters");
  }
}
