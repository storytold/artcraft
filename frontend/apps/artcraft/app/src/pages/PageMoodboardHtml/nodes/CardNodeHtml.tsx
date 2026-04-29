import { memo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  CardNode as CardNodeData,
  MoodboardNode,
} from "../../PageMoodboard/types";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";

interface Props {
  node: CardNodeData;
  draggable: boolean;
  onSelect: (id: string, additive: boolean) => void;
}

// Cards render their children in a vertical flex column. Children fill the
// card's inner width; their height follows the child's natural aspect ratio
// (images/videos) or own height (text). The card itself absorbs clicks —
// children inside a card aren't independently selectable, same pattern as
// GroupNodeHtml.
const CardNodeHtmlInner = ({ node, draggable, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const children = useMoodboardStore(
    useShallow((s) =>
      node.childIds
        .map((id) => s.nodes[id])
        .filter((n): n is MoodboardNode => Boolean(n)),
    ),
  );
  const dragStateRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startNode: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
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

  const innerW = Math.max(node.width - node.padding * 2, 1);

  return (
    <div
      data-moodboard-html-card={node.id}
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "0 0",
        background: node.backgroundColor,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        borderRadius: 6,
        cursor: draggable ? "move" : "default",
        userSelect: "none",
        touchAction: "none",
        boxSizing: "border-box",
        padding: node.padding,
        display: "flex",
        flexDirection: "column",
        gap: node.padding,
        overflow: "hidden",
      }}
    >
      {children.map((child) => (
        <CardChildSlot
          key={child.id}
          child={child}
          innerWidth={innerW}
        />
      ))}
    </div>
  );
};

interface SlotProps {
  child: MoodboardNode;
  innerWidth: number;
}

// Each card slot renders a single child at full card-inner-width. We don't
// reuse ImageNodeHtml/VideoNodeHtml here because those position via absolute
// x/y — inside a card we want flex-driven layout instead.
export const CardChildSlot = ({ child, innerWidth }: SlotProps) => {
  if (child.kind === "image") {
    const ratio =
      child.naturalH > 0 && child.naturalW > 0
        ? child.naturalH / child.naturalW
        : 1;
    return (
      <img
        src={child.src}
        draggable={false}
        alt=""
        style={{
          width: innerWidth,
          height: innerWidth * ratio,
          display: "block",
          objectFit: "fill",
          userSelect: "none",
          pointerEvents: "none",
          borderRadius: 4,
        }}
      />
    );
  }
  if (child.kind === "video") {
    const ratio =
      child.naturalH > 0 && child.naturalW > 0
        ? child.naturalH / child.naturalW
        : 1;
    return (
      <video
        src={child.src}
        autoPlay={child.autoplay}
        muted={child.muted}
        loop={child.loop}
        playsInline
        preload="metadata"
        style={{
          width: innerWidth,
          height: innerWidth * ratio,
          display: "block",
          objectFit: "fill",
          pointerEvents: "none",
          borderRadius: 4,
        }}
      />
    );
  }
  if (child.kind === "text") {
    return (
      <div
        style={{
          width: innerWidth,
          height: child.height,
          padding: 4,
          color: child.color,
          fontSize: child.fontSize,
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          boxSizing: "border-box",
          lineHeight: 1.2,
        }}
      >
        {child.text || "Note"}
      </div>
    );
  }
  return null;
};

export const CardNodeHtml = memo(CardNodeHtmlInner);
