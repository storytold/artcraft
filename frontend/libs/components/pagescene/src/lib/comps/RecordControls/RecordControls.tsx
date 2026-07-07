import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCircle } from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { recordTimeline } from "../../engine/recording/TimelineRecorder";
import { TimelineBar } from "../Timeline";

// Bottom-center controls for Record mode: a read-only playback bar (only when
// a timeline exists) plus Capture (still image) and Record (timeline → video).
// Both produce a locally-cached artifact and open the completion modal.
export const RecordControls = () => {
  const editor = useContext(EngineContext);
  const timelineExists = usePageSceneStore((s) => s.timelineExists);
  const aspectRatio = usePageSceneStore((s) => s.cameraAspectRatio);
  const recordingProgress = usePageSceneStore((s) => s.recordingProgress);
  const setProducedArtifact = usePageSceneStore((s) => s.setProducedArtifact);
  const setRecordingProgress = usePageSceneStore((s) => s.setRecordingProgress);

  const busy = recordingProgress !== null;

  // Still capture of the composed (render-camera) frame.
  const handleCapture = () => {
    if (!editor || busy) return;
    setRecordingProgress({ phase: "capturing", pct: 0 });
    // Defer a tick so the overlay paints before the (sync) snapshot work.
    requestAnimationFrame(() => {
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
      setRecordingProgress(null);
    });
  };

  // Encode the whole timeline to a video.
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
          className="glass glass-no-hover flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-base-fg shadow-xl hover:bg-white/10 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" />
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
            className="flex items-center gap-2 rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
          >
            <FontAwesomeIcon icon={faCircle} className="h-3 w-3" />
            Record
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default RecordControls;
