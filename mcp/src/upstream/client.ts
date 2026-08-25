import createClient, { type Client, type Middleware } from "openapi-fetch";

import { findRoute, findRouteForPathname, isAllowed, type UpstreamUse } from "./allowlist";
import type { UpstreamCredential } from "./credential";
import type { paths } from "./schema";

/**
 * The only way this service talks to the Artcraft API. A typed openapi-fetch client whose
 * middleware refuses, before anything leaves the Worker, any request that is
 *
 * - not on the allowlist for this client's `use` (tools get `read`, sign-in/out gets `auth`),
 * - not addressed to the configured upstream origin (per-request `baseUrl` overrides are
 *   rejected), or
 * - whose final URL does not match the allowlisted template (a second, independent check on
 *   the concrete pathname).
 *
 * The credential, when present, is attached last so it is never sent on a rejected request.
 */

const USER_AGENT = "artcraft-mcp/0.0.0";

export type UpstreamClient = Client<paths>;

export interface UpstreamClientOptions {
  /** Origin of the upstream API, e.g. `https://api.storyteller.ai` (from `Config`). */
  readonly baseUrl: string;
  /** Who this client serves; decides which allowlisted routes it may call. */
  readonly use: UpstreamUse;
  /** Required for `read` clients (every read route needs a user); optional for `auth`. */
  readonly credential?: UpstreamCredential;
  /** Injectable for tests; defaults to the global fetch. */
  readonly fetch?: typeof globalThis.fetch;
}

export class UpstreamPathNotAllowedError extends Error {
  override readonly name = "UpstreamPathNotAllowedError";

  constructor(method: string, path: string, use: UpstreamUse) {
    super(`${method.toUpperCase()} ${path} is not allowlisted for ${use} use`);
  }
}

export class UpstreamOriginError extends Error {
  override readonly name = "UpstreamOriginError";

  constructor(expected: string, actual: string) {
    super(`upstream request addressed to ${actual}; only ${expected} is allowed`);
  }
}

export function createUpstreamClient(options: UpstreamClientOptions): UpstreamClient {
  if (options.use === "read" && !options.credential) {
    throw new Error("a read upstream client requires a credential");
  }
  const origin = new URL(options.baseUrl).origin;

  const client = createClient<paths>({
    baseUrl: origin,
    fetch: options.fetch ?? globalThis.fetch,
    headers: { accept: "application/json", "user-agent": USER_AGENT },
  });

  client.use(allowlistMiddleware(options.use, origin));
  if (options.credential) client.use(credentialMiddleware(options.credential));
  return client;
}

function allowlistMiddleware(use: UpstreamUse, origin: string): Middleware {
  return {
    onRequest({ request, schemaPath }) {
      const route = findRoute(request.method, schemaPath);
      if (!isAllowed(route, use)) {
        throw new UpstreamPathNotAllowedError(request.method, schemaPath, use);
      }

      const url = new URL(request.url);
      if (url.origin !== origin) {
        throw new UpstreamOriginError(origin, url.origin);
      }
      const concreteRoute = findRouteForPathname(request.method, url.pathname);
      if (concreteRoute !== route) {
        throw new UpstreamPathNotAllowedError(request.method, url.pathname, use);
      }
      return undefined;
    },
  };
}

function credentialMiddleware(credential: UpstreamCredential): Middleware {
  return {
    onRequest({ request }) {
      const headers = new Headers(request.headers);
      credential.applyTo(headers);
      return new Request(request, { headers });
    },
  };
}
