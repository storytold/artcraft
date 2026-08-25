import { z } from "zod";

import allowlistJson from "./allowlist.json";
import type { paths } from "./schema";

/**
 * The ONLY upstream routes this service may call, loaded from allowlist.json (the same file
 * scripts/gen-api.mjs trims the spec to). `use` says who may call a route:
 *
 * - `auth`: the credential / consent module only (sign-in, sign-out);
 * - `read`: tool handlers.
 *
 * The upstream client checks every request against this list before it leaves the Worker.
 * Scope enforcement lives here, in code — not in tool descriptions or model behaviour.
 */

export type HttpMethod = "get" | "post";
export type UpstreamUse = "auth" | "read";
export type UpstreamPath = keyof paths;

export interface UpstreamRoute {
  readonly method: HttpMethod;
  /** The OpenAPI template path, e.g. `/v1/jobs/job/{token}`. */
  readonly path: UpstreamPath;
  readonly use: UpstreamUse;
}

const RouteSchema = z.object({
  method: z.enum(["get", "post"]),
  path: z.string().regex(/^\/v1\//, "must be a /v1 path"),
  use: z.enum(["auth", "read"]),
});

const AllowlistSchema = z.object({ routes: z.array(RouteSchema).min(1) });

export class AllowlistError extends Error {
  override readonly name = "AllowlistError";
}

/** Parse and validate an allowlist document. Exported so tests can prove the checks fire. */
export function parseAllowlist(document: unknown): readonly UpstreamRoute[] {
  const parsed = AllowlistSchema.safeParse(document);
  if (!parsed.success) {
    throw new AllowlistError(
      `invalid allowlist: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  const seen = new Set<string>();
  for (const route of parsed.data.routes) {
    const key = `${route.method} ${route.path}`;
    if (seen.has(key)) throw new AllowlistError(`duplicate allowlist route: ${key}`);
    seen.add(key);
  }
  // The path strings are checked against the generated `paths` type by the contract test
  // (every entry must exist in the spec snapshot); at runtime they are plain strings.
  return parsed.data.routes.map((route) => ({ ...route, path: route.path as UpstreamPath }));
}

export const UPSTREAM_ROUTES: readonly UpstreamRoute[] = parseAllowlist(allowlistJson);

/** Look up a route by method and OpenAPI template path (what openapi-fetch reports as `schemaPath`). */
export function findRoute(
  method: string,
  templatePath: string,
  routes: readonly UpstreamRoute[] = UPSTREAM_ROUTES,
): UpstreamRoute | undefined {
  const normalizedMethod = method.toLowerCase();
  return routes.find((route) => route.method === normalizedMethod && route.path === templatePath);
}

/**
 * Look up a route by method and a concrete request path (e.g. `/v1/jobs/job/jinf_abc`), used
 * as a second, independent check on the final URL. Template variables match one path segment.
 */
export function findRouteForPathname(
  method: string,
  pathname: string,
  routes: readonly UpstreamRoute[] = UPSTREAM_ROUTES,
): UpstreamRoute | undefined {
  const normalizedMethod = method.toLowerCase();
  return routes.find(
    (route) => route.method === normalizedMethod && templateToRegExp(route.path).test(pathname),
  );
}

/** Whether a caller with the given `use` may call the route. `auth` routes are never `read`. */
export function isAllowed(
  route: UpstreamRoute | undefined,
  use: UpstreamUse,
): route is UpstreamRoute {
  return route?.use === use;
}

function templateToRegExp(template: string): RegExp {
  const pattern = template
    .split("/")
    .map((segment) => (/^\{\w+\}$/.test(segment) ? "[^/]+" : escapeRegExp(segment)))
    .join("/");
  return new RegExp(`^${pattern}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
