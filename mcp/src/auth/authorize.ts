import { AuthorizationError, type AuthRequest } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";

import { OAUTH_ENDPOINTS } from "./oauth";

/**
 * The application-owned authorization endpoint. The provider validates the OAuth request
 * (client, exact redirect URI, response type, resource, PKCE); this module owns what happens
 * next: sign-in and consent, which arrive with the `Authenticator` seam in the next PR.
 *
 * Until then the endpoint validates and stops. It must never auto-approve.
 */
export const authorizeRoutes = new Hono<{ Bindings: Cloudflare.Env }>();

authorizeRoutes.get(OAUTH_ENDPOINTS.authorize, async (c) => {
  let authRequest: AuthRequest;
  try {
    authRequest = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    // Only once the client and its exact registered redirect URI are validated may an error
    // be sent back to the client; otherwise it is rendered locally.
    if (!error.redirectUri) {
      return c.text(`Invalid authorization request: ${error.description}`, 400);
    }
    const redirect = new URL(error.redirectUri);
    redirect.searchParams.set("error", error.code);
    redirect.searchParams.set("error_description", error.description);
    if (error.state) redirect.searchParams.set("state", error.state);
    if (error.issuer) redirect.searchParams.set("iss", error.issuer);
    return c.redirect(redirect.toString(), 302);
  }

  const client = await c.env.OAUTH_PROVIDER.lookupClient(authRequest.clientId);
  if (!client) {
    return c.text("Unknown OAuth client", 400);
  }

  return c.text("Sign-in is not available yet.", 501);
});
