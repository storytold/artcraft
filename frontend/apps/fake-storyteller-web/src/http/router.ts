/**
 * Tiny path router.
 *
 * Patterns are literal segments plus `:name` captures and a trailing `*name`
 * that swallows the rest of the path (used by the media file server).
 */

import type { RequestContext } from "./context.ts";
import type { HttpResult } from "./respond.ts";

export type HandlerResult = HttpResult | object | undefined;
export type RouteHandler = (ctx: RequestContext) => Promise<HandlerResult> | HandlerResult;

export interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
}

interface Route {
  method: string;
  segments: string[];
  handler: RouteHandler;
}

export class Router {
  private readonly routes: Route[] = [];

  get(pattern: string, handler: RouteHandler): void {
    this.add("GET", pattern, handler);
  }

  post(pattern: string, handler: RouteHandler): void {
    this.add("POST", pattern, handler);
  }

  put(pattern: string, handler: RouteHandler): void {
    this.add("PUT", pattern, handler);
  }

  patch(pattern: string, handler: RouteHandler): void {
    this.add("PATCH", pattern, handler);
  }

  delete(pattern: string, handler: RouteHandler): void {
    this.add("DELETE", pattern, handler);
  }

  /** Resolve a request to a handler, or undefined when nothing matches. */
  match(method: string, pathname: string): RouteMatch | undefined {
    const requested = splitPath(pathname);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const params = matchSegments(route.segments, requested);
      if (params !== undefined) {
        return { handler: route.handler, params };
      }
    }

    return undefined;
  }

  /** Whether any method is registered at this path — lets the server answer 405 instead of 404. */
  allowedMethods(pathname: string): string[] {
    const requested = splitPath(pathname);
    const allowed = new Set<string>();

    for (const route of this.routes) {
      if (matchSegments(route.segments, requested) !== undefined) {
        allowed.add(route.method);
      }
    }

    return [...allowed];
  }

  /** Number of registered routes, reported at boot so coverage regressions are visible. */
  get size(): number {
    return this.routes.length;
  }

  private add(method: string, pattern: string, handler: RouteHandler): void {
    this.routes.push({ method, segments: splitPath(pattern), handler });
  }
}

function matchSegments(pattern: string[], requested: string[]): Record<string, string> | undefined {
  const params: Record<string, string> = {};

  for (let index = 0; index < pattern.length; index += 1) {
    const segment = pattern[index]!;

    if (segment.startsWith("*")) {
      params[segment.slice(1)] = requested.slice(index).join("/");
      return params;
    }

    const value = requested[index];
    if (value === undefined) {
      return undefined;
    }

    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(value);
      continue;
    }

    if (segment !== value) {
      return undefined;
    }
  }

  return pattern.length === requested.length ? params : undefined;
}

function splitPath(path: string): string[] {
  return path.split("/").filter((segment) => segment.length > 0);
}
