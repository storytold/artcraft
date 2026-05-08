import { useCallback } from "react";
import { usePageSceneStore } from "../PageSceneStore";

// Canvas refs flow through PageSceneStore so the EngineProvider effect
// can react to mount/unmount. The callbacks intentionally pass `null`
// through on unmount so the engine-lifecycle effect can dispose the
// Editor when the canvases go away (e.g. on tab switch). A previous
// `if (node)` filter dropped null and leaked the Editor.

export const EditorCanvas = () => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      usePageSceneStore.getState().setEditorCanvasEl(node);
    },
    [],
  );

  return (
    <canvas
      ref={canvasCallbackRef}
      id="video-scene"
      width="1280px"
      height="720px"
    />
  );
};

export const CameraViewCanvas = ({ className }: { className?: string }) => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      usePageSceneStore.getState().setCamViewCanvasEl(node);
    },
    [],
  );

  return (
    <canvas className={className} ref={canvasCallbackRef} id="camera-view" />
  );
};
