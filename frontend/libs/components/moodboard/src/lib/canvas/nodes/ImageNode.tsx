import { memo, useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image as KonvaImage, Rect } from "react-konva";
import { ImageNode as ImageNodeData } from "../types";
import { useNodeDrag } from "../interactions/useNodeDrag";

interface Props {
  node: ImageNodeData;
  draggable: boolean;
  selected: boolean;
  // Receives the node id so parents can pass one stable callback to every
  // sibling rather than allocating a per-item closure on each render.
  onSelect: (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => void;
}

const ImageNodeInner = ({ node, draggable, selected, onSelect }: Props) => {
  const drag = useNodeDrag(node.id);
  const ref = useRef<Konva.Image | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = node.src;
    return () => {
      i.onload = null;
    };
  }, [node.src]);

  const handleSelect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => onSelect(node.id, e);

  return (
    <>
      {!img && (
        <Rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rotation={node.rotation}
          fill="#222"
          stroke={selected ? "#3b82f6" : "transparent"}
          strokeWidth={1}
        />
      )}
      <KonvaImage
        id={node.id}
        ref={(n) => {
          ref.current = n;
        }}
        image={img ?? undefined}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rotation={node.rotation}
        draggable={draggable}
        onMouseDown={handleSelect}
        onTouchStart={handleSelect}
        onDragStart={drag.onDragStart}
        onDragMove={drag.onDragMove}
        onDragEnd={drag.onDragEnd}
      />
    </>
  );
};

export const ImageNode = memo(ImageNodeInner);
