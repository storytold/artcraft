import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMoodboardStore } from "../PageMoodboard/MoodboardStore";
import { MoodboardNode } from "../PageMoodboard/types";
import { MoodboardHtmlBackground } from "./MoodboardHtmlBackground";
import { ImageNodeHtml } from "./nodes/ImageNodeHtml";
import { TextNodeHtml } from "./nodes/TextNodeHtml";
import { GroupNodeHtml } from "./nodes/GroupNodeHtml";
import { VideoNodeHtml } from "./nodes/VideoNodeHtml";
import { useHtmlSelection } from "./interactions/useHtmlSelection";
import { useHtmlViewportControls } from "./interactions/useHtmlViewportControls";
import { worldPointFromClient } from "./interactions/htmlStagePointer";
import { MoodboardHtmlTransformerOverlay } from "./MoodboardHtmlTransformerOverlay";
import { TextEditOverlay } from "../PageMoodboard/TextEditOverlay";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const MoodboardHtmlStage = ({ containerRef }: Props) => {
  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const tool = useMoodboardStore((s) => s.tool);
  const gridSpacing = useMoodboardStore((s) => s.gridSpacing);
  const { marquee, lassoPath } = useMoodboardStore(
    useShallow((s) => ({
      marquee: s.transient.marquee,
      lassoPath: s.transient.lassoPath,
    })),
  );
  const viewport = useMoodboardStore((s) => s.viewport);
  const setLastDropPoint = useMoodboardStore((s) => s.setLastDropPoint);
  const setCanvasSize = useMoodboardStore((s) => s.setCanvasSize);
  const toggleInSelection = useMoodboardStore((s) => s.toggleInSelection);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const addText = useMoodboardStore((s) => s.addText);

  const zoom = viewport.zoom;
  const pan = viewport.pan;

  // ResizeObserver keeps canvasSize in sync with the wrapper (used by the
  // recenter indicator, fit-to-content, and drop-center calculations).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, setCanvasSize]);

  useHtmlSelection(containerRef);
  useHtmlViewportControls(containerRef);

  // Stable onSelect closure for memoized nodes.
  const handleNodeSelect = useCallback(
    (id: string, additive: boolean) => {
      toggleInSelection(id, additive);
    },
    [toggleInSelection],
  );

  // Text tool: bare click on the stage drops a new text node at the pointer.
  // Select/lasso tools: bare click without movement clears the selection —
  // but the MIN_DRAG branch in useHtmlSelection.commit() already handles that,
  // so we only need the text-tool branch here.
  const handleStagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-moodboard-html-node]")) return;
      if (target && target.closest("[data-moodboard-html-group]")) return;
      if (tool === "text") {
        const pos = worldPointFromClient(
          containerRef.current,
          e.clientX,
          e.clientY,
          useMoodboardStore.getState().viewport,
        );
        if (pos) addText(pos);
        return;
      }
      // Any other bare-stage click clears the text-edit state so a second
      // click on empty canvas commits the current edit.
      setEditingText(null);
    },
    [tool, containerRef, addText, setEditingText],
  );

  // Track pointer position (in world coords) to set lastDropPoint, so
  // image paste / file drop can use "near the cursor" when available.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const handle = (e: PointerEvent) => {
      const pos = worldPointFromClient(
        el,
        e.clientX,
        e.clientY,
        useMoodboardStore.getState().viewport,
      );
      if (pos) setLastDropPoint(pos);
    };
    el.addEventListener("pointermove", handle);
    return () => el.removeEventListener("pointermove", handle);
  }, [containerRef, setLastDropPoint]);

  // Shallow-subscribed slice for selection outlines. Memoized so transient
  // (marquee/lasso) updates don't re-render this block.
  const selectionOutlines = useMemo(() => {
    const arr: {
      id: string;
      kind: MoodboardNode["kind"];
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }[] = [];
    selectedIds.forEach((id) => {
      const n = nodes[id];
      if (!n || n.parentId !== null) return;
      if (n.kind === "group") {
        // Union AABB of group's direct children in group-local coords.
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
        if (!Number.isFinite(minX)) return;
        // Place the outline at group's x,y + localMin and size it to the
        // union bbox. Then rotate around the group's origin to match the
        // group's rotation (same pattern as Konva MoodboardStage.tsx).
        arr.push({
          id,
          kind: n.kind,
          x: n.x + minX * Math.cos((n.rotation * Math.PI) / 180) -
            minY * Math.sin((n.rotation * Math.PI) / 180),
          y: n.y + minX * Math.sin((n.rotation * Math.PI) / 180) +
            minY * Math.cos((n.rotation * Math.PI) / 180),
          width: maxX - minX,
          height: maxY - minY,
          rotation: n.rotation,
        });
      } else {
        arr.push({
          id,
          kind: n.kind,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          rotation: n.rotation,
        });
      }
    });
    return arr;
  }, [selectedIds, nodes]);

  return (
    <div
      ref={containerRef}
      data-moodboard-html-stage
      onPointerDown={handleStagePointerDown}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        cursor: tool === "text" ? "text" : "default",
      }}
    >
      {/* Background grid (pans/zooms with viewport via CSS bg-position/size). */}
      <MoodboardHtmlBackground
        pan={pan}
        zoom={zoom}
        gridSpacing={gridSpacing}
      />

      {/* World-space layer: all nodes are positioned in world coords and the
          whole subtree is translated+scaled by the viewport transform. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {rootOrder.map((id) => {
          const n = nodes[id];
          if (!n) return null;
          const draggable = tool === "select";
          if (n.kind === "image") {
            return (
              <ImageNodeHtml
                key={id}
                node={n}
                draggable={draggable}
                selected={selectedIds.has(id)}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "video") {
            return (
              <VideoNodeHtml
                key={id}
                node={n}
                draggable={draggable}
                selected={selectedIds.has(id)}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "text") {
            return (
              <TextNodeHtml
                key={id}
                node={n}
                draggable={draggable}
                onSelect={handleNodeSelect}
              />
            );
          }
          if (n.kind === "group") {
            return (
              <GroupNodeHtml
                key={id}
                node={n}
                onSelect={handleNodeSelect}
              />
            );
          }
          return null;
        })}

        {/* Selection outlines render inside the world transform so their 1/zoom
            border stays crisp at all zooms. */}
        {selectionOutlines.map((o) => (
          <div
            key={`outline-${o.id}`}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.width,
              height: o.height,
              transform: `rotate(${o.rotation}deg)`,
              transformOrigin: "0 0",
              border: `${1 / zoom}px dashed #3b82f6`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Marquee rect (axis-aligned, in world coords). */}
        {marquee && (
          <div
            style={{
              position: "absolute",
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
              border: `${1 / zoom}px dashed #3b82f6`,
              background: "rgba(59,130,246,0.08)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Lasso polyline as an SVG in world coords. Sizing: compute a bbox
            so the SVG only takes the polyline's extent; the <svg> itself
            positions at its min corner. */}
        {lassoPath && lassoPath.length >= 2 && (
          <LassoPolyline path={lassoPath} zoom={zoom} />
        )}

        {/* Text-edit overlay lives inside the world div so its absolute
            (node.x, node.y) positioning lands on the node at any pan/zoom. */}
        <TextEditOverlay containerRef={containerRef} />
      </div>

      {/* Screen-space overlay for the transformer handles (resize + rotate). */}
      {selectedIds.size > 0 && (
        <>
          <span style={{ display: "none" }} />
          <MoodboardHtmlTransformerOverlay containerRef={containerRef} />
        </>
      )}
    </div>
  );
};

interface LassoPolylineProps {
  path: { x: number; y: number }[];
  zoom: number;
}

// Small helper to render the lasso polyline as an SVG polyline. SVG lives in
// world coords so its stroke widths can scale to 1/zoom px.
const LassoPolyline = ({ path, zoom }: LassoPolylineProps) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of path) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = 4 / zoom;
  const x0 = minX - pad;
  const y0 = minY - pad;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const points = path.map((p) => `${p.x - x0},${p.y - y0}`).join(" ");
  return (
    <svg
      style={{
        position: "absolute",
        left: x0,
        top: y0,
        width: w,
        height: h,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1 / zoom}
        strokeDasharray={`${4 / zoom},${4 / zoom}`}
      />
    </svg>
  );
};
