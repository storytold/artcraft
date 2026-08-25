import { isValidElement } from "hono/jsx";

import { SCOPES } from "../auth/oauth";
import { SCOPE_DESCRIPTIONS } from "../auth/consent-page";
import { CONNECTIONS_PATHS } from "./connections-page";

/**
 * `/` — "Connect Artcraft to your AI": what this server is, what it can and cannot do, and
 * copy-paste steps per client. Pure render; the only input is the public origin.
 */

export interface LandingView {
  /** The public origin users paste, e.g. https://mcp.getartcraft.com */
  readonly origin: string;
  readonly scriptNonce: string;
}

export function mcpEndpoint(origin: string): string {
  return `${origin}/mcp`;
}

export function renderLandingPage(view: LandingView): string {
  const element: unknown = <LandingPage view={view} />;
  if (!isValidElement(element)) throw new Error("landing page did not render to a JSX node");
  const rendered = element.toString();
  if (typeof rendered !== "string") throw new Error("landing page must render synchronously");
  return `<!doctype html>${rendered}`;
}

function LandingPage({ view }: { view: LandingView }) {
  const endpoint = mcpEndpoint(view.origin);
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Connect Artcraft to your AI</title>
        <meta
          name="description"
          content="Let Claude, ChatGPT, Gemini CLI and other MCP clients read your Artcraft account: credits, generations, models and prices."
        />
        <style nonce={view.scriptNonce}>{STYLES}</style>
      </head>
      <body>
        <main class="page">
          <header>
            <p class="eyebrow">Artcraft MCP</p>
            <h1>Connect Artcraft to your AI</h1>
            <p class="lede">
              Give Claude, ChatGPT, Gemini CLI and other MCP clients read access to your Artcraft
              account. Sign in once through the app you use; it can then check your credits, look up
              your generations, browse models and estimate costs — and nothing more.
            </p>
          </header>

          <section>
            <h2>The endpoint</h2>
            <p>Paste this wherever your client asks for an MCP server URL:</p>
            <pre>
              <code>{endpoint}</code>
            </pre>
            <p class="note">
              Sign-in happens on this site with your Artcraft username and password, or Google. Your
              password never reaches the AI app.
            </p>
          </section>

          <section>
            <h2>What it can do</h2>
            <ul>
              {SCOPES.map((scope) => (
                <li>{SCOPE_DESCRIPTIONS[scope]}</li>
              ))}
            </ul>
            <p class="note">
              It cannot generate anything, spend credits, upload, or change your account. Cost
              estimates are public pricing; your plan may lower them.
            </p>
          </section>

          <section>
            <h2>Set-up by client</h2>

            <h3>Claude (claude.ai, desktop, mobile)</h3>
            <ol>
              <li>Settings → Connectors → Add custom connector.</li>
              <li>
                Name it <strong>Artcraft</strong> and paste <code>{endpoint}</code>. No client id or
                secret is needed.
              </li>
              <li>Click Connect, sign in to Artcraft, and allow.</li>
            </ol>

            <h3>Claude Code</h3>
            <pre>
              <code>{`claude mcp add --transport http artcraft ${endpoint}`}</code>
            </pre>
            <p class="note">
              Then run <code>/mcp</code> inside Claude Code to sign in.
            </p>

            <h3>ChatGPT</h3>
            <ol>
              <li>Settings → Apps → Advanced settings → turn on Developer mode.</li>
              <li>
                Create a connector with <code>{endpoint}</code> and OAuth authentication.
              </li>
              <li>Connect and sign in to Artcraft.</li>
            </ol>

            <h3>Gemini CLI</h3>
            <p>
              Add to <code>~/.gemini/settings.json</code>; the CLI discovers sign-in on first use:
            </p>
            <pre>
              <code>
                {JSON.stringify({ mcpServers: { artcraft: { httpUrl: endpoint } } }, null, 2)}
              </code>
            </pre>

            <h3>Cursor, VS Code, and other MCP clients</h3>
            <pre>
              <code>
                {JSON.stringify({ mcpServers: { artcraft: { url: endpoint } } }, null, 2)}
              </code>
            </pre>
          </section>

          <section>
            <h2>Manage connections</h2>
            <p>
              See which apps are connected and disconnect any of them at{" "}
              <a href={CONNECTIONS_PATHS.page}>
                {view.origin}
                {CONNECTIONS_PATHS.page}
              </a>
              . Connections expire after 90 days and can be renewed by connecting again.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}

const STYLES = `
:root { color-scheme: light dark; --ink:#1b1f1e; --ink-2:#4a5250; --paper:#f4f5f2; --line:#d3d7d1; --accent:#0b6e63; --code:#e9ece7; }
@media (prefers-color-scheme: dark) { :root { --ink:#e6ebe9; --ink-2:#b3bdb9; --paper:#0f1514; --line:#2a3532; --accent:#4fb8a8; --code:#182120; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:17px/1.55 system-ui, sans-serif; }
.page { max-width:720px; margin:0 auto; padding:48px 24px 96px; }
.eyebrow { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin:0 0 10px; font-weight:600; }
h1 { font-size:36px; line-height:1.1; margin:0 0 16px; font-weight:700; letter-spacing:-.01em; }
h2 { font-size:22px; margin:40px 0 12px; font-weight:600; }
h3 { font-size:17px; margin:24px 0 8px; font-weight:600; }
.lede { font-size:19px; color:var(--ink-2); margin:0; }
.note { font-size:15px; color:var(--ink-2); }
pre { background:var(--code); border:1px solid var(--line); border-radius:6px; padding:12px 14px; overflow-x:auto; font-size:14px; }
code { font-family: ui-monospace, Menlo, Consolas, monospace; }
p code { background:var(--code); padding:1px 5px; border-radius:3px; font-size:.9em; }
ol, ul { padding-left:22px; } li { margin-bottom:6px; }
a { color:var(--accent); }
`;
