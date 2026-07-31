/** Server configuration. Everything has a working default; nothing is required. */

import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

/** Matches the real backend's dev port, so the webapp needs no configuration change. */
const DEFAULT_PORT = 12345;

/** How long a generation job stays pending before the resolver completes it. */
const DEFAULT_RESOLVE_SECONDS = 6;

export const config = {
  port: readNumber("FAKE_API_PORT", DEFAULT_PORT),
  host: process.env["FAKE_API_HOST"] ?? "127.0.0.1",

  /**
   * Origin used to build `cdn_url` values. Media is served by this same
   * process, so it points back at itself unless overridden.
   */
  publicBaseUrl: (process.env["FAKE_API_PUBLIC_BASE_URL"] ?? "").replace(/\/$/, ""),

  /** Seconds a submitted generation stays `pending`. Set to 0 to resolve immediately. */
  resolveSeconds: readNumber("FAKE_API_RESOLVE_SECONDS", DEFAULT_RESOLVE_SECONDS),

  /** Credits granted to the seeded demo user. */
  demoCredits: readNumber("FAKE_API_DEMO_CREDITS", 100_000),

  /** Repository root, used to load fixture media out of `test_data/`. */
  repoRoot: findRepoRoot(),
} as const;

/** The origin to embed in generated URLs, resolved lazily so the port is known. */
export function publicOrigin(): string {
  if (config.publicBaseUrl.length > 0) {
    return config.publicBaseUrl;
  }
  return `http://localhost:${config.port}`;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Walk up from this file until the directory holding `Cargo.toml` and `test_data/`. */
function findRepoRoot(): string {
  let current = import.meta.dirname;

  for (let depth = 0; depth < 10; depth += 1) {
    if (existsSync(join(current, "Cargo.toml")) && existsSync(join(current, "test_data"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return import.meta.dirname;
}
