/**
 * Downscaled preview URLs for reference-image uploads.
 *
 * Committed reference thumbnails used to be full-resolution base64 data URLs
 * (`FileReader.readAsDataURL`). A modern phone photo decodes to a 50–200MB
 * bitmap plus a multi-megabyte heap string, so two or three camera-roll
 * uploads crossed iOS WebKit's per-tab memory limit and the browser killed
 * and reloaded the page, wiping the deck. Nothing ever needed that data URL:
 * uploads send the original `File` and generation sends the media token, so
 * previews only have to look right at deck-card size.
 */

const PREVIEW_MAX_DIM = 512;
const PREVIEW_JPEG_QUALITY = 0.85;

/** Formats whose previews must keep transparency through the re-encode. */
const ALPHA_TYPES = new Set(["image/png", "image/webp", "image/avif"]);

/** Formats returned as-is: GIFs keep their animation, SVGs are tiny vectors. */
const PASSTHROUGH_TYPES = new Set(["image/gif", "image/svg+xml"]);

// Downscales run one at a time: decoding is transient, but a multi-file pick
// decoding three 48MP photos concurrently is its own OOM spike on iOS.
let previewQueue: Promise<unknown> = Promise.resolve();

/**
 * Build a small object URL for displaying `file` as a reference thumbnail.
 * Falls back to an object URL of the original file when the image can't be
 * decoded (still far cheaper than a data URL — no base64 heap string).
 */
export function createImagePreviewUrl(file: File): Promise<string> {
  const task = previewQueue.then(() => buildPreviewUrl(file));
  previewQueue = task.catch(() => undefined);
  return task;
}

/**
 * Revoke a preview created by `createImagePreviewUrl`. No-op for non-blob
 * URLs (library picks commit CDN URLs through the same fields).
 */
export function revokeIfBlobUrl(url: string | undefined) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

async function buildPreviewUrl(file: File): Promise<string> {
  if (PASSTHROUGH_TYPES.has(file.type)) {
    return URL.createObjectURL(file);
  }
  try {
    // from-image keeps EXIF rotation, so phone portraits don't turn sideways.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    try {
      const scale = Math.min(
        1,
        PREVIEW_MAX_DIM / Math.max(bitmap.width, bitmap.height),
      );
      if (scale >= 1) {
        return URL.createObjectURL(file);
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return URL.createObjectURL(file);
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const type = ALPHA_TYPES.has(file.type) ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, PREVIEW_JPEG_QUALITY),
      );
      return blob ? URL.createObjectURL(blob) : URL.createObjectURL(file);
    } finally {
      bitmap.close();
    }
  } catch {
    return URL.createObjectURL(file);
  }
}
