import { type Context, Hono } from "hono";

import type { Authenticator, SignInSubmission } from "../auth/authenticator";
import { csrfCookieHeader, csrfTokensMatch, generateCsrfToken, readCsrfCookie } from "../auth/csrf";
import {
  createPersonalTokenStore,
  PersonalTokenError,
  type PersonalTokenSummary,
} from "../tokens/personal-token-store";
import { signOutUpstream } from "../upstream/sign-out";
import {
  CONNECTIONS_FORM_FIELDS,
  CONNECTIONS_PATHS,
  type ConnectionsView,
  type ConnectionView,
  type NewTokenView,
  type PersonalTokenView,
  renderConnectionsPage,
  TOKEN_LIFETIME_DAYS,
  type TokenLifetimeDays,
} from "./connections-page";
import {
  clearedUiSessionCookieHeader,
  createUiSessionStore,
  readUiSessionCookie,
  type UiSession,
  uiSessionCookieHeader,
} from "./ui-session";

/**
 * `/connections`: sign in (through the same Authenticator as consent), see the grants held
 * against your Artcraft account, disconnect any of them, and manage personal tokens. The
 * upstream session obtained to identify the visitor is ended straight away — the page keeps
 * only who they are.
 *
 * Creating a personal token asks for the password (or Google) again: the token must hold a
 * session of its own, obtained for it, and the account signed in must be the one on the page.
 *
 * Revoking a grant or a token kills it; its encrypted upstream session becomes unreachable
 * (the key material is wrapped by the token) but is not itself logged out — the record cannot
 * be decrypted without the token. Recorded in docs/backend-handoff.md.
 */

export interface ConnectionsDeps {
  readonly authenticator: Authenticator;
  readonly upstreamApiHost: string;
  readonly googleClientId?: string;
}

type PageContext = Context<{ Bindings: Cloudflare.Env }>;

const NOTICES: Record<string, string> = {
  disconnected: "Disconnected. That app will have to ask you to sign in again.",
  signed_out: "Signed out of this page.",
  token_revoked: "Token revoked. Anything still using it will be refused.",
};

const DAY_SECONDS = 24 * 60 * 60;

export function connectionsRoutes(deps: ConnectionsDeps): Hono<{ Bindings: Cloudflare.Env }> {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();

  app.get(CONNECTIONS_PATHS.page, async (c) => {
    const session = await currentSession(c);
    const notice = NOTICES[c.req.query("notice") ?? ""];
    return render(c, session, notice ? { notice } : {});
  });

  app.post(CONNECTIONS_PATHS.signIn, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONNECTIONS_FORM_FIELDS.csrf])) {
      return c.text("This form has expired. Reload the page and try again.", 403);
    }
    const submission = readSubmission(form);
    if (!submission) {
      return render(c, undefined, {
        status: 400,
        error: "Enter your username or email and your password.",
        usernameOrEmail: form[CONNECTIONS_FORM_FIELDS.usernameOrEmail],
      });
    }
    const outcome = await deps.authenticator.authenticate(submission);
    if (!outcome.ok) {
      return render(c, undefined, {
        status: outcome.reason === "upstream_unavailable" ? 502 : 401,
        error: outcome.message,
        usernameOrEmail: submission.method === "password" ? submission.usernameOrEmail : undefined,
      });
    }
    // We only needed to know who they are; the upstream session is not kept.
    c.executionCtx.waitUntil(signOutUpstream(deps.upstreamApiHost, outcome.user.credential));
    const id = await createUiSessionStore(c.env.OAUTH_KV).create({
      userToken: outcome.user.userToken,
      username: outcome.user.username,
    });
    c.header("set-cookie", uiSessionCookieHeader(id, isSecure(c)));
    return c.redirect(CONNECTIONS_PATHS.page, 303);
  });

  app.post(CONNECTIONS_PATHS.revoke, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONNECTIONS_FORM_FIELDS.csrf])) {
      return c.text("This form has expired. Reload the page and try again.", 403);
    }
    const session = await currentSession(c);
    if (!session) {
      return render(c, undefined, { status: 401, error: "Sign in again to manage connections." });
    }
    const grantId = form[CONNECTIONS_FORM_FIELDS.grantId] ?? "";
    // Scoped to the signed-in user: someone else's grant id is a no-op, never an error.
    if (grantId) await c.env.OAUTH_PROVIDER.revokeGrant(grantId, session.userToken);
    return c.redirect(`${CONNECTIONS_PATHS.page}?notice=disconnected`, 303);
  });

  app.post(CONNECTIONS_PATHS.createToken, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONNECTIONS_FORM_FIELDS.csrf])) {
      return c.text("This form has expired. Reload the page and try again.", 403);
    }
    const session = await currentSession(c);
    if (!session) {
      return render(c, undefined, { status: 401, error: "Sign in again to create a token." });
    }
    const label = form[CONNECTIONS_FORM_FIELDS.tokenLabel]?.trim() ?? "";
    const lifetime = readLifetime(form[CONNECTIONS_FORM_FIELDS.tokenLifetime]);
    if (!label || !lifetime) {
      return render(c, session, { status: 400, error: "Give the token a name and a lifetime." });
    }
    const submission = readSubmission(form, session.username);
    if (!submission) {
      return render(c, session, { status: 400, error: "Confirm your password to create a token." });
    }
    const outcome = await deps.authenticator.authenticate(submission);
    if (!outcome.ok) {
      return render(c, session, {
        status: outcome.reason === "upstream_unavailable" ? 502 : 401,
        error: outcome.message,
      });
    }
    if (outcome.user.userToken !== session.userToken) {
      // Someone confirmed with a different account: drop that session, keep this page's.
      c.executionCtx.waitUntil(signOutUpstream(deps.upstreamApiHost, outcome.user.credential));
      return render(c, session, {
        status: 403,
        error: `Confirm with the account signed in on this page (${session.username}).`,
      });
    }
    try {
      const { secret, summary } = await createPersonalTokenStore(c.env.OAUTH_KV).create({
        user: {
          userToken: outcome.user.userToken,
          username: outcome.user.username,
          displayName: outcome.user.displayName,
          credential: outcome.user.credential.toProps(),
        },
        label,
        ttlSeconds: Number(lifetime) * DAY_SECONDS,
        nowMs: Date.now(),
      });
      // Rendered in this response, never redirected: the secret must not appear in a URL.
      return await render(c, session, {
        newToken: { label: summary.label, secret, expiresAt: formatDate(summary.expiresAt) },
      });
    } catch (error) {
      if (error instanceof PersonalTokenError) {
        // The session obtained for the token is not needed after all.
        c.executionCtx.waitUntil(signOutUpstream(deps.upstreamApiHost, outcome.user.credential));
        return render(c, session, {
          status: 400,
          error: `Could not create the token: ${error.message}.`,
        });
      }
      throw error;
    }
  });

  app.post(CONNECTIONS_PATHS.revokeToken, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONNECTIONS_FORM_FIELDS.csrf])) {
      return c.text("This form has expired. Reload the page and try again.", 403);
    }
    const session = await currentSession(c);
    if (!session) {
      return render(c, undefined, { status: 401, error: "Sign in again to manage tokens." });
    }
    const id = form[CONNECTIONS_FORM_FIELDS.tokenId] ?? "";
    // Scoped to the signed-in user: someone else's token id is a no-op, never an error.
    if (id) await createPersonalTokenStore(c.env.OAUTH_KV).revoke(session.userToken, id);
    return c.redirect(`${CONNECTIONS_PATHS.page}?notice=token_revoked`, 303);
  });

  app.post(CONNECTIONS_PATHS.signOut, async (c) => {
    const form = await readForm(c);
    if (!csrfTokensMatch(readCsrfCookie(c.req.raw), form[CONNECTIONS_FORM_FIELDS.csrf])) {
      return c.text("This form has expired. Reload the page and try again.", 403);
    }
    await createUiSessionStore(c.env.OAUTH_KV).destroy(readUiSessionCookie(c.req.raw));
    c.header("set-cookie", clearedUiSessionCookieHeader());
    return c.redirect(`${CONNECTIONS_PATHS.page}?notice=signed_out`, 303);
  });

  return app;

  async function render(
    c: PageContext,
    session: UiSession | undefined,
    options: {
      status?: 200 | 400 | 401 | 403 | 502;
      error?: string;
      notice?: string;
      usernameOrEmail?: string | undefined;
      newToken?: NewTokenView;
    },
  ): Promise<Response> {
    const csrfToken = generateCsrfToken();
    const nonce = generateCsrfToken();
    const view: ConnectionsView = {
      csrfToken,
      scriptNonce: nonce,
      ...(deps.googleClientId ? { googleClientId: deps.googleClientId } : {}),
      ...(options.error ? { error: options.error } : {}),
      ...(options.notice ? { notice: options.notice } : {}),
      ...(options.usernameOrEmail ? { usernameOrEmail: options.usernameOrEmail } : {}),
      ...(session
        ? {
            signedIn: {
              username: session.username,
              connections: await listConnections(c, session),
              personalTokens: await listPersonalTokens(c, session),
              ...(options.newToken ? { newToken: options.newToken } : {}),
            },
          }
        : {}),
    };
    // Two cookies: the CSRF token for this page's forms, and (already set) the page session.
    c.header("set-cookie", csrfCookieHeader(csrfToken, isSecure(c), CONNECTIONS_PATHS.page), {
      append: true,
    });
    c.header("content-security-policy", contentSecurityPolicy(nonce));
    c.header("cache-control", "no-store");
    c.header("referrer-policy", "strict-origin-when-cross-origin");
    c.header("x-frame-options", "DENY");
    return c.html(renderConnectionsPage(view), options.status ?? 200);
  }

  async function listConnections(c: PageContext, session: UiSession): Promise<ConnectionView[]> {
    const grants = await c.env.OAUTH_PROVIDER.listUserGrants(session.userToken, { limit: 100 });
    return grants.items
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((grant) => ({
        grantId: grant.id,
        clientName: clientNameOf(grant.metadata) ?? grant.clientId,
        scopes: grant.scope,
        createdAt: formatDate(grant.createdAt),
      }));
  }

  async function listPersonalTokens(
    c: PageContext,
    session: UiSession,
  ): Promise<PersonalTokenView[]> {
    const tokens = await createPersonalTokenStore(c.env.OAUTH_KV).list(
      session.userToken,
      Date.now(),
    );
    return tokens.map(tokenView);
  }

  async function currentSession(c: PageContext): Promise<UiSession | undefined> {
    return createUiSessionStore(c.env.OAUTH_KV).read(readUiSessionCookie(c.req.raw));
  }
}

async function readForm(c: PageContext): Promise<Record<string, string | undefined>> {
  const body = await c.req.parseBody();
  const fields: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") fields[key] = value;
  }
  return fields;
}

/**
 * The sign-in fields of a form. With `usernameOverride` (token creation) the account is the
 * page's, not the form's: a user confirms with their password, they do not pick an account.
 */
function readSubmission(
  form: Record<string, string | undefined>,
  usernameOverride?: string,
): SignInSubmission | undefined {
  if (form[CONNECTIONS_FORM_FIELDS.method] === "google") {
    const credential = form[CONNECTIONS_FORM_FIELDS.googleCredential] ?? "";
    return credential ? { method: "google", credential } : undefined;
  }
  const usernameOrEmail =
    usernameOverride ?? form[CONNECTIONS_FORM_FIELDS.usernameOrEmail]?.trim() ?? "";
  const password = form[CONNECTIONS_FORM_FIELDS.password] ?? "";
  return usernameOrEmail && password
    ? { method: "password", usernameOrEmail, password }
    : undefined;
}

function readLifetime(value: string | undefined): TokenLifetimeDays | undefined {
  return TOKEN_LIFETIME_DAYS.find((days) => days === value);
}

function tokenView(token: PersonalTokenSummary): PersonalTokenView {
  return {
    id: token.id,
    label: token.label,
    hint: token.hint,
    createdAt: formatDate(token.createdAt),
    expiresAt: formatDate(token.expiresAt),
  };
}

function clientNameOf(metadata: unknown): string | undefined {
  if (typeof metadata !== "object" || metadata === null) return undefined;
  const name = (metadata as { clientName?: unknown }).clientName;
  return typeof name === "string" && name.length > 0 ? name : undefined;
}

/** The provider records createdAt in seconds; tolerate milliseconds too. */
function formatDate(createdAt: number): string {
  const ms = createdAt < 1e12 ? createdAt * 1000 : createdAt;
  return new Date(ms).toISOString().slice(0, 10);
}

function isSecure(c: PageContext): boolean {
  return new URL(c.req.url).protocol === "https:";
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
