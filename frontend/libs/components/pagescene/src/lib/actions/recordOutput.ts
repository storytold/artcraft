// Capture (still) / Record (timeline → video) output actions. Shared by the
// RecordControls buttons and the keybind handlers (registry ids
// pagescene.record.captureStill / pagescene.record.recordVideo), so both
// entry points get the same busy-guarding and camera handling.

import type Editor from "../engine/editor";
import { recordTimeline } from "../engine/recording/TimelineRecorder";
import { usePageSceneStore } from "../PageSceneStore";

// Snapshot the composed frame → hand to the review modal, which previews it
// immediately and auto-uploads to the gallery (with status) → app Lightbox.
export function captureStill(editor: Editor): void {
  const store = usePageSceneStore.getState();
  if (store.recordingProgress !== null) return;
  // Output always comes from the render camera. Record mode lets the user
  // peek at the scene view, so re-enter camera view (idempotent) first.
  editor.cameraController.enterCameraView();
  store.setRecordingProgress({ phase: "capturing", pct: 0 });
  // Defer so the overlay paints before the (sync) snapshot work.
  requestAnimationFrame(() => {
    const s = usePageSceneStore.getState();
    try {
      const snap = editor.snapShotOfCurrentFrame(false);
      if (snap) {
        s.setProducedArtifact({
          kind: "image",
          blob: snap.file,
          objectUrl: URL.createObjectURL(snap.file),
          fileName: snap.file.name,
          mimeType: "image/png",
          aspectRatio: s.cameraAspectRatio,
        });
      }
    } finally {
      s.setRecordingProgress(null);
    }
  });
}

// Encode the timeline; the produced clip opens the review modal for a manual
// upload (videos are large, so we don't auto-upload). Abortable mid-encode
// via the store's encodeCancelSignal (overlay Cancel button, Escape keybind).
export async function recordVideo(editor: Editor): Promise<void> {
  const store = usePageSceneStore.getState();
  if (store.recordingProgress !== null || !store.timelineExists) return;
  // See captureStill — the encode reads the viewport camera, so it must be
  // sitting at the render camera.
  editor.cameraController.enterCameraView();
  store.setRecordingProgress({ phase: "encoding", pct: 0 });
  const cancelSignal = { cancelled: false };
  store.setEncodeCancelSignal(cancelSignal);
  try {
    const result = await recordTimeline(editor, {
      signal: cancelSignal,
      onProgress: (pct) =>
        usePageSceneStore
          .getState()
          .setRecordingProgress({ phase: "encoding", pct }),
    });
    if (result) {
      const s = usePageSceneStore.getState();
      s.setProducedArtifact({
        kind: "video",
        blob: result.blob,
        objectUrl: URL.createObjectURL(result.blob),
        fileName: result.fileName,
        mimeType: result.mimeType,
        aspectRatio: s.cameraAspectRatio,
      });
    }
  } finally {
    const s = usePageSceneStore.getState();
    s.setEncodeCancelSignal(null);
    s.setRecordingProgress(null);
  }
}
