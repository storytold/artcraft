import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { EngineContext } from "../../contexts/EngineContext";
import { toggleCameraView } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { EditorStates } from "../../enums";

// Shown only while looking through a render camera (CAMERA_VIEW). Exits back
// to the free editing view. Positionless by default — the host (Stage3DBody)
// docks it next to the timeline bar via `className`.
export const ExitCameraView = ({ className }: { className?: string }) => {
  const editor = useContext(EngineContext);
  const editorState = usePageSceneStore((s) => s.editorState);
  const sceneMode = usePageSceneStore((s) => s.sceneMode);

  // In record mode the viewport is also CAMERA_VIEW, but the mode pill
  // handles leaving — don't show the manual exit button there.
  if (editorState !== EditorStates.CAMERA_VIEW || sceneMode === "record") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => editor && toggleCameraView(editor)}
      className={twMerge(
        "flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-brand-primary px-4 text-sm font-medium text-white shadow-xl transition-colors hover:bg-brand-primary/90",
        className,
      )}
    >
      <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3.5 w-3.5" />
      Exit
    </button>
  );
};

export default ExitCameraView;
