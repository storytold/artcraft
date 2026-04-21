import Konva from "konva";
import { Text as KonvaText } from "react-konva";
import { TextNode as TextNodeData } from "../types";
import { useMoodboardStore } from "../MoodboardStore";

interface Props {
  node: TextNodeData;
  draggable: boolean;
  selected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export const TextNode = ({ node, draggable, selected, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const editingTextId = useMoodboardStore((s) => s.transient.editingTextId);
  const isEditing = editingTextId === node.id;

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
      onMouseDown={onSelect}
      onTouchStart={onSelect}
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
