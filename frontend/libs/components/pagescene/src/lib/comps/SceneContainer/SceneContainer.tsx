import { useCallback, useEffect, useRef, useState } from "react";
import { usePageSceneStore } from "../../PageSceneStore";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  const editorLetterBox = usePageSceneStore((s) => s.editorLetterBox);
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
      <Letterbox
        isShowing={editorLetterBox}
        width={size.width}
        height={size.height}
      />
    </div>
  );
};
