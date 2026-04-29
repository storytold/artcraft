import { useCallback, useContext } from "react";
import { camViewCanvasSignal, editorCanvasSignal, EngineContext } from "~/pages/PageScene/contexts/EngineContext";

export const EditorCanvas = () => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node) {
        editorCanvasSignal.value = node;
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
    />
  );
};

export const CameraViewCanvas = ({ className }: { className?: string }) => {
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node) {
        camViewCanvasSignal.value = node;
      }
    },
    [],
  );

  return (
    <canvas className={className} ref={canvasCallbackRef} id="camera-view" />
  );
};
