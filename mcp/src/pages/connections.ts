import { type Context, Hono } from "hono";

import type { Authenticator, SignInSubmission } from "../auth/authenticator";
import { csrfCookieHeader, csrfTokensMatch, generateCsrfToken, readCsrfCookie } from "../auth/csrf";
import { signOutUpstream } from "../upstream/sign-out";
import {
  CONNECTIONS_FORM_FIELDS,
  CONNECTIONS_PATHS,
  type ConnectionsView,
  type ConnectionView,
  renderConnectionsPage,
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
 * against your Artcraft account, disconnect any of them. The upstream session obtained to
 * identify the visitor is ended straight away — the page keeps only who they are.
 *
 * Revoking a grant kills its tokens; its encrypted upstream session becomes unreachable (the
 * key material is wrapped by those tokens) but is not itself logged out — the props cannot be
 * decrypted without a token. Recorded in docs/backend-handoff.md.
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
};

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
      status?: 200 | 400 | 401 | 502;
      error?: string;
      notice?: string;
      usernameOrEmail?: string | undefined;
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

function readSubmission(form: Record<string, string | undefined>): SignInSubmission | undefined {
  if (form[CONNECTIONS_FORM_FIELDS.method] === "google") {
    const credential = form[CONNECTIONS_FORM_FIELDS.googleCredential] ?? "";
    return credential ? { method: "google", credential } : undefined;
  }
  const usernameOrEmail = form[CONNECTIONS_FORM_FIELDS.usernameOrEmail]?.trim() ?? "";
  const password = form[CONNECTIONS_FORM_FIELDS.password] ?? "";
  return usernameOrEmail && password
    ? { method: "password", usernameOrEmail, password }
    : undefined;
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
