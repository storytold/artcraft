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
import * as THREE from "three";
import type Editor from "../editor";
import { GridVisibleChangedEvent } from "../events/EngineEvent";
import { usePageSceneStore } from "../../PageSceneStore";

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
  const renderer = editor.renderer;
  const canvas = renderer?.domElement;
  const camera = editor.cameraController.camera;
  if (!timeline || !renderer || !canvas || !camera) return null;

  const fps = timeline.fps || 30;
  const frameCount = Math.max(1, Math.round(timeline.duration * fps));

  // Freeze the realtime loop so our seek+render stepping isn't fought by the
  // per-frame tick, then always restore it.
  editor.stopRenderLoop();

  // Encode the exact render framing, not the raw viewport: drop the
  // camera-view framing offset, hide the grid, and render at the render
  // camera's target dimensions/aspect for the duration of the encode.
  // Everything is restored in the finally block.
  const { width: targetWidth, height: targetHeight, aspectRatio } =
    editor.cameraController.getRenderDimensions();
  const sizeVector = new THREE.Vector2();
  renderer.getSize(sizeVector);
  const originalWidth = sizeVector.x;
  const originalHeight = sizeVector.y;
  const originalPixelRatio = renderer.getPixelRatio();
  const originalCameraAspect = camera.aspect;
  const wasGridVisible = usePageSceneStore.getState().gridVisible;

  editor.bus.emit(new GridVisibleChangedEvent(false));
  if (camera.view?.enabled) camera.clearViewOffset();
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(targetWidth, targetHeight, false);
  renderer.setPixelRatio(1);
  editor.postProcessing.composer?.setSize(targetWidth, targetHeight);

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
    camera.aspect = originalCameraAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(originalWidth, originalHeight, false);
    renderer.setPixelRatio(originalPixelRatio);
    editor.postProcessing.composer?.setSize(originalWidth, originalHeight);
    editor.cameraController.applyFrameProjection();
    editor.bus.emit(new GridVisibleChangedEvent(wasGridVisible));
    editor.startRenderLoop();
  }
}
