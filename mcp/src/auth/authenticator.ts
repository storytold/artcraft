import { createUpstreamClient } from "../upstream/client";
import { createSessionCredential, type UpstreamCredential } from "../upstream/credential";

/**
 * The `Authenticator` seam (mcp/CLAUDE.md → Architecture, swap point 1): turns what the user
 * submitted on the consent page into an upstream credential plus the identity it belongs to.
 *
 * M1 signs the user in on the MCP host by proxying Artcraft's own sign-in endpoints; the
 * planned webapp hand-off is a second *entry route* that produces the same `AuthenticatedUser`
 * and then reuses `finishAuthorization` — it does not need a second method here.
 */

export type SignInSubmission =
  | { readonly method: "password"; readonly usernameOrEmail: string; readonly password: string }
  | { readonly method: "google"; readonly credential: string };

export interface AuthenticatedUser {
  /** The Artcraft user token (`user_…`); used as the grant's `userId`. */
  readonly userToken: string;
  readonly username: string;
  readonly displayName: string;
  readonly credential: UpstreamCredential;
}

export type SignInFailureReason =
  | "invalid_credentials"
  | "account_needs_password"
  | "google_rejected"
  | "not_signed_in"
  | "upstream_unavailable";

export type SignInOutcome =
  | { readonly ok: true; readonly user: AuthenticatedUser }
  | { readonly ok: false; readonly reason: SignInFailureReason; readonly message: string };

export interface Authenticator {
  authenticate(submission: SignInSubmission): Promise<SignInOutcome>;
}

export interface ArtcraftAuthenticatorOptions {
  readonly upstreamApiHost: string;
  /** Injectable for tests; defaults to the global fetch. */
  readonly fetch?: typeof globalThis.fetch;
}

const UNAVAILABLE_MESSAGE = "Artcraft could not be reached. Please try again in a moment.";

export function createArtcraftAuthenticator(options: ArtcraftAuthenticatorOptions): Authenticator {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const authClient = createUpstreamClient({
    baseUrl: options.upstreamApiHost,
    use: "auth",
    fetch: fetchImpl,
  });

  async function identify(signedSession: string): Promise<SignInOutcome> {
    const credential = createSessionCredential(signedSession);
    const readClient = createUpstreamClient({
      baseUrl: options.upstreamApiHost,
      use: "read",
      credential,
      fetch: fetchImpl,
    });
    const session = await readClient.GET("/v1/session");
    if (!session.data?.logged_in || !session.data.user) {
      return {
        ok: false,
        reason: "not_signed_in",
        message: "Sign-in did not produce a usable session. Please try again.",
      };
    }
    const { user } = session.data;
    return {
      ok: true,
      user: {
        userToken: user.user_token,
        username: user.username,
        displayName: user.display_name,
        credential,
      },
    };
  }

  async function withPassword(usernameOrEmail: string, password: string): Promise<SignInOutcome> {
    const result = await authClient.POST("/v1/login", {
      body: { username_or_email: usernameOrEmail, password },
    });
    if (result.data) return identify(result.data.signed_session);

    // openapi-fetch's result is a union: without `data`, `error` is the typed error body.
    const failure = result.error;
    if (result.response.status === 401) {
      switch (failure.error_type) {
        case "InvalidCredentials":
          return { ok: false, reason: "invalid_credentials", message: failure.error_message };
        case "AccountNeedsPassword":
          return { ok: false, reason: "account_needs_password", message: failure.error_message };
        default:
          break;
      }
    }
    return { ok: false, reason: "upstream_unavailable", message: UNAVAILABLE_MESSAGE };
  }

  async function withGoogle(credential: string): Promise<SignInOutcome> {
    const result = await authClient.POST("/v1/accounts/google_sso", {
      body: { google_credential: credential },
    });
    if (result.data) return identify(result.data.signed_session);

    const status = result.response.status;
    if (status === 400 || status === 401) {
      return {
        ok: false,
        reason: "google_rejected",
        message: result.error.message ?? "Google sign-in was not accepted. Please try again.",
      };
    }
    return { ok: false, reason: "upstream_unavailable", message: UNAVAILABLE_MESSAGE };
  }

  return {
    async authenticate(submission) {
      try {
        return submission.method === "password"
          ? await withPassword(submission.usernameOrEmail, submission.password)
          : await withGoogle(submission.credential);
      } catch {
        // Network failures and malformed upstream responses: never let details (or the
        // submission) escape into the outcome.
        return { ok: false, reason: "upstream_unavailable", message: UNAVAILABLE_MESSAGE };
      }
    },
  };
}
