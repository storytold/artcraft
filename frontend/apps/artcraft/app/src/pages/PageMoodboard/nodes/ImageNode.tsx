import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image as KonvaImage, Rect } from "react-konva";
import { ImageNode as ImageNodeData } from "../types";
import { useMoodboardStore } from "../MoodboardStore";

interface Props {
  node: ImageNodeData;
  draggable: boolean;
  selected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export const ImageNode = ({ node, draggable, selected, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
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
        onMouseDown={onSelect}
        onTouchStart={onSelect}
        onDragStart={() => {
          pushHistory();
        }}
        onDragEnd={(e) => {
          updateNode(node.id, { x: e.target.x(), y: e.target.y() });
        }}
      />
    </>
  );
};
