import { memo } from "react";
import Konva from "konva";
import { Group, Rect } from "react-konva";
import { useShallow } from "zustand/react/shallow";
import { GroupNode as GroupNodeData, MoodboardNode } from "../types";
import { useMoodboardStore } from "../MoodboardStore";
import { useNodeDrag } from "../interactions/useNodeDrag";
import { ImageNode } from "./ImageNode";
import { TextNode } from "./TextNode";

interface Props {
  node: GroupNodeData;
  selected: boolean;
  onSelect: (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => void;
}

// Shared no-op for child renders: the group absorbs all clicks, so child
// nodes never fire `onSelect`. Using a module-level constant keeps the
// reference stable across renders, which lets the memoized child nodes
// skip work when nothing else about them changed.
const NO_OP_SELECT = () => {};

const GroupNodeInner = ({ node, selected, onSelect }: Props) => {
  const drag = useNodeDrag(node.id);

  // Subscribe only to this group's own children, with a shallow compare on
  // the returned array. Avoids re-rendering every group whenever any node
  // anywhere in the board updates (which would otherwise mutate the whole
  // `nodes` map reference).
  const children = useMoodboardStore(
    useShallow((s) =>
      node.childIds
        .map((id) => s.nodes[id])
        .filter((n): n is MoodboardNode => Boolean(n)),
    ),
  );

  const handleSelect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => onSelect(node.id, e);

  return (
    <Group
      id={node.id}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rotation={node.rotation}
      draggable
      onMouseDown={handleSelect}
      onTouchStart={handleSelect}
      onDragStart={drag.onDragStart}
      onDragMove={drag.onDragMove}
      onDragEnd={drag.onDragEnd}
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
              onSelect={NO_OP_SELECT}
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
              onSelect={NO_OP_SELECT}
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
              onSelect={NO_OP_SELECT}
            />
          );
        }
        return null;
      })}
    </Group>
  );
};

export const GroupNode = memo(GroupNodeInner);
