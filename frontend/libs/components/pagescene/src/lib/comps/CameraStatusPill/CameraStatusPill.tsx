import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faUpDownLeftRight } from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext";
import { toggleCameraView } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { EditorStates } from "../../enums";

// Small status pill (top-left) showing which camera the viewport is driving:
// the free "Viewport" camera vs looking through a render camera. Clicking it
// toggles camera view. Hidden in record mode (that mode is self-evident).
export const CameraStatusPill = () => {
  const editor = useContext(EngineContext);
  const editorState = usePageSceneStore((s) => s.editorState);
  const sceneMode = usePageSceneStore((s) => s.sceneMode);
  const cameras = usePageSceneStore((s) => s.cameras);

  if (sceneMode === "record") return null;

  const inCameraView = editorState === EditorStates.CAMERA_VIEW;
  const renderCameraLabel =
    cameras.find((c) => c.id !== "main")?.label ?? "Camera";

  return (
    <Tooltip
      content={inCameraView ? "Looking through render camera" : "Free viewport camera"}
      position="bottom"
      delay={300}
    >
      <button
        type="button"
        onClick={() => editor && toggleCameraView(editor)}
        className={
          inCameraView
            ? "flex h-[34px] items-center gap-2 rounded-full bg-brand-primary px-3 text-xs font-medium text-white shadow-xl transition-all duration-200"
            : "glass glass-no-hover flex h-[34px] items-center gap-2 rounded-full px-3 text-xs font-medium text-base-fg/70 shadow-xl transition-all duration-200 hover:text-base-fg"
        }
      >
        <FontAwesomeIcon
          icon={inCameraView ? faVideo : faUpDownLeftRight}
          className="h-3 w-3"
        />
        {inCameraView ? renderCameraLabel : "Viewport"}
      </button>
    </Tooltip>
  );
};

export default CameraStatusPill;
