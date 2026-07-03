import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCircle } from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { TimelineBar } from "../Timeline";

// Bottom-center controls for Record mode: a read-only playback bar (only
// when a timeline exists) plus Capture (still image) and Record (video).
export const RecordControls = () => {
  const editor = useContext(EngineContext);
  const timelineExists = usePageSceneStore((s) => s.timelineExists);

  // Capture the current framed shot as a still image (downloads it). In
  // record mode the viewport looks through the render camera, so this
  // captures the composed frame.
  const handleCapture = () => {
    editor?.snapShotOfCurrentFrame(true);
  };

  // TODO(scene-builder): wire to the video render pipeline. No video
  // encoder exists in pagescene yet, so this is a stub for now.
  const handleRecord = () => {
    // intentionally a no-op stub for dev
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
          className="glass glass-no-hover flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-base-fg shadow-xl hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" />
          Capture
        </button>
        <button
          type="button"
          onClick={handleRecord}
          className="flex items-center gap-2 rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.03]"
        >
          <FontAwesomeIcon icon={faCircle} className="h-3 w-3" />
          Record
        </button>
      </div>
    </div>
  );
};

export default RecordControls;
