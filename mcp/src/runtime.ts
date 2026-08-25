import type { Hono } from "hono";

import { createApp } from "./app";
import { type Config, ConfigError, loadConfig } from "./config";

/**
 * Per-isolate state built once from the bindings. If the bindings violate the environment
 * invariant, the failure is memoized and rethrown on every call so a misconfigured deploy
 * can never serve a single successful request.
 */
export interface Runtime {
  readonly config: Config;
  readonly app: Hono<{ Bindings: Cloudflare.Env }>;
}

let cachedRuntime: Runtime | undefined;
let cachedFailure: ConfigError | undefined;

export function getRuntime(env: unknown): Runtime {
  if (cachedRuntime) return cachedRuntime;
  if (cachedFailure) throw cachedFailure;
  try {
    const config = loadConfig(env);
    cachedRuntime = { config, app: createApp(config) };
    return cachedRuntime;
  } catch (error) {
    if (error instanceof ConfigError) cachedFailure = error;
    throw error;
  }
}
