import { useEffect, useRef } from "react";
import { useMoodboardStore } from "./MoodboardStore";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

// Floats a positioned <textarea> over the editing text node so the user can
// type directly. Konva Text has no native edit mode; this is the standard
// react-konva pattern. Phase 1 has no zoom/pan, so absolute positioning is
// simply (node.x, node.y) within the container.
export const TextEditOverlay = ({ containerRef }: Props) => {
  const editingId = useMoodboardStore((s) => s.transient.editingTextId);
  const node = useMoodboardStore((s) =>
    editingId ? s.nodes[editingId] : null,
  );
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const initialTextRef = useRef<string>("");

  useEffect(() => {
    if (editingId && node && node.kind === "text") {
      initialTextRef.current = node.text;
      requestAnimationFrame(() => {
        taRef.current?.focus();
        taRef.current?.select();
      });
    }
  }, [editingId, node]);

  if (!editingId || !node || node.kind !== "text") return null;

  const commit = () => {
    if (!taRef.current) return;
    const newText = taRef.current.value;
    if (newText !== initialTextRef.current) {
      pushHistory();
      updateNode(node.id, { text: newText });
    }
    setEditingText(null);
  };

  const cancel = () => {
    setEditingText(null);
  };

  return (
    <textarea
      ref={taRef}
      defaultValue={node.text}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
      }}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        background: "rgba(15,15,18,0.85)",
        color: node.color,
        border: "1px dashed rgba(59,130,246,0.6)",
        outline: "none",
        padding: 6,
        fontSize: node.fontSize,
        fontFamily: "inherit",
        resize: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
    />
  );
};
