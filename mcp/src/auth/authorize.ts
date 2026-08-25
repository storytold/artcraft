import {
  AuthorizationError,
  type AuthRequest,
  CimdFetchError,
  type ClientInfo,
} from "@cloudflare/workers-oauth-provider";
import { type Context, Hono } from "hono";

import type { Authenticator, SignInSubmission } from "./authenticator";
import { CONSENT_FORM_FIELDS, type ConsentView, renderConsentPage } from "./consent-page";
import { csrfCookieHeader, csrfTokensMatch, generateCsrfToken, readCsrfCookie } from "./csrf";
import { finishAuthorization, grantedScopes } from "./finish-authorization";
import { OAUTH_ENDPOINTS } from "./oauth";

/**
 * The application-owned authorization endpoint.
 *
 * GET: the provider validates the OAuth request (client, exact redirect URI, response type,
 * resource, PKCE); we render the sign-in + consent page with a CSRF token and echo the original
 * query so POST can re-validate the request from scratch — nothing is stored between the two.
 *
 * POST: CSRF check → re-validate → deny, or sign in through the `Authenticator` → on success
 * `finishAuthorization` and redirect; on failure re-render with the reason. Never auto-approves.
 */

export interface AuthorizeDeps {
  readonly authenticator: Authenticator;
  /** Public Google OAuth client id; when absent the page offers password sign-in only. */
  readonly googleClientId?: string;
}

type AuthorizeContext = Context<{ Bindings: Cloudflare.Env }>;

interface ValidatedRequest {
  readonly authRequest: AuthRequest;
  readonly client: ClientInfo;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function authorizeRoutes(deps: AuthorizeDeps): Hono<{ Bindings: Cloudflare.Env }> {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();

  app.get(OAUTH_ENDPOINTS.authorize, async (c) => {
    const validated = await validate(c, c.req.raw);
    if (validated instanceof Response) return validated;
    return render(c, validated, new URL(c.req.url).search.slice(1), {});
  });

  app.post(OAUTH_ENDPOINTS.authorize, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONSENT_FORM_FIELDS.csrf])) {
      return c.text("This form has expired or was tampered with. Start again from your app.", 403);
    }

    const authRequestQuery = form[CONSENT_FORM_FIELDS.authRequest] ?? "";
    const origin = new URL(c.req.url).origin;
    const validated = await validate(
      c,
      new Request(`${origin}${OAUTH_ENDPOINTS.authorize}?${authRequestQuery}`),
    );
    if (validated instanceof Response) return validated;

    if (form[CONSENT_FORM_FIELDS.action] === "deny") {
      return c.redirect(errorRedirect(validated.authRequest, "access_denied"), 302);
    }

    const submission = readSubmission(form);
    if (!submission) {
      return render(c, validated, authRequestQuery, {
        status: 400,
        error: "Enter your username or email and your password.",
        usernameOrEmail: form[CONSENT_FORM_FIELDS.usernameOrEmail],
      });
    }

    const outcome = await deps.authenticator.authenticate(submission);
    if (!outcome.ok) {
      return render(c, validated, authRequestQuery, {
        status: outcome.reason === "upstream_unavailable" ? 502 : 401,
        error: outcome.message,
        usernameOrEmail: submission.method === "password" ? submission.usernameOrEmail : undefined,
      });
    }

    const redirectTo = await finishAuthorization(
      c.env.OAUTH_PROVIDER,
      validated.authRequest,
      validated.client,
      outcome.user,
    );
    return c.redirect(redirectTo, 302);
  });

  return app;

  async function render(
    c: AuthorizeContext,
    validated: ValidatedRequest,
    authRequestQuery: string,
    options: {
      status?: 200 | 400 | 401 | 502;
      error?: string;
      usernameOrEmail?: string | undefined;
    },
  ): Promise<Response> {
    const csrfToken = generateCsrfToken();
    const nonce = generateCsrfToken();
    const redirect = new URL(validated.authRequest.redirectUri);
    const view: ConsentView = {
      clientName: clientDisplayName(validated.client),
      redirectHost: redirect.host,
      isLoopbackRedirect: LOOPBACK_HOSTS.has(redirect.hostname),
      scopes: grantedScopes(validated.authRequest.scope),
      authRequestQuery,
      csrfToken,
      scriptNonce: nonce,
      ...(deps.googleClientId ? { googleClientId: deps.googleClientId } : {}),
      ...(options.error ? { error: options.error } : {}),
      ...(options.usernameOrEmail ? { usernameOrEmail: options.usernameOrEmail } : {}),
    };
    const secure = new URL(c.req.url).protocol === "https:";
    c.header("set-cookie", csrfCookieHeader(csrfToken, secure));
    c.header("content-security-policy", contentSecurityPolicy(nonce));
    c.header("cache-control", "no-store");
    c.header("referrer-policy", "strict-origin-when-cross-origin");
    c.header("x-frame-options", "DENY");
    return Promise.resolve(c.html(renderConsentPage(view), options.status ?? 200));
  }
}

/**
 * Validate an authorization request through the provider. Errors before the client and its
 * exact redirect URI are known are rendered locally; afterwards they may be sent to the client.
 */
async function validate(
  c: AuthorizeContext,
  request: Request,
): Promise<ValidatedRequest | Response> {
  let authRequest: AuthRequest;
  try {
    authRequest = await c.env.OAUTH_PROVIDER.parseAuthRequest(request);
  } catch (error) {
    if (error instanceof CimdFetchError) {
      return c.text(
        "Could not fetch this client's metadata document. Try again, or contact the client's developer.",
        502,
      );
    }
    if (!(error instanceof AuthorizationError)) throw error;
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
  if (!client) return c.text("Unknown OAuth client", 400);
  return { authRequest, client };
}

async function readForm(c: AuthorizeContext): Promise<Record<string, string | undefined>> {
  const body = await c.req.parseBody();
  const fields: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") fields[key] = value;
  }
  return fields;
}

function readSubmission(form: Record<string, string | undefined>): SignInSubmission | undefined {
  if (form[CONSENT_FORM_FIELDS.method] === "google") {
    const credential = form[CONSENT_FORM_FIELDS.googleCredential] ?? "";
    return credential ? { method: "google", credential } : undefined;
  }
  const usernameOrEmail = form[CONSENT_FORM_FIELDS.usernameOrEmail]?.trim() ?? "";
  const password = form[CONSENT_FORM_FIELDS.password] ?? "";
  return usernameOrEmail && password
    ? { method: "password", usernameOrEmail, password }
    : undefined;
}

function errorRedirect(authRequest: AuthRequest, code: string): string {
  const redirect = new URL(authRequest.redirectUri);
  redirect.searchParams.set("error", code);
  if (authRequest.state) redirect.searchParams.set("state", authRequest.state);
  if (authRequest.issuer) redirect.searchParams.set("iss", authRequest.issuer);
  return redirect.toString();
}

function clientDisplayName(client: ClientInfo): string {
  if (client.clientName) return client.clientName;
  try {
    return new URL(client.clientId).host;
  } catch {
    return client.clientId;
  }
}

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' https://accounts.google.com/gsi/client`,
    `style-src 'nonce-${nonce}' https://accounts.google.com/gsi/style`,
    "frame-src https://accounts.google.com/gsi/",
    "connect-src https://accounts.google.com/gsi/",
    "img-src 'self' data:",
    "form-action 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
