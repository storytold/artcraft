import { useContext } from "react";
import { EngineContext } from "../../contexts/EngineContext";
import { toggleCameraView } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { EditorStates } from "../../enums";

// Shown only while looking through a render camera (CAMERA_VIEW). Exits back
// to the free editing view. Text button is a dev placeholder — a proper icon
// comes later.
export const ExitCameraView = () => {
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
      className="absolute bottom-6 right-6 z-40 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-brand-primary px-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-white shadow-xl transition-transform hover:scale-105"
    >
      Exit Camera View
    </button>
  );
};

export default ExitCameraView;
