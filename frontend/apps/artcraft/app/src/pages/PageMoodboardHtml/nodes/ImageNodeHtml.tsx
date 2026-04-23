import { memo, useEffect, useRef, useState } from "react";
import { ImageNode as ImageNodeData } from "../../PageMoodboard/types";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";

interface Props {
  node: ImageNodeData;
  draggable: boolean;
  selected: boolean;
  onSelect: (id: string, additive: boolean) => void;
}

const ImageNodeHtmlInner = ({ node, draggable, selected, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const zoom = useMoodboardStore((s) => s.viewport.zoom);
  const [loaded, setLoaded] = useState(false);
  const dragStateRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startNode: { x: number; y: number };
    moved: boolean;
    pointerId: number | null;
  } | null>(null);

  useEffect(() => {
    // Probe whether the image actually resolves; placeholder renders until then.
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setLoaded(true);
    i.onerror = () => setLoaded(false);
    i.src = node.src;
    return () => {
      i.onload = null;
      i.onerror = null;
    };
  }, [node.src]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Middle-mouse is the pan hook's domain; ignore here.
    if (e.button !== 0) return;
    // When rendered as a group child (draggable=false), do not intercept —
    // the click must bubble to GroupNodeHtml's handler so the group itself
    // gets selected/dragged. Same reasoning when in lasso/text tool: let the
    // stage receive the click.
    if (!draggable) return;
    e.stopPropagation();
    const additive = e.shiftKey;
    onSelect(node.id, additive);
    dragStateRef.current = {
      active: true,
      startClient: { x: e.clientX, y: e.clientY },
      startNode: { x: node.x, y: node.y },
      moved: false,
      pointerId: e.pointerId,
    };
    const onMove = (ev: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st || !st.active) return;
      const { zoom: z } = useMoodboardStore.getState().viewport;
      const dx = (ev.clientX - st.startClient.x) / z;
      const dy = (ev.clientY - st.startClient.y) / z;
      if (!st.moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        st.moved = true;
        pushHistory();
      }
      if (st.moved) {
        updateNode(node.id, {
          x: st.startNode.x + dx,
          y: st.startNode.y + dy,
        });
      }
    };
    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-moodboard-html-node={node.id}
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "0 0",
        cursor: draggable ? "move" : "default",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {loaded ? (
        <img
          src={node.src}
          draggable={false}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "fill",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.06)",
            border: selected ? `${1 / zoom}px solid #3b82f6` : "none",
          }}
        />
      )}
    </div>
  );
};

export const ImageNodeHtml = memo(ImageNodeHtmlInner);
