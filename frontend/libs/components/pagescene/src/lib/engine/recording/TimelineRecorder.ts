// Deterministic timeline → video encoder. Steps the timeline frame-by-frame
// (seekTo, render, grab) and encodes with mediabunny (WebCodecs) — the same
// pattern as video-editor's SceneExporter. Avoids realtime MediaRecorder
// (whose webm duration header is unreliable).

import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  QUALITY_HIGH,
} from "mediabunny";
import type Editor from "../editor";

export type RecordFormat = "mp4" | "webm";

export interface RecordResult {
  blob: Blob;
  mimeType: string;
  fileName: string;
}

export interface RecordOptions {
  format?: RecordFormat;
  onProgress?: (pct: number) => void;
  // Mutable flag the caller can flip to abort mid-encode.
  signal?: { cancelled: boolean };
}

export async function recordTimeline(
  editor: Editor,
  opts: RecordOptions = {},
): Promise<RecordResult | null> {
  const format = opts.format ?? "mp4";
  const timeline = editor.timelineController.getTimeline();
  const canvas = editor.renderer?.domElement;
  if (!timeline || !canvas) return null;

  const fps = timeline.fps || 30;
  const frameCount = Math.max(1, Math.round(timeline.duration * fps));

  // Freeze the realtime loop so our seek+render stepping isn't fought by the
  // per-frame tick, then always restore it.
  editor.stopRenderLoop();
  try {
    const output = new Output({
      format:
        format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
      target: new BufferTarget(),
    });
    const videoSource = new CanvasSource(canvas, {
      codec: format === "webm" ? "vp9" : "avc",
      bitrate: QUALITY_HIGH,
    });
    output.addVideoTrack(videoSource, { frameRate: fps });
    await output.start();

    for (let i = 0; i < frameCount; i++) {
      if (opts.signal?.cancelled) {
        await output.cancel();
        return null;
      }
      editor.timelineController.seekTo(i / fps);
      await editor.renderScene();
      await videoSource.add(i / fps, 1 / fps);
      opts.onProgress?.(i / frameCount);
    }

    videoSource.close();
    await output.finalize();
    opts.onProgress?.(1);

    const buffer = output.target.buffer;
    if (!buffer) return null;
    const mimeType = format === "webm" ? "video/webm" : "video/mp4";
    return {
      blob: new Blob([buffer], { type: mimeType }),
      mimeType,
      fileName: `scene-recording.${format}`,
    };
  } finally {
    editor.startRenderLoop();
  }
}
