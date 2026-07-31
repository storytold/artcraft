/**
 * `/media/*` — serving stored bytes back.
 *
 * This is the fake's CDN. Every `cdn_url` the API hands out points here, so
 * uploads and generation results load in the browser with no bucket, no proxy,
 * and no external host involved.
 */

import type { RequestContext } from "../http/context.ts";
import { HttpResult, bytes, notFound } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { getObject } from "../state/assets.ts";

export function registerMediaServingRoutes(router: Router): void {
  // The thumbnail route must come first: the catch-all below would swallow it.
  router.get("/media/thumb/:width/*path", serveThumbnail);
  router.get("/media/*path", serveObject);
}

function serveObject(context: RequestContext): HttpResult {
  return serve(context.params["path"] ?? "");
}

/**
 * Thumbnails come from `maybe_thumbnail_template`, which the frontend expands
 * by substituting a width. The fake ignores the width and serves the original —
 * correct enough for layout, and it keeps one copy of the bytes.
 */
function serveThumbnail(context: RequestContext): HttpResult {
  return serve(context.params["path"] ?? "");
}

function serve(bucketPath: string): HttpResult {
  const object = getObject(bucketPath);
  if (object === undefined) {
    return notFound(`fake-storyteller-web has no stored object at /media/${bucketPath}`);
  }

  return bytes(object.bytes, object.contentType, {
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
}
