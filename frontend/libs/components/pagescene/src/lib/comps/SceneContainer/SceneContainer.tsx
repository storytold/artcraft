import { useCallback, useEffect, useRef, useState } from "react";
import { usePageSceneStore } from "../../PageSceneStore";
import { EditorStates } from "../../enums";
import { CameraFrame } from "./CameraFrame";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  const editorLetterBox = usePageSceneStore((s) => s.editorLetterBox);
  const editorState = usePageSceneStore((s) => s.editorState);
  const sceneMode = usePageSceneStore((s) => s.sceneMode);
  // The framing overlay only makes sense while rendering through a camera:
  // camera view and record mode. The free viewport shows no aspect mattes.
  const showCameraFrame =
    editorLetterBox &&
    (editorState === EditorStates.CAMERA_VIEW || sceneMode === "record");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Sets the DOM node both on mount (truthy) and unmount (null) so the
  // engine lifecycle effect can react to the canvas unmounting when the
  // tab switches away from 3D. The previous `if (node)` filter swallowed
  // the unmount case and leaked the Editor instance.
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node;
    usePageSceneStore.getState().setSceneContainerEl(node);
    if (node) {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    }
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={callbackRef}
      id="video-scene-container"
      className="relative h-full w-full"
    >
      {children}
      {showCameraFrame && (
        <CameraFrame width={size.width} height={size.height} />
      )}
    </div>
  );
};
