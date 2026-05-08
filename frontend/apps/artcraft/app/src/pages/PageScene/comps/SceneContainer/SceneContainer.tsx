import { useCallback } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  useSignals();
  const editorLetterBox = usePageSceneStore((s) => s.editorLetterBox);
  const containerWidth = pageWidth.value;
  const containerHeight = pageHeight.value - 56;

  // Sets the DOM node both on mount (truthy) and unmount (null) so the
  // engine lifecycle effect can react to the canvas unmounting when the
  // tab switches away from 3D. The previous `if (node)` filter swallowed
  // the unmount case and leaked the Editor instance.
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    usePageSceneStore.getState().setSceneContainerEl(node);
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
