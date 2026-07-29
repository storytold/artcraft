import { memo, useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image as KonvaImage, Rect } from "react-konva";
import { VideoNode as VideoNodeData } from "../types";
import { useNodeDrag } from "../interactions/useNodeDrag";

interface Props {
  node: VideoNodeData;
  draggable: boolean;
  selected: boolean;
  // Receives the node id so parents can pass one stable callback to every
  // sibling rather than allocating a per-item closure on each render.
  onSelect: (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => void;
}

// Konva can't render a <video> directly — it paints whatever HTMLImageElement
// or HTMLVideoElement you hand its Image node, but only on draw. So we own the
// element imperatively and run a Konva.Animation tied to the node's layer to
// repaint each frame while the video plays. This mirrors ImageNode otherwise.
const VideoNodeInner = ({ node, draggable, selected, onSelect }: Props) => {
  const drag = useNodeDrag(node.id);
  const ref = useRef<Konva.Image | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  // Build the element once per src; autoplay only succeeds while muted, which
  // is why addVideo() forces muted+loop+autoplay to travel together.
  useEffect(() => {
    const el = document.createElement("video");
    el.crossOrigin = "anonymous";
    el.src = node.src;
    el.muted = node.muted;
    el.loop = node.loop;
    el.autoplay = node.autoplay;
    el.playsInline = true;
    el.preload = "metadata";
    const onLoaded = () => setVideo(el);
    el.addEventListener("loadedmetadata", onLoaded);
    if (node.autoplay) void el.play().catch(() => undefined);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.pause();
      el.removeAttribute("src");
      el.load();
      setVideo(null);
    };
  }, [node.src, node.muted, node.loop, node.autoplay]);

  // Drive repaints off the layer the image node lives on, for as long as the
  // element is actually playing. The animation auto-stops on unmount/cleanup.
  useEffect(() => {
    const imageNode = ref.current;
    if (!video || !imageNode) return undefined;
    const layer = imageNode.getLayer();
    if (!layer) return undefined;
    const anim = new Konva.Animation(() => undefined, layer);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [video]);

  const handleSelect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => onSelect(node.id, e);

  return (
    <>
      {!video && (
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
        image={video ?? undefined}
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

export const VideoNode = memo(VideoNodeInner);
