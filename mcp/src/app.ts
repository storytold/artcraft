import { Hono } from "hono";

import { authorizeRoutes } from "./auth/authorize";
import type { Config } from "./config";

/**
 * The unprotected HTTP surface: health, the authorization endpoint, and (later) the pages.
 * Protected MCP routes never reach this app — the OAuth provider owns them.
 */
export function createApp(config: Config): Hono<{ Bindings: Cloudflare.Env }> {
  const app = new Hono<{ Bindings: Cloudflare.Env }>();

  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      environment: config.environment,
    }),
  );

  app.route("/", authorizeRoutes);

  return app;
}
