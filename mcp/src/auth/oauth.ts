import type { OAuthProviderOptions } from "@cloudflare/workers-oauth-provider";

import { resolvePersonalToken } from "../tokens/resolve-personal-token";
import { assertGrantWithinMaxAge } from "./grant-age";
import { MCP_ROUTES, RESOURCE_NAME, SCOPES } from "./resource";

export { MCP_ROUTES, RESOURCE_NAME, SCOPES, type Scope } from "./resource";

/**
 * Configuration of the OAuth 2.1 authorization server that fronts the MCP endpoint. The
 * library (`@cloudflare/workers-oauth-provider`) owns discovery metadata, client registration
 * (CIMD and DCR), PKCE, the token endpoint with refresh rotation, and revocation. We own the
 * `/authorize` UI (sign-in + consent, see auth/authorize.ts) and the protected MCP handler.
 *
 * Everything here is static per Worker: the public origin is taken from each request by the
 * library, so one configuration serves local, preview, and production unchanged.
 */

export const OAUTH_ENDPOINTS = {
  authorize: "/authorize",
  token: "/token",
  register: "/register",
} as const;

/** Access tokens are short-lived; refresh tokens rotate and expire after this much idle time. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

/** An ExportedHandler that definitely has `fetch` — what the provider accepts for handlers. */
export type FetchHandler = ExportedHandler<Cloudflare.Env> & {
  fetch: NonNullable<ExportedHandler<Cloudflare.Env>["fetch"]>;
};

export interface OAuthHandlers {
  /** Unprotected routes: `/authorize`, pages, health. */
  readonly defaultHandler: FetchHandler;
  /** The MCP transport; only reached with a valid access token. */
  readonly apiHandler: FetchHandler;
}

/** The entry point constructs the provider from these; tests use them with `getOAuthApi`. */
export function createOAuthProviderOptions(handlers: OAuthHandlers): OAuthProviderOptions {
  return {
    apiRoute: [...MCP_ROUTES],
    apiHandler: handlers.apiHandler,
    defaultHandler: handlers.defaultHandler,

    authorizeEndpoint: OAUTH_ENDPOINTS.authorize,
    tokenEndpoint: OAUTH_ENDPOINTS.token,
    // DCR stays enabled as the fallback for clients without CIMD support.
    clientRegistrationEndpoint: OAUTH_ENDPOINTS.register,
    // Preferred registration for Claude and ChatGPT; needs `global_fetch_strictly_public`.
    clientIdMetadataDocumentEnabled: true,

    scopesSupported: [...SCOPES],
    resourceMetadata: {
      // `resource` and `authorization_servers` are derived from the request origin, so the
      // same build serves every environment. Production has exactly one public origin
      // (workers_dev = false), which is what makes the derived resource canonical.
      scopes_supported: [...SCOPES],
      bearer_methods_supported: ["header"],
      resource_name: RESOURCE_NAME,
    },

    accessTokenTTL: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTTL: REFRESH_TOKEN_TTL_SECONDS,

    // Runs on every code exchange and refresh: enforces the absolute grant lifetime
    // (grant-age.ts) by failing closed with invalid_grant.
    tokenExchangeCallback(options) {
      assertGrantWithinMaxAge(options.props, Date.now());
    },

    // Bearers that are not the provider's own access tokens: personal tokens resolve to the
    // same props a grant carries; everything else is a 401.
    resolveExternalToken: (input) => resolvePersonalToken(input),

    onError(error) {
      // Codes and categories only: descriptions can echo client-supplied input.
      console.warn(
        JSON.stringify({
          event: "oauth_error",
          code: error.code,
          status: error.status,
          category: error.internal?.category,
        }),
      );
    },
  };
}
