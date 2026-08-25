import { Hono } from "hono";

import { createArtcraftAuthenticator } from "./auth/authenticator";
import { type AuthorizeDeps, authorizeRoutes } from "./auth/authorize";
import type { Config } from "./config";
import { generateCsrfToken } from "./auth/csrf";
import { connectionsRoutes } from "./pages/connections";
import { renderLandingPage } from "./pages/landing";

/**
 * The unprotected HTTP surface: health, the authorization endpoint, and (later) the pages.
 * Protected MCP routes never reach this app — the OAuth provider owns them.
 *
 * `deps` default to the real implementations built from `config`; tests may inject others.
 */
export function createApp(
  config: Config,
  deps: AuthorizeDeps = defaultDeps(config),
): Hono<{ Bindings: Cloudflare.Env }> {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();

  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      environment: config.environment,
    }),
  );

  app.get("/", (c) => {
    const nonce = generateCsrfToken();
    c.header(
      "content-security-policy",
      `default-src 'none'; style-src 'nonce-${nonce}'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    );
    c.header("cache-control", "public, max-age=300");
    return c.html(renderLandingPage({ origin: new URL(c.req.url).origin, scriptNonce: nonce }));
  });

  app.route("/", authorizeRoutes(deps));
  app.route("/", connectionsRoutes({ ...deps, upstreamApiHost: config.upstreamApiHost }));

  // The legacy HTTP+SSE transport is not offered; some clients still try it first.
  app.all("/sse", (c) =>
    c.json(
      {
        error: "The legacy SSE transport is not offered. Connect with Streamable HTTP at /mcp.",
        mcp_endpoint: `${new URL(c.req.url).origin}/mcp`,
      },
      405,
    ),
  );

  return app;
}

function defaultDeps(config: Config): AuthorizeDeps {
  return {
    authenticator: createArtcraftAuthenticator({ upstreamApiHost: config.upstreamApiHost }),
    ...(config.googleClientId ? { googleClientId: config.googleClientId } : {}),
  };
}
