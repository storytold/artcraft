import { useCallback } from "react";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

export const EditorCanvas = () => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node) {
        usePageSceneStore.getState().setEditorCanvasEl(node);
      }
    },
    [],
  );

  return (
    <canvas
      ref={canvasCallbackRef}
      id="video-scene"
      width="1280px"
      height="720px"
      tabIndex={0}
      style={{ outline: "none" }}
    />
  );
};

export const CameraViewCanvas = ({ className }: { className?: string }) => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node) {
        usePageSceneStore.getState().setCamViewCanvasEl(node);
      }
    },
    [],
  );

  return (
    <canvas className={className} ref={canvasCallbackRef} id="camera-view" />
  );
};
