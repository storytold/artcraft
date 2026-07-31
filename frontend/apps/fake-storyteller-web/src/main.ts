/**
 * fake-storyteller-web
 *
 * An in-memory stand-in for the storyteller-web API, used to run the webapp
 * without a backend. It has no database, no cache, and no third-party clients,
 * and it is never built or deployed as part of the production image.
 *
 * Start it with `nx serve fake-storyteller-web`, then point the webapp at
 * `http://localhost:12345` (its existing development default).
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { config } from "./config.ts";
import { RequestContext } from "./http/context.ts";
import { HttpResult, failure } from "./http/respond.ts";
import type { Router } from "./http/router.ts";
import { buildRouter } from "./routes/index.ts";
import { startGenerationResolver } from "./generation/resolver.ts";
import { seedState } from "./state/seed.ts";

/** Refuse bodies larger than this rather than buffering without limit. */
const MAX_BODY_BYTES = 256 * 1024 * 1024;

const router = buildRouter();

seedState();
startGenerationResolver();

const server = createServer((request, response) => {
  handleRequest(router, request, response).catch((error: unknown) => {
    writeResult(response, internalError(error), request);
  });
});

server.listen(config.port, config.host, () => {
  console.log(`fake-storyteller-web listening on http://${config.host}:${config.port}`);
  console.log(`  routes registered:      ${router.size}`);
  console.log(`  media served from:      ${config.repoRoot}`);
  console.log(`  generations resolve in: ${config.resolveSeconds}s`);
  console.log("  NOTE: all data is in memory and is lost on restart.");
});

async function handleRequest(
  activeRouter: Router,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (method === "OPTIONS") {
    writeResult(response, new HttpResult(204, undefined), request);
    return;
  }

  const match = activeRouter.match(method, url.pathname);
  if (match === undefined) {
    writeResult(response, unroutedResult(activeRouter, method, url.pathname), request);
    return;
  }

  const context = new RequestContext({
    method,
    pathname: url.pathname,
    query: url.searchParams,
    headers: request.headers,
    body: await readBody(request),
  });
  context.params = match.params;

  const handlerResult = await match.handler(context);
  const result =
    handlerResult instanceof HttpResult
      ? handlerResult
      : new HttpResult(200, handlerResult ?? { success: true });

  writeResult(response, result, request);
}

function readBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    request.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error(`Request body exceeded ${MAX_BODY_BYTES} bytes`));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function writeResult(response: ServerResponse, result: HttpResult, request: IncomingMessage): void {
  const headers: Record<string, string | string[]> = {
    ...corsHeaders(request),
    ...result.headers,
  };

  let payload: Buffer | undefined;
  if (Buffer.isBuffer(result.body)) {
    payload = result.body;
  } else if (result.body !== undefined) {
    payload = Buffer.from(JSON.stringify(result.body));
    headers["Content-Type"] ??= "application/json";
  }

  if (payload !== undefined) {
    headers["Content-Length"] = String(payload.length);
  }

  response.writeHead(result.status, headers);
  response.end(payload);
}

/**
 * Permissive CORS that reflects the caller's origin, because the webapp runs on
 * a different port and sends credentialed requests (a wildcard origin is not
 * allowed alongside `Allow-Credentials`).
 */
function corsHeaders(request: IncomingMessage): Record<string, string> {
  const origin = request.headers.origin;
  return {
    "Access-Control-Allow-Origin": typeof origin === "string" ? origin : "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, session, Session",
    "Access-Control-Expose-Headers": "Content-Length, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * A deliberately loud 404/405.
 *
 * The whole point of this server is to make gaps obvious, so an unimplemented
 * endpoint names itself rather than looking like an ordinary backend error.
 */
function unroutedResult(activeRouter: Router, method: string, pathname: string): HttpResult {
  const allowed = activeRouter.allowedMethods(pathname);

  if (allowed.length > 0) {
    console.warn(`[fake-api] 405 ${method} ${pathname} (allowed: ${allowed.join(", ")})`);
    return failure(
      405,
      "MethodNotAllowed",
      `fake-storyteller-web: ${pathname} exists but not for ${method} (allowed: ${allowed.join(", ")}).`,
    ).withHeader("Allow", allowed.join(", "));
  }

  console.warn(`[fake-api] 501 ${method} ${pathname} -- not implemented`);
  return failure(
    501,
    "NotImplementedInFake",
    `fake-storyteller-web does not implement ${method} ${pathname}. ` +
      "This endpoint exists in the real backend but has no fake yet -- add one in apps/fake-storyteller-web/src/routes.",
  );
}

function internalError(error: unknown): HttpResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[fake-api] handler threw:", error);
  return failure(500, "InternalError", `fake-storyteller-web handler failed: ${message}`);
}
