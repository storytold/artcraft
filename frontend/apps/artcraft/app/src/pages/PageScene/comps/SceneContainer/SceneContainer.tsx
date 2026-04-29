import { useCallback } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import { sceneContainerSignal } from "~/pages/PageScene/contexts/EngineContext";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  useSignals();
  const editorLetterBox = usePageSceneStore((s) => s.editorLetterBox);
  const containerWidth = pageWidth.value;
  const containerHeight = pageHeight.value - 56;

  const callbackRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      sceneContainerSignal.value = node;
    }
  }, []);

  return (
    <div
      ref={callbackRef}
      id="video-scene-container"
      className="relative"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {children}
      <Letterbox
        isShowing={editorLetterBox}
        width={containerWidth}
        height={containerHeight}
      />
    </div>
  );
};
