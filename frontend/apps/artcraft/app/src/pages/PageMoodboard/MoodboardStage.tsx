import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Line, Group, Transformer } from "react-konva";
import { useMoodboardStore } from "./MoodboardStore";
import { MoodboardBackground } from "./MoodboardBackground";
import { ImageNode } from "./nodes/ImageNode";
import { TextNode } from "./nodes/TextNode";
import { GroupNode } from "./nodes/GroupNode";
import { useSelection } from "./interactions/useSelection";
import { useTransformer } from "./interactions/useTransformer";
import { useViewportControls } from "./interactions/useViewportControls";
import { stagePointerPos } from "./interactions/useStagePointer";
import { Vec2 } from "./types";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

export const MoodboardStage = ({ containerRef, stageRef }: Props) => {
  const transformerRef = useTransformer(stageRef);

  const [size, setSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vec2>({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const tool = useMoodboardStore((s) => s.tool);
  const gridSpacing = useMoodboardStore((s) => s.gridSpacing);
  const transient = useMoodboardStore((s) => s.transient);
  const setLastDropPoint = useMoodboardStore((s) => s.setLastDropPoint);
  const toggleInSelection = useMoodboardStore((s) => s.toggleInSelection);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const addText = useMoodboardStore((s) => s.addText);

  // Track wrapper size with ResizeObserver so the Stage fills its container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const updateSize = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useSelection(stageRef);
  useViewportControls(stageRef, { zoomRef, panRef, setZoom, setPan });

  // Update lastDropPoint as the cursor moves across the stage so external
  // drops (uploads, paste fallbacks) land near the cursor.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const handle = () => {
      const pos = stagePointerPos(stage);
      if (pos) setLastDropPoint(pos);
    };
    stage.on("mousemove.moodboardCursor", handle);
    return () => {
      stage.off("mousemove.moodboardCursor");
    };
  }, [setLastDropPoint, stageRef]);

  const handleNodeSelect = (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const evt = e.evt as MouseEvent | TouchEvent;
    const additive = "shiftKey" in evt && evt.shiftKey;
    toggleInSelection(id, additive);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== stageRef.current) return;
    if (tool === "text") {
      const pos = stagePointerPos(stageRef.current);
      if (pos) addText(pos);
      return;
    }
    // Don't setSelection([]) here: Konva fires `click` after any marquee
    // drag that ends on bare canvas, which would stomp on the selection
    // `useSelection` just committed. The zero-area branch in `useSelection`
    // handles the "bare click with no drag" case.
    setEditingText(null);
  };

  // Visible region in stage coords; drives the dotted background grid so
  // it follows pan/zoom rather than rendering a fixed (0,0,w,h) block.
  const visibleViewport = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width: size.width / zoom,
    height: size.height / zoom,
  };

  return (
    <Stage
      ref={(s) => {
        stageRef.current = s;
      }}
      width={size.width}
      height={size.height}
      x={pan.x}
      y={pan.y}
      scaleX={zoom}
      scaleY={zoom}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ cursor: tool === "text" ? "text" : "default" }}
    >
      <Layer listening={false}>
        <Rect
          x={visibleViewport.x}
          y={visibleViewport.y}
          width={visibleViewport.width}
          height={visibleViewport.height}
          fill="#0f0f12"
        />
        <MoodboardBackground viewport={visibleViewport} spacing={gridSpacing} />
      </Layer>
      <Layer>
        {rootOrder.map((id) => {
          const n = nodes[id];
          if (!n) return null;
          const selected = selectedIds.has(id);
          const onSelect = (
            e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
          ) => handleNodeSelect(id, e);
          if (n.kind === "image") {
            return (
              <ImageNode
                key={id}
                node={n}
                draggable={tool === "select"}
                selected={selected}
                onSelect={onSelect}
              />
            );
          }
          if (n.kind === "text") {
            return (
              <TextNode
                key={id}
                node={n}
                draggable={tool === "select"}
                selected={selected}
                onSelect={onSelect}
              />
            );
          }
          if (n.kind === "group") {
            return (
              <GroupNode
                key={id}
                node={n}
                selected={selected}
                onSelect={onSelect}
              />
            );
          }
          return null;
        })}
        <Transformer
          ref={(t) => {
            transformerRef.current = t;
          }}
          rotateEnabled
          keepRatio={false}
        />
      </Layer>
      <Layer listening={false}>
        {Array.from(selectedIds).map((id) => {
          const n = nodes[id];
          if (!n || n.parentId !== null) return null;
          if (n.kind === "group") {
            // Union AABB of children in group-local coords, wrapped in a
            // Konva Group so the outline rotates around the group's origin.
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (const cid of n.childIds) {
              const c = nodes[cid];
              if (!c) continue;
              minX = Math.min(minX, c.x);
              minY = Math.min(minY, c.y);
              maxX = Math.max(maxX, c.x + c.width);
              maxY = Math.max(maxY, c.y + c.height);
            }
            if (!Number.isFinite(minX)) return null;
            return (
              <Group
                key={`outline-${id}`}
                x={n.x}
                y={n.y}
                rotation={n.rotation}
                listening={false}
              >
                <Rect
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  stroke="#3b82f6"
                  strokeWidth={1 / zoom}
                  dash={[4 / zoom, 4 / zoom]}
                  listening={false}
                />
              </Group>
            );
          }
          return (
            <Rect
              key={`outline-${id}`}
              x={n.x}
              y={n.y}
              width={n.width}
              height={n.height}
              rotation={n.rotation}
              stroke="#3b82f6"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 4 / zoom]}
              listening={false}
            />
          );
        })}
        {transient.marquee && (
          <Rect
            x={transient.marquee.x}
            y={transient.marquee.y}
            width={transient.marquee.width}
            height={transient.marquee.height}
            stroke="#3b82f6"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            fill="rgba(59,130,246,0.08)"
          />
        )}
        {transient.lassoPath && transient.lassoPath.length >= 2 && (
          <Line
            points={transient.lassoPath.flatMap((p) => [p.x, p.y])}
            stroke="#3b82f6"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            closed={false}
          />
        )}
      </Layer>
    </Stage>
  );
};
