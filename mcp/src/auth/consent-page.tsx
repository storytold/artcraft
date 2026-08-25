import { isValidElement } from "hono/jsx";

import type { Scope } from "./oauth";

/**
 * The sign-in + consent page rendered by GET /authorize. A pure function of its view model:
 * no I/O, no secrets. Text content is escaped by Hono's JSX; nothing is ever inserted as raw
 * HTML. The page is deliberately plain — one screen, one decision.
 */

export interface ConsentView {
  /** From the OAuth client's registration or metadata document. */
  readonly clientName: string;
  /** Host (and port) of the redirect URI, shown so the user knows where they will be sent. */
  readonly redirectHost: string;
  /** Loopback redirects deserve an explicit warning (MCP auth spec, localhost redirect risks). */
  readonly isLoopbackRedirect: boolean;
  readonly scopes: readonly Scope[];
  /** The original authorize query string, echoed back so POST can re-validate the request. */
  readonly authRequestQuery: string;
  readonly csrfToken: string;
  /** When present, renders the Google Sign-In button; otherwise password only. */
  readonly googleClientId?: string;
  /** Nonce for the one inline script the Google button needs. */
  readonly scriptNonce: string;
  readonly error?: string;
  readonly usernameOrEmail?: string;
}

export const SCOPE_DESCRIPTIONS: Record<Scope, string> = {
  "read:account": "See your account name and plan",
  "read:jobs": "See the status and results of your generations",
  "read:catalog": "See available models and price estimates",
};

export const CONSENT_FORM_FIELDS = {
  authRequest: "auth_request",
  csrf: "csrf",
  action: "action",
  method: "method",
  usernameOrEmail: "username_or_email",
  password: "password",
  googleCredential: "google_credential",
} as const;

export function renderConsentPage(view: ConsentView): string {
  // Hono's JSX is typed as HtmlEscapedString | Promise<…> but evaluates to a JSXNode whose
  // toString() renders the HTML — synchronously when, as here, no component is async.
  const element: unknown = <ConsentPage view={view} />;
  if (!isValidElement(element)) {
    throw new Error("consent page did not render to a JSX node");
  }
  const rendered = element.toString();
  if (typeof rendered !== "string") {
    throw new Error("consent page must render synchronously");
  }
  return `<!doctype html>${rendered}`;
}

function ConsentPage({ view }: { view: ConsentView }) {
  const f = CONSENT_FORM_FIELDS;
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Connect {view.clientName} to Artcraft</title>
        <style>{STYLES}</style>
      </head>
      <body>
        <main class="card">
          <p class="eyebrow">Artcraft</p>
          <h1>
            Allow <strong>{view.clientName}</strong> to read your Artcraft account?
          </h1>
          <ul class="scopes">
            {view.scopes.map((scope) => (
              <li>{SCOPE_DESCRIPTIONS[scope]}</li>
            ))}
          </ul>
          <p class="note">It cannot generate anything or spend credits.</p>
          <p class="note">
            After you sign in you will be sent back to <code>{view.redirectHost}</code>.
          </p>
          {view.isLoopbackRedirect ? (
            <p class="warning">
              This redirect goes to an application on your own computer. Continue only if you
              started this from an app you trust.
            </p>
          ) : null}

          {view.error ? (
            <p class="error" role="alert">
              {view.error}
            </p>
          ) : null}

          <form method="post" action="/authorize" id="consent-form">
            <input type="hidden" name={f.authRequest} value={view.authRequestQuery} />
            <input type="hidden" name={f.csrf} value={view.csrfToken} />
            <input type="hidden" name={f.method} value="password" id="method" />
            <input type="hidden" name={f.googleCredential} value="" id="google-credential" />

            {view.googleClientId ? (
              <div class="google">
                <div
                  id="g_id_onload"
                  data-client_id={view.googleClientId}
                  data-callback="onGoogleCredential"
                  data-auto_prompt="false"
                ></div>
                <div
                  class="g_id_signin"
                  data-type="standard"
                  data-text="continue_with"
                  data-size="large"
                ></div>
                <p class="or">or sign in with your password</p>
              </div>
            ) : null}

            <label>
              Username or email
              <input
                type="text"
                name={f.usernameOrEmail}
                value={view.usernameOrEmail ?? ""}
                autocomplete="username"
                required
              />
            </label>
            <label>
              Password
              <input type="password" name={f.password} autocomplete="current-password" required />
            </label>
            <div class="actions">
              <button type="submit" name={f.action} value="allow" class="primary">
                Sign in and allow
              </button>
              <button type="submit" name={f.action} value="deny" formnovalidate class="secondary">
                Cancel
              </button>
            </div>
          </form>
        </main>
        {view.googleClientId ? (
          <>
            <script nonce={view.scriptNonce}>{GOOGLE_CALLBACK_SCRIPT}</script>
            <script src="https://accounts.google.com/gsi/client" async></script>
          </>
        ) : null}
      </body>
    </html>
  );
}

// Google Identity Services calls this with the ID token; we submit it through the same form.
const GOOGLE_CALLBACK_SCRIPT = `
function onGoogleCredential(response) {
  document.getElementById("method").value = "google";
  document.getElementById("google-credential").value = response.credential;
  var form = document.getElementById("consent-form");
  form.noValidate = true;
  form.requestSubmit ? form.requestSubmit() : form.submit();
}
`;

const STYLES = `
:root { color-scheme: light dark; --ink:#1b1f1e; --paper:#f4f5f2; --line:#d3d7d1; --accent:#0b6e63; --warn:#b87a12; --risk:#a8332c; }
@media (prefers-color-scheme: dark) { :root { --ink:#e6ebe9; --paper:#0f1514; --line:#2a3532; --accent:#4fb8a8; --warn:#e0a43c; --risk:#e2645b; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.5 system-ui, sans-serif; display:grid; place-items:center; min-height:100vh; padding:24px; }
.card { width:100%; max-width:440px; border:1px solid var(--line); border-radius:8px; padding:28px; }
.eyebrow { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin:0 0 8px; font-weight:600; }
h1 { font-size:22px; line-height:1.25; margin:0 0 16px; font-weight:600; }
.scopes { margin:0 0 12px; padding-left:20px; }
.note { margin:0 0 8px; font-size:14px; opacity:.85; }
.warning { border-left:3px solid var(--warn); padding:8px 12px; margin:12px 0; font-size:14px; }
.error { border-left:3px solid var(--risk); padding:8px 12px; margin:12px 0; font-size:14px; }
label { display:block; margin:14px 0 0; font-size:14px; font-weight:600; }
input[type=text], input[type=password] { display:block; width:100%; margin-top:6px; padding:10px 12px; border:1px solid var(--line); border-radius:6px; background:transparent; color:inherit; font:inherit; }
.actions { display:flex; gap:10px; margin-top:20px; }
button { flex:1; padding:11px 14px; border-radius:6px; border:1px solid var(--line); font:inherit; font-weight:600; cursor:pointer; background:transparent; color:inherit; }
button.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.google { margin:16px 0 4px; }
.or { font-size:13px; opacity:.7; margin:12px 0 0; }
code { font-family: ui-monospace, monospace; font-size:.9em; }
`;
