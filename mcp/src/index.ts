import type { Hono } from "hono";

import { createApp } from "./app";
import { ConfigError, loadConfig } from "./config";

/**
 * Worker entry point. The app is built once per isolate from the bindings. If the bindings
 * violate the environment invariant, every request fails with a 500 that names the problem —
 * a misconfigured deploy must be impossible to miss.
 */
let cachedApp: Hono | undefined;
let cachedFailure: ConfigError | undefined;

function getApp(env: unknown): Hono {
  if (cachedApp) return cachedApp;
  if (cachedFailure) throw cachedFailure;
  try {
    cachedApp = createApp(loadConfig(env));
    return cachedApp;
  } catch (error) {
    if (error instanceof ConfigError) {
      cachedFailure = error;
    }
    throw error;
  }
}

export default {
  fetch(
    request: Request,
    env: Cloudflare.Env,
    ctx: ExecutionContext,
  ): Response | Promise<Response> {
    let app: Hono;
    try {
      app = getApp(env);
    } catch (error) {
      if (error instanceof ConfigError) {
        return new Response(`Worker misconfigured: ${error.message}`, {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      throw error;
    }
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
