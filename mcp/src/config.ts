import { z } from "zod";

/** The only host production may talk to. Pinned here and in wrangler.toml; a test checks both. */
export const PRODUCTION_UPSTREAM_API_HOST = "https://api.storyteller.ai";

const LOCAL_UPSTREAM_API_HOST_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const PREVIEW_UPSTREAM_API_HOST_PATTERN = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.workers\.dev$/;

export type McpEnvironment = "local" | "preview" | "production";

/**
 * Everything the Worker needs to know about where it is running. Built once per isolate from
 * the Worker bindings; nothing else in `src/` reads `MCP_ENVIRONMENT` (a test enforces this).
 *
 * `environment` is carried only for diagnostics (health output, log fields). It must never be
 * used to branch behaviour — that is the whole point of "bindings, not branches".
 */
export interface Config {
  readonly environment: McpEnvironment;
  /** Origin only, no trailing slash, e.g. `https://api.storyteller.ai`. */
  readonly upstreamApiHost: string;
  /** Public Google OAuth client id for "Continue with Google"; absent → password sign-in only. */
  readonly googleClientId?: string;
}

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}

const RawEnvSchema = z.object({
  MCP_ENVIRONMENT: z.enum(["local", "preview", "production"]),
  UPSTREAM_API_HOST: z.url({ protocol: /^https?$/ }),
  GOOGLE_CLIENT_ID: z
    .string()
    .regex(/\.apps\.googleusercontent\.com$/)
    .optional(),
});

/**
 * Parse the Worker bindings and assert the environment invariant: each environment may only
 * be pointed at the kind of upstream it is meant for. A mismatch is a deployment mistake and
 * must fail loudly on every request rather than quietly serving the wrong backend.
 */
export function loadConfig(rawEnv: unknown): Config {
  const parsed = RawEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new ConfigError(`invalid Worker bindings: ${formatIssues(parsed.error)}`);
  }

  const environment = parsed.data.MCP_ENVIRONMENT;
  const upstreamApiHost = normalizeHost(parsed.data.UPSTREAM_API_HOST);
  assertUpstreamHostMatchesEnvironment(environment, upstreamApiHost);

  const googleClientId = parsed.data.GOOGLE_CLIENT_ID;
  return { environment, upstreamApiHost, ...(googleClientId ? { googleClientId } : {}) };
}

function assertUpstreamHostMatchesEnvironment(
  environment: McpEnvironment,
  upstreamApiHost: string,
): void {
  switch (environment) {
    case "production":
      if (upstreamApiHost !== PRODUCTION_UPSTREAM_API_HOST) {
        throw new ConfigError(
          `production must use ${PRODUCTION_UPSTREAM_API_HOST}, got ${upstreamApiHost}`,
        );
      }
      return;
    case "preview":
      if (upstreamApiHost === PRODUCTION_UPSTREAM_API_HOST) {
        throw new ConfigError("preview must never point at the production API");
      }
      if (!PREVIEW_UPSTREAM_API_HOST_PATTERN.test(upstreamApiHost)) {
        throw new ConfigError(
          `preview must use a deployed fake upstream on workers.dev, got ${upstreamApiHost}`,
        );
      }
      return;
    case "local":
      if (!LOCAL_UPSTREAM_API_HOST_PATTERN.test(upstreamApiHost)) {
        throw new ConfigError(`local must use a localhost upstream, got ${upstreamApiHost}`);
      }
      return;
  }
}

/** Keep only the origin so callers can concatenate paths without double slashes. */
function normalizeHost(url: string): string {
  return new URL(url).origin;
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("; ");
}
