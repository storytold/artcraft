import { useCallback, useEffect, useMemo } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Line, Group, Transformer } from "react-konva";
import { useThemeFgRgb } from "./useThemeFgRgb";
import { useShallow } from "zustand/react/shallow";
import { useMoodboardStore } from "./MoodboardStore";
import { MoodboardBackground } from "./MoodboardBackground";
import { ImageNode } from "./nodes/ImageNode";
import { VideoNode } from "./nodes/VideoNode";
import { TextNode } from "./nodes/TextNode";
import { GroupNode } from "./nodes/GroupNode";
import { useSelection } from "./interactions/useSelection";
import { useTransformer } from "./interactions/useTransformer";
import { useViewportControls } from "./interactions/useViewportControls";
import { stagePointerPos } from "./interactions/useStagePointer";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

export const MoodboardStage = ({ containerRef, stageRef }: Props) => {
  const transformerRef = useTransformer(stageRef);

  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const tool = useMoodboardStore((s) => s.tool);
  const gridSpacing = useMoodboardStore((s) => s.gridSpacing);
  // Only subscribe to the transient fields this component actually renders
  // (marquee + lasso). Skips re-renders on `editingTextId` and `isPanning`
  // toggles, which don't affect Stage JSX.
  const { marquee, lassoPath, guides } = useMoodboardStore(
    useShallow((s) => ({
      marquee: s.transient.marquee,
      lassoPath: s.transient.lassoPath,
      guides: s.transient.guides,
    })),
  );
  const viewport = useMoodboardStore((s) => s.viewport);
  const canvasSize = useMoodboardStore((s) => s.canvasSize);
  const setLastDropPoint = useMoodboardStore((s) => s.setLastDropPoint);
  const setCanvasSize = useMoodboardStore((s) => s.setCanvasSize);
  const toggleInSelection = useMoodboardStore((s) => s.toggleInSelection);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const addText = useMoodboardStore((s) => s.addText);

  const zoom = viewport.zoom;
  const pan = viewport.pan;
  const fgRgb = useThemeFgRgb();

  // Track wrapper size with ResizeObserver so the Stage fills its container.
  // The size lives in the store so overlays (recenter indicator, future
  // minimap) can read it without drilling refs through the tree.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const updateSize = () => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, setCanvasSize]);

  useSelection(stageRef);
  useViewportControls(stageRef);

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

  // Stable across renders so memoized node children see an unchanged
  // onSelect prop and skip re-render when only camera/selection state
  // changes. Depends only on a Zustand action, which itself is stable.
  const handleNodeSelect = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const evt = e.evt as MouseEvent | TouchEvent;
      const additive = "shiftKey" in evt && evt.shiftKey;
      toggleInSelection(id, additive);
    },
    [toggleInSelection],
  );

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
  // Memoized so transient store updates (marquee, lasso, isPanning) don't
  // churn its identity and force `MoodboardBackground` to re-run sceneFunc
  // every frame of a marquee drag.
  const visibleViewport = useMemo(
    () => ({
      x: -pan.x / zoom,
      y: -pan.y / zoom,
      width: canvasSize.width / zoom,
      height: canvasSize.height / zoom,
    }),
    [pan.x, pan.y, zoom, canvasSize.width, canvasSize.height],
  );

  return (
    <Stage
      ref={(s) => {
        stageRef.current = s;
      }}
      width={canvasSize.width}
      height={canvasSize.height}
      x={pan.x}
      y={pan.y}
      scaleX={zoom}
      scaleY={zoom}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ cursor: tool === "text" ? "text" : "default" }}
    >
      <Layer listening={false}>
        <MoodboardBackground
          viewport={visibleViewport}
          spacing={gridSpacing}
          zoom={zoom}
          dotColor={`rgb(${fgRgb} / 0.10)`}
        />
      </Layer>
      <Layer>
        {rootOrder.map((id) => {
          const n = nodes[id];
          if (!n) return null;
          const selected = selectedIds.has(id);
          const draggable = tool === "select";
          if (n.kind === "image") {
            return (
              <ImageNode
                key={id}
                node={n}
                draggable={draggable}
                selected={selected}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "video") {
            return (
              <VideoNode
                key={id}
                node={n}
                draggable={draggable}
                selected={selected}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "text") {
            return (
              <TextNode
                key={id}
                node={n}
                draggable={draggable}
                selected={selected}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "group") {
            return (
              <GroupNode
                key={id}
                node={n}
                selected={selected}
                onSelect={handleNodeSelect}
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
        {marquee && (
          <Rect
            x={marquee.x}
            y={marquee.y}
            width={marquee.width}
            height={marquee.height}
            stroke="#3b82f6"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            fill="rgba(59,130,246,0.08)"
          />
        )}
        {lassoPath && lassoPath.length >= 2 && (
          <Line
            points={lassoPath.flatMap((p) => [p.x, p.y])}
            stroke="#3b82f6"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            closed={false}
          />
        )}
        {guides.map((g, i) => (
          <Line
            key={`guide-${i}`}
            points={
              g.axis === "x"
                ? [g.pos, g.from, g.pos, g.to]
                : [g.from, g.pos, g.to, g.pos]
            }
            stroke="#f43f5e"
            strokeWidth={1 / zoom}
            listening={false}
          />
        ))}
      </Layer>
    </Stage>
  );
};
