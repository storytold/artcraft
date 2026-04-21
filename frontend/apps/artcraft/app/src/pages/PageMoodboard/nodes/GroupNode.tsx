import Konva from "konva";
import { Group, Rect } from "react-konva";
import { GroupNode as GroupNodeData, MoodboardNode } from "../types";
import { useMoodboardStore } from "../MoodboardStore";
import { ImageNode } from "./ImageNode";
import { TextNode } from "./TextNode";

interface Props {
  node: GroupNodeData;
  selected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export const GroupNode = ({ node, selected, onSelect }: Props) => {
  const nodes = useMoodboardStore((s) => s.nodes);
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);

  const children: MoodboardNode[] = node.childIds
    .map((id) => nodes[id])
    .filter((n): n is MoodboardNode => Boolean(n));

  return (
    <Group
      id={node.id}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rotation={node.rotation}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragStart={() => {
        pushHistory();
      }}
      onDragEnd={(e) => {
        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
      }}
    >
      {/* Transparent hit/transform target so the Transformer has stable bounds. */}
      <Rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        fill="transparent"
        stroke={selected ? "#3b82f6" : "transparent"}
        strokeWidth={1}
        dash={selected ? [4, 4] : undefined}
        listening={false}
      />
      {children.map((child) => {
        if (child.kind === "image") {
          return (
            <ImageNode
              key={child.id}
              node={child}
              draggable={false}
              selected={false}
              onSelect={() => {}}
            />
          );
        }
        if (child.kind === "text") {
          return (
            <TextNode
              key={child.id}
              node={child}
              draggable={false}
              selected={false}
              onSelect={() => {}}
            />
          );
        }
        // Nested groups not exercised in phase 1, but render recursively for future.
        if (child.kind === "group") {
          return (
            <GroupNode
              key={child.id}
              node={child}
              selected={false}
              onSelect={() => {}}
            />
          );
        }
        return null;
      })}
    </Group>
  );
};
