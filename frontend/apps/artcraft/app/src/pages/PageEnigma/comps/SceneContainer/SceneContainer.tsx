import { useCallback, useContext } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import { editorLetterBox } from "~/pages/PageEnigma/signals";
import { EngineContext, sceneContainerSignal } from "~/pages/PageEnigma/contexts/EngineContext";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  useSignals();
  const containerWidth = pageWidth.value;

  const containerHeight = pageHeight.value - 56;

  const callbackRef = useCallback(
    (node: HTMLDivElement) => {
      if (node) {
        sceneContainerSignal.value = node;
      }
    },
    [],
  );

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
        isShowing={editorLetterBox.value}
        width={containerWidth}
        height={containerHeight}
      />
    </div>
  );
};
