import { useContext } from "react";
import { CameraIcon, CircleIcon } from "lucide-react";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { captureStill, recordVideo } from "../../actions/recordOutput";
import { TimelineBar } from "../Timeline";

// Record-mode controls: a read-only playback bar (when a timeline exists) plus
// Capture (still) and Record (timeline→video). The actual output logic lives
// in actions/recordOutput.ts, shared with the capture/record keybinds.
//   Capture → auto-upload to gallery → open the app Lightbox on the token.
//   Record  → produce the clip → hand to the video review modal (manual upload,
//             since videos are large) via producedArtifact.
export const RecordControls = () => {
  const editor = useContext(EngineContext);
  const timelineExists = usePageSceneStore((s) => s.timelineExists);
  const recordingProgress = usePageSceneStore((s) => s.recordingProgress);

  const busy = recordingProgress !== null;

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
          onClick={() => editor && captureStill(editor)}
          disabled={busy}
          className="glass glass-no-hover flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-base-fg shadow-xl hover:bg-white/10 disabled:opacity-50"
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
            onClick={() => editor && void recordVideo(editor)}
            disabled={busy || !timelineExists}
            className="flex items-center gap-2 rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
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
