import { useContext } from "react";
import { CameraIcon, CircleIcon } from "lucide-react";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { recordTimeline } from "../../engine/recording/TimelineRecorder";
import { TimelineBar } from "../Timeline";

// Record-mode controls: a read-only playback bar (when a timeline exists) plus
// Capture (still) and Record (timeline→video).
//   Capture → auto-upload to gallery → open the app Lightbox on the token.
//   Record  → produce the clip → hand to the video review modal (manual upload,
//             since videos are large) via producedArtifact.
export const RecordControls = () => {
  const editor = useContext(EngineContext);
  const timelineExists = usePageSceneStore((s) => s.timelineExists);
  const aspectRatio = usePageSceneStore((s) => s.cameraAspectRatio);
  const recordingProgress = usePageSceneStore((s) => s.recordingProgress);
  const setProducedArtifact = usePageSceneStore((s) => s.setProducedArtifact);
  const setRecordingProgress = usePageSceneStore((s) => s.setRecordingProgress);

  const busy = recordingProgress !== null;

  // Snapshot the composed frame → hand to the review modal, which previews it
  // immediately and auto-uploads to the gallery (with status) → app Lightbox.
  const handleCapture = () => {
    if (!editor || busy) return;
    setRecordingProgress({ phase: "capturing", pct: 0 });
    // Defer so the overlay paints before the (sync) snapshot work.
    requestAnimationFrame(() => {
      try {
        const snap = editor.snapShotOfCurrentFrame(false);
        if (snap) {
          setProducedArtifact({
            kind: "image",
            blob: snap.file,
            objectUrl: URL.createObjectURL(snap.file),
            fileName: snap.file.name,
            mimeType: "image/png",
            aspectRatio,
          });
        }
      } finally {
        setRecordingProgress(null);
      }
    });
  };

  // Encode the timeline; the produced clip opens the review modal for a manual
  // upload (videos are large, so we don't auto-upload).
  const handleRecord = async () => {
    if (!editor || busy || !timelineExists) return;
    setRecordingProgress({ phase: "encoding", pct: 0 });
    try {
      const result = await recordTimeline(editor, {
        onProgress: (pct) => setRecordingProgress({ phase: "encoding", pct }),
      });
      if (result) {
        setProducedArtifact({
          kind: "video",
          blob: result.blob,
          objectUrl: URL.createObjectURL(result.blob),
          fileName: result.fileName,
          mimeType: result.mimeType,
          aspectRatio,
        });
      }
    } finally {
      setRecordingProgress(null);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3">
      {timelineExists && (
        <div className="w-[70vw] max-w-3xl">
          <TimelineBar readOnly />
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCapture}
          disabled={busy}
          className="glass glass-no-hover flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-base-fg hover:bg-white/10 disabled:opacity-50"
        >
          <CameraIcon  className="h-3.5 w-3.5" />
          Capture
        </button>
        <Tooltip
          content={
            timelineExists
              ? "Render the timeline to video"
              : "Add an animation timeline first"
          }
          position="top"
          delay={200}
        >
          <button
            type="button"
            onClick={handleRecord}
            disabled={busy || !timelineExists}
            className="flex items-center gap-2 rounded-[3px] bg-red px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
          >
            <CircleIcon  className="h-3 w-3" />
            Record
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default RecordControls;
