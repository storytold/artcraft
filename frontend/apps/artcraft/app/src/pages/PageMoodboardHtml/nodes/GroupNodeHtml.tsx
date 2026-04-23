import { memo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  GroupNode as GroupNodeData,
  MoodboardNode,
} from "../../PageMoodboard/types";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { ImageNodeHtml } from "./ImageNodeHtml";
import { TextNodeHtml } from "./TextNodeHtml";
import { VideoNodeHtml } from "./VideoNodeHtml";

interface Props {
  node: GroupNodeData;
  onSelect: (id: string, additive: boolean) => void;
}

// Children inside a group are rendered with their `parentId` set to the group.
// They don't directly fire onSelect — the group absorbs clicks and selects
// itself, which matches the Konva group's hit-rect behavior.
const NO_OP_SELECT = () => {};

const GroupNodeHtmlInner = ({ node, onSelect }: Props) => {
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

  return (
    <div
      data-moodboard-html-group={node.id}
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "0 0",
        touchAction: "none",
      }}
    >
      {children.map((child) => {
        if (child.kind === "image") {
          return (
            <ImageNodeHtml
              key={child.id}
              node={child}
              draggable={false}
              selected={false}
              onSelect={NO_OP_SELECT}
            />
          );
        }
        if (child.kind === "video") {
          return (
            <VideoNodeHtml
              key={child.id}
              node={child}
              draggable={false}
              selected={false}
              onSelect={NO_OP_SELECT}
            />
          );
        }
        if (child.kind === "text") {
          return (
            <TextNodeHtml
              key={child.id}
              node={child}
              draggable={false}
              onSelect={NO_OP_SELECT}
            />
          );
        }
        if (child.kind === "group") {
          return (
            <GroupNodeHtml
              key={child.id}
              node={child}
              onSelect={NO_OP_SELECT}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export const GroupNodeHtml = memo(GroupNodeHtmlInner);
