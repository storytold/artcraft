import { memo, useRef } from "react";
import { TextNode as TextNodeData } from "../../PageMoodboard/types";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";

interface Props {
  node: TextNodeData;
  draggable: boolean;
  onSelect: (id: string, additive: boolean) => void;
}

const TextNodeHtmlInner = ({ node, draggable, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const isEditing = useMoodboardStore(
    (s) => s.transient.editingTextId === node.id,
  );
  const dragStateRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startNode: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // When rendered as a group child (draggable=false), do not intercept —
    // the click must bubble to GroupNodeHtml's handler so the group itself
    // gets selected/dragged. Same reasoning when in lasso/text tool.
    if (!draggable) return;
    e.stopPropagation();
    const additive = e.shiftKey;
    onSelect(node.id, additive);
    dragStateRef.current = {
      active: true,
      startClient: { x: e.clientX, y: e.clientY },
      startNode: { x: node.x, y: node.y },
      moved: false,
    };
    const onMove = (ev: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st || !st.active) return;
      const { zoom } = useMoodboardStore.getState().viewport;
      const dx = (ev.clientX - st.startClient.x) / zoom;
      const dy = (ev.clientY - st.startClient.y) / zoom;
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

  const handleDoubleClick = () => {
    setEditingText(node.id);
  };

  return (
    <div
      data-moodboard-html-node={node.id}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "0 0",
        padding: 6,
        fontSize: node.fontSize,
        color: node.color,
        fontFamily: "inherit",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        boxSizing: "border-box",
        userSelect: "none",
        cursor: draggable ? "move" : "default",
        touchAction: "none",
        visibility: isEditing ? "hidden" : "visible",
        lineHeight: 1.2,
      }}
    >
      {node.text || "Note"}
    </div>
  );
};

export const TextNodeHtml = memo(TextNodeHtmlInner);
