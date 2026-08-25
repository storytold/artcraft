import { isValidElement } from "hono/jsx";

/**
 * `/connections` — where a user sees which AI apps hold a grant to their Artcraft account and
 * disconnects them, and where they mint personal tokens for integrations that cannot run the
 * OAuth flow themselves. The app itself has no sessions screen, so this page is the only place
 * that can show "Claude is connected". A pure function of its view model; everything is escaped.
 */

export interface ConnectionView {
  readonly grantId: string;
  readonly clientName: string;
  readonly scopes: readonly string[];
  readonly createdAt: string;
}

export interface PersonalTokenView {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

/** Shown exactly once, in the response to the request that created it. */
export interface NewTokenView {
  readonly label: string;
  readonly secret: string;
  readonly expiresAt: string;
}

export interface ConnectionsView {
  readonly csrfToken: string;
  readonly scriptNonce: string;
  readonly googleClientId?: string;
  readonly notice?: string;
  readonly error?: string;
  readonly usernameOrEmail?: string;
  /** Present once the visitor has signed in. */
  readonly signedIn?: {
    readonly username: string;
    readonly connections: readonly ConnectionView[];
    readonly personalTokens: readonly PersonalTokenView[];
    readonly newToken?: NewTokenView;
  };
}

export const CONNECTIONS_FORM_FIELDS = {
  csrf: "csrf",
  method: "method",
  usernameOrEmail: "username_or_email",
  password: "password",
  googleCredential: "google_credential",
  grantId: "grant_id",
  tokenLabel: "token_label",
  tokenLifetime: "token_lifetime",
  tokenId: "token_id",
} as const;

export const CONNECTIONS_PATHS = {
  page: "/connections",
  signIn: "/connections/sign-in",
  signOut: "/connections/sign-out",
  revoke: "/connections/revoke",
  createToken: "/connections/tokens/create",
  revokeToken: "/connections/tokens/revoke",
} as const;

/** The lifetimes a user can pick, in days; the form value is the key. */
export const TOKEN_LIFETIME_DAYS = ["30", "90"] as const;
export type TokenLifetimeDays = (typeof TOKEN_LIFETIME_DAYS)[number];

export function renderConnectionsPage(view: ConnectionsView): string {
  const element: unknown = <ConnectionsPage view={view} />;
  if (!isValidElement(element)) throw new Error("connections page did not render to a JSX node");
  const rendered = element.toString();
  if (typeof rendered !== "string") throw new Error("connections page must render synchronously");
  return `<!doctype html>${rendered}`;
}

function ConnectionsPage({ view }: { view: ConnectionsView }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Connected AI apps · Artcraft</title>
        <style nonce={view.scriptNonce}>{STYLES}</style>
      </head>
      <body>
        <main class="card">
          <p class="eyebrow">Artcraft</p>
          <h1>Connected AI apps</h1>
          {view.notice ? <p class="notice">{view.notice}</p> : null}
          {view.error ? (
            <p class="error" role="alert">
              {view.error}
            </p>
          ) : null}
          {view.signedIn ? (
            <SignedIn view={view} signedIn={view.signedIn} />
          ) : (
            <SignIn view={view} />
          )}
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

function SignIn({ view }: { view: ConnectionsView }) {
  const f = CONNECTIONS_FORM_FIELDS;
  return (
    <>
      <p class="note">
        Sign in to see which apps — Claude, ChatGPT, Gemini CLI and others — can read your Artcraft
        account, and disconnect any of them.
      </p>
      <form method="post" action={CONNECTIONS_PATHS.signIn} id="sign-in-form">
        <input type="hidden" name={f.csrf} value={view.csrfToken} />
        <input type="hidden" name={f.method} value="password" />
        <input type="hidden" name={f.googleCredential} value="" />
        {view.googleClientId ? <GoogleButton clientId={view.googleClientId} /> : null}
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
          <button type="submit" class="primary">
            Sign in
          </button>
        </div>
      </form>
    </>
  );
}

function SignedIn({
  view,
  signedIn,
}: {
  view: ConnectionsView;
  signedIn: NonNullable<ConnectionsView["signedIn"]>;
}) {
  const f = CONNECTIONS_FORM_FIELDS;
  return (
    <>
      <p class="note">
        Signed in as <strong>{signedIn.username}</strong>.{" "}
        <form method="post" action={CONNECTIONS_PATHS.signOut} class="inline">
          <input type="hidden" name={f.csrf} value={view.csrfToken} />
          <button type="submit" class="link">
            Sign out of this page
          </button>
        </form>
      </p>
      {signedIn.connections.length === 0 ? (
        <p class="empty">No AI apps are connected to your account.</p>
      ) : (
        <ul class="connections">
          {signedIn.connections.map((connection) => (
            <li>
              <div>
                <strong>{connection.clientName}</strong>
                <span class="meta">
                  connected {connection.createdAt} · can {describeScopes(connection.scopes)}
                </span>
              </div>
              <form method="post" action={CONNECTIONS_PATHS.revoke}>
                <input type="hidden" name={f.csrf} value={view.csrfToken} />
                <input type="hidden" name={f.grantId} value={connection.grantId} />
                <button type="submit" class="secondary">
                  Disconnect
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p class="note small">
        Disconnecting stops the app immediately; it will ask you to sign in again if you reconnect.
      </p>
      <PersonalTokens view={view} signedIn={signedIn} />
    </>
  );
}

function PersonalTokens({
  view,
  signedIn,
}: {
  view: ConnectionsView;
  signedIn: NonNullable<ConnectionsView["signedIn"]>;
}) {
  const f = CONNECTIONS_FORM_FIELDS;
  return (
    <section class="tokens">
      <h2>Personal tokens</h2>
      <p class="note">
        For integrations that take a fixed token instead of signing you in — the OpenAI Responses
        API (<code>authorization</code>) and the Anthropic Messages API connector (
        <code>authorization_token</code>). A token can only read: your account and credits, your
        generations, and models and prices.
      </p>
      {signedIn.newToken ? (
        <div class="new-token" role="status">
          <p>
            <strong>{signedIn.newToken.label}</strong> is ready. Copy it now — it will not be shown
            again.
          </p>
          <code class="secret">{signedIn.newToken.secret}</code>
          <p class="meta">
            Send it as <code>Authorization: Bearer …</code>. Expires {signedIn.newToken.expiresAt}.
          </p>
        </div>
      ) : null}
      {signedIn.personalTokens.length === 0 ? null : (
        <ul class="connections">
          {signedIn.personalTokens.map((token) => (
            <li>
              <div>
                <strong>{token.label}</strong>
                <span class="meta">
                  {token.hint} · created {token.createdAt} · expires {token.expiresAt}
                </span>
              </div>
              <form method="post" action={CONNECTIONS_PATHS.revokeToken}>
                <input type="hidden" name={f.csrf} value={view.csrfToken} />
                <input type="hidden" name={f.tokenId} value={token.id} />
                <button type="submit" class="secondary">
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form method="post" action={CONNECTIONS_PATHS.createToken} id="create-token-form">
        <input type="hidden" name={f.csrf} value={view.csrfToken} />
        <input type="hidden" name={f.method} value="password" />
        <input type="hidden" name={f.googleCredential} value="" />
        <h3>New token</h3>
        <label>
          Name
          <input
            type="text"
            name={f.tokenLabel}
            placeholder="e.g. OpenAI Responses"
            maxlength={64}
            autocomplete="off"
            required
          />
        </label>
        <label>
          Lifetime
          <select name={f.tokenLifetime}>
            {TOKEN_LIFETIME_DAYS.map((days) => (
              <option value={days}>{days} days</option>
            ))}
          </select>
        </label>
        <p class="note small">
          Confirm it is you: the token gets its own sign-in, separate from this page and from your
          browser.
        </p>
        {view.googleClientId ? <GoogleButton clientId={view.googleClientId} /> : null}
        <label>
          Password
          <input type="password" name={f.password} autocomplete="current-password" />
        </label>
        <div class="actions">
          <button type="submit" class="primary">
            Create token
          </button>
        </div>
      </form>
      <p class="note small">
        Revoking a token stops it immediately. Tokens expire on their own after at most 90 days.
      </p>
    </section>
  );
}

function GoogleButton({ clientId }: { clientId: string }) {
  return (
    <div class="google">
      <div
        id="g_id_onload"
        data-client_id={clientId}
        data-callback="onGoogleCredential"
        data-auto_prompt="false"
      ></div>
      <div
        class="g_id_signin"
        data-type="standard"
        data-text="continue_with"
        data-size="large"
      ></div>
      <p class="or">or use your password</p>
    </div>
  );
}

function describeScopes(scopes: readonly string[]): string {
  const words = scopes
    .map((scope) => SCOPE_WORDS[scope] ?? scope)
    .filter((word, index, all) => all.indexOf(word) === index);
  return words.length > 0 ? words.join(", ") : "nothing";
}

const SCOPE_WORDS: Record<string, string> = {
  "read:account": "see your account and credits",
  "read:jobs": "see your generations",
  "read:catalog": "see models and prices",
};

/** One Google button per page; it submits whichever form is on it (sign-in or create-token). */
const GOOGLE_CALLBACK_SCRIPT = `
function onGoogleCredential(response) {
  var form = document.getElementById("sign-in-form") || document.getElementById("create-token-form");
  form.querySelector('[name="method"]').value = "google";
  form.querySelector('[name="google_credential"]').value = response.credential;
  form.noValidate = true;
  form.requestSubmit ? form.requestSubmit() : form.submit();
}
`;

const STYLES = `
:root { color-scheme: light dark; --ink:#1b1f1e; --paper:#f4f5f2; --line:#d3d7d1; --accent:#0b6e63; --risk:#a8332c; }
@media (prefers-color-scheme: dark) { :root { --ink:#e6ebe9; --paper:#0f1514; --line:#2a3532; --accent:#4fb8a8; --risk:#e2645b; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.5 system-ui, sans-serif; display:grid; place-items:center; min-height:100vh; padding:24px; }
.card { width:100%; max-width:520px; border:1px solid var(--line); border-radius:8px; padding:28px; }
.eyebrow { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin:0 0 8px; font-weight:600; }
h1 { font-size:22px; line-height:1.25; margin:0 0 16px; font-weight:600; }
h2 { font-size:17px; margin:28px 0 8px; font-weight:600; }
h3 { font-size:15px; margin:18px 0 0; font-weight:600; }
.note { margin:0 0 12px; font-size:14px; opacity:.85; } .note.small { font-size:13px; opacity:.7; margin-top:16px; }
.notice { border-left:3px solid var(--accent); padding:8px 12px; margin:12px 0; font-size:14px; }
.error { border-left:3px solid var(--risk); padding:8px 12px; margin:12px 0; font-size:14px; }
.empty { padding:16px; border:1px dashed var(--line); border-radius:6px; text-align:center; font-size:14px; }
.connections { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
.connections li { display:flex; justify-content:space-between; align-items:center; gap:12px; border:1px solid var(--line); border-radius:6px; padding:12px 14px; }
.connections .meta { display:block; font-size:13px; opacity:.7; }
.tokens { border-top:1px solid var(--line); margin-top:24px; }
.new-token { border:1px solid var(--accent); border-radius:6px; padding:12px 14px; margin:12px 0; font-size:14px; }
.new-token p { margin:0 0 8px; } .new-token .meta { font-size:13px; opacity:.7; margin:8px 0 0; }
.secret { display:block; font:13px/1.5 ui-monospace, monospace; word-break:break-all; user-select:all; padding:8px 10px; border:1px dashed var(--line); border-radius:4px; }
code { font:13px ui-monospace, monospace; }
label { display:block; margin:14px 0 0; font-size:14px; font-weight:600; }
input[type=text], input[type=password], select { display:block; width:100%; margin-top:6px; padding:10px 12px; border:1px solid var(--line); border-radius:6px; background:transparent; color:inherit; font:inherit; }
.actions { display:flex; gap:10px; margin-top:20px; }
button { padding:10px 14px; border-radius:6px; border:1px solid var(--line); font:inherit; font-weight:600; cursor:pointer; background:transparent; color:inherit; }
button.primary { background:var(--accent); border-color:var(--accent); color:#fff; flex:1; }
button.link { border:none; padding:0; font-weight:500; text-decoration:underline; color:var(--accent); }
form.inline { display:inline; }
.google { margin:16px 0 4px; } .or { font-size:13px; opacity:.7; margin:12px 0 0; }
`;
