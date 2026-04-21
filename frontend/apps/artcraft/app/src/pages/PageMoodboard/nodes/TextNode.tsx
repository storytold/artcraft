import { memo } from "react";
import Konva from "konva";
import { Text as KonvaText } from "react-konva";
import { TextNode as TextNodeData } from "../types";
import { useMoodboardStore } from "../MoodboardStore";

interface Props {
  node: TextNodeData;
  draggable: boolean;
  selected: boolean;
  onSelect: (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => void;
}

const TextNodeInner = ({ node, draggable, selected, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  // Selector compares a single id — only the TextNode whose isEditing
  // actually flips will re-render when someone enters/exits text edit.
  const isEditing = useMoodboardStore(
    (s) => s.transient.editingTextId === node.id,
  );

  const handleSelect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => onSelect(node.id, e);

  return (
    <KonvaText
      id={node.id}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rotation={node.rotation}
      text={isEditing ? "" : node.text || "Note"}
      fontSize={node.fontSize}
      fill={node.color}
      padding={6}
      draggable={draggable}
      onMouseDown={handleSelect}
      onTouchStart={handleSelect}
      onDblClick={() => setEditingText(node.id)}
      onDblTap={() => setEditingText(node.id)}
      onDragStart={() => {
        pushHistory();
      }}
      onDragEnd={(e) => {
        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
      }}
      stroke={selected ? "#3b82f6" : undefined}
      strokeWidth={selected ? 0.5 : 0}
    />
  );
};

export const TextNode = memo(TextNodeInner);
