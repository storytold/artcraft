/**
 * In-memory object store standing in for the media bucket + CDN.
 *
 * Uploaded bytes and generation results both land here, keyed by a bucket path
 * shaped like the real one, and are served straight back out of memory at
 * `/media/<path>`. Nothing touches disk except the one-time fixture load.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config, publicOrigin } from "../config.ts";

/** Fixtures shipped in the repo, reused as the visible content of fake media. */
const FIXTURES = {
  image: join("test_data", "image", "juno.jpg"),
  imageAlternate: join("test_data", "image", "mochi.jpg"),
  video: join("test_data", "video", "mp4", "golden_sun_garoh.mp4"),
} as const;

export type FixtureName = keyof typeof FIXTURES;

export interface StoredObject {
  bytes: Buffer;
  contentType: string;
}

const objects = new Map<string, StoredObject>();
const fixtureCache = new Map<FixtureName, Buffer>();

/** Store bytes at a bucket path and return that path. */
export function putObject(bucketPath: string, bytes: Buffer, contentType: string): string {
  objects.set(normalize(bucketPath), { bytes, contentType });
  return bucketPath;
}

export function getObject(bucketPath: string): StoredObject | undefined {
  return objects.get(normalize(bucketPath));
}

export function objectCount(): number {
  return objects.size;
}

export function clearObjects(): void {
  objects.clear();
}

/**
 * Build a bucket path with the same hash fan-out the real backend uses:
 * `<h0>/<h1>/<h2>/<h3>/<h4>/<hash>/<prefix><hash><extension>`.
 */
export function makeBucketPath(hash: string, prefix: string, extension: string): string {
  const fanOut = hash.slice(0, 5).split("").join("/");
  return `${fanOut}/${hash}/${prefix}${hash}${extension}`;
}

/** Absolute URL the frontend should fetch this object from. */
export function bucketPathToCdnUrl(bucketPath: string): string {
  return `${publicOrigin()}/media/${normalize(bucketPath)}`;
}

/**
 * The thumbnail template the frontend expands by replacing `{WIDTH}`. The fake
 * ignores the requested width and serves the full-size object.
 */
export function bucketPathToThumbnailTemplate(bucketPath: string): string {
  return `${publicOrigin()}/media/thumb/{WIDTH}/${normalize(bucketPath)}`;
}

/** Read a repo fixture, cached after the first load. */
export function fixtureBytes(name: FixtureName): Buffer {
  const cached = fixtureCache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  const bytes = readFileSync(join(config.repoRoot, FIXTURES[name]));
  fixtureCache.set(name, bytes);
  return bytes;
}

/** Best-effort content type from a file extension, for serving stored bytes back. */
export function contentTypeForExtension(extension: string): string {
  const known: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".fbx": "application/octet-stream",
    ".spz": "application/octet-stream",
    ".ply": "application/octet-stream",
    ".pmx": "application/octet-stream",
    ".json": "application/json",
    ".zip": "application/zip",
  };

  return known[extension.toLowerCase()] ?? "application/octet-stream";
}

/** File extension including the dot, or an empty string. */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot) : "";
}

function normalize(bucketPath: string): string {
  return bucketPath.replace(/^\/+/, "");
}
