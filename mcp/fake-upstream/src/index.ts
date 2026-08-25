import { Hono } from "hono";

import { sessionRoutes } from "./routes/session";
import { createStore, type FakeStore } from "./state";

/**
 * In-memory fake of the Artcraft API. Routes are added as the MCP server's allowlist grows,
 * ported from the `infra/fake-storyteller-web` branch where they already exist. Every response
 * shape is validated against the spec snapshot in the contract tests.
 *
 * `/_status` mirrors the real service's status route so a misconfigured MCP server that lands
 * here can be told apart from one that reached production: the real API never says `fake`.
 */
export function createFakeUpstream(store: FakeStore = createStore()): Hono {
  const app = new Hono();

  app.get("/_status", (c) => c.json({ success: true, fake: true }));
  app.route("/", sessionRoutes(store));

  return app;
}

export default createFakeUpstream();
