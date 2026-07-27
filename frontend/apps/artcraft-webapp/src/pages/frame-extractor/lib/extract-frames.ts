// Client-side video frame extraction: seek the <video> element, wait for the
// frame to be presented, draw it to a canvas, and encode a PNG blob. No server
// round-trips — but the video must not taint the canvas (cross-origin sources
// need CORS headers + crossOrigin="anonymous" on the element).

export interface ExtractedFrame {
  id: string;
  blob: Blob;
  // Preview URL for the blob. Owned by the caller: revoke when the frame is
  // discarded (but not while a handed-off reference still displays it).
  objectUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

export type FrameErrorKind = "cors" | "timeout" | "decode" | "aborted";

export class FrameExtractionError extends Error {
  kind: FrameErrorKind;

  constructor(kind: FrameErrorKind, message: string) {
    super(message);
    this.name = "FrameExtractionError";
    this.kind = kind;
  }
}

export interface ExtractFramesOptions {
  startSec: number;
  count: number;
  spacingMs: number;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

const METADATA_TIMEOUT_MS = 5000;
const SEEK_TIMEOUT_MS = 3000;
// Best-effort wait for the seeked-to frame to be presented; bounded because a
// paused video that doesn't present a new frame never fires a video-frame
// callback at all.
const PAINT_WAIT_MS = 300;
// Seeking to (almost) the current position presents no new frame; skip the
// seek entirely rather than wait on events that may never fire.
const SEEK_EPSILON_SEC = 0.001;

// Capture a single frame at the given time. Seeks the video there and leaves
// it there (the natural behavior for "capture at playhead" — the playhead
// already is at timeSec, modulo clamping).
export async function captureFrameAt(
  video: HTMLVideoElement,
  timeSec: number,
): Promise<ExtractedFrame> {
  await ensureVideoReady(video);
  const canvas = createCanvasFor(video);
  const target = clampToDuration(timeSec, video.duration);
  // Seek even when the playhead already sits at the target: it's cheap, and it
  // guarantees the presented frame matches currentTime (a paused video that
  // was never seeked can still be showing the poster frame).
  await seekTo(video, target);
  return drawFrame(video, canvas, target);
}

// Burst capture: `count` frames starting at `startSec`, `spacingMs` apart.
// Restores the original playhead and play state when finished, cancelled, or
// failed. Throws FrameExtractionError; on "aborted" any frames captured so
// far are lost (callers treat cancel as a full stop).
export async function extractFrames(
  video: HTMLVideoElement,
  { startSec, count, spacingMs, onProgress, signal }: ExtractFramesOptions,
): Promise<ExtractedFrame[]> {
  await ensureVideoReady(video);

  const originalTime = video.currentTime;
  const wasPlaying = !video.paused;
  if (wasPlaying) video.pause();

  const canvas = createCanvasFor(video);
  const frames: ExtractedFrame[] = [];

  try {
    for (let i = 0; i < count; i++) {
      if (signal?.aborted) {
        throw new FrameExtractionError("aborted", "Extraction cancelled");
      }

      const timestamp = startSec + (i * spacingMs) / 1000;
      if (timestamp > video.duration) break;

      const target = clampToDuration(timestamp, video.duration);
      await seekTo(video, target);
      frames.push(await drawFrame(video, canvas, target));
      onProgress?.(frames.length, count);
    }
    return frames;
  } catch (error) {
    frames.forEach((frame) => URL.revokeObjectURL(frame.objectUrl));
    throw error;
  } finally {
    video.currentTime = originalTime;
    if (wasPlaying) video.play().catch(() => {});
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function ensureVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new FrameExtractionError("timeout", "Video failed to load metadata"),
      );
    }, METADATA_TIMEOUT_MS);

    const handleLoadedData = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new FrameExtractionError("decode", "Video failed to load"));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
  });

  if (!video.videoWidth || !video.videoHeight) {
    throw new FrameExtractionError("decode", "Video has no visible frames");
  }
}

function createCanvasFor(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  return canvas;
}

// Clamp into [0, duration - 1ms]: seeking exactly to `duration` after `ended`
// can present a black frame. Non-finite durations (live/webm streams) pass
// through — the seek target is whatever the caller had.
function clampToDuration(timeSec: number, duration: number): number {
  if (!Number.isFinite(duration)) return Math.max(0, timeSec);
  return Math.max(0, Math.min(timeSec, Math.max(0, duration - 0.001)));
}

async function seekTo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  // Already there (e.g. the first burst frame starts at the playhead): the
  // current frame is already presented and drawable.
  if (Math.abs(video.currentTime - timeSec) < SEEK_EPSILON_SEC) return;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new FrameExtractionError("timeout", "Video seek timed out"));
    }, SEEK_TIMEOUT_MS);

    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener("seeked", handleSeeked);
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.currentTime = timeSec;
  });

  // "seeked" can fire before the new frame is actually presented (notably
  // Safari). Wait for a video-frame callback when available — but bounded,
  // since a paused video presents no further frames once composition settles
  // and the callback would otherwise never fire.
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, PAINT_WAIT_MS);
    const done = () => {
      clearTimeout(timeout);
      resolve();
    };
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => done());
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => done()));
    }
  });
}

async function drawFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  timestamp: number,
): Promise<ExtractedFrame> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new FrameExtractionError("decode", "Canvas 2D context unavailable");
  }

  try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch (error) {
    if (error instanceof Error && error.name === "SecurityError") {
      throw new FrameExtractionError(
        "cors",
        "Video is cross-origin protected",
      );
    }
    throw new FrameExtractionError("decode", "Failed to draw video frame");
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        // toBlob also returns null on a tainted canvas.
        reject(new FrameExtractionError("cors", "Failed to encode frame"));
      }
    }, "image/png");
  });

  return {
    id: crypto.randomUUID(),
    blob,
    objectUrl: URL.createObjectURL(blob),
    timestamp,
    width: canvas.width,
    height: canvas.height,
  };
}
