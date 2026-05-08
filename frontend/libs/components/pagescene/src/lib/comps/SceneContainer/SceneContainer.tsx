import { useCallback } from "react";
import { usePageSceneStore } from "../../PageSceneStore";
import { useViewportSize } from "../../hooks/useViewportSize";
import { Letterbox } from "./Letterbox";

// 56px is the artcraft host's TopBar; subtracted from the viewport
// height so the scene container fills the area below the bar. Hosts
// without a TopBar can pass a getViewportSize that already accounts
// for their chrome.
const TOP_BAR_PX = 56;

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  const editorLetterBox = usePageSceneStore((s) => s.editorLetterBox);
  const { width, height } = useViewportSize();
  const containerWidth = width;
  const containerHeight = height - TOP_BAR_PX;

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
