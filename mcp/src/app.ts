import { Hono } from "hono";

import type { Config } from "./config";

/**
 * The HTTP surface of the Worker. Built once from a validated `Config`; routes are added here
 * as milestones land (see mcp/CLAUDE.md → Architecture).
 */
export function createApp(config: Config): Hono {
  const app = new Hono();

  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      environment: config.environment,
    }),
  );

  return app;
}
