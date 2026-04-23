import { useEffect, useRef } from "react";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { Vec2 } from "../../PageMoodboard/types";
import {
  rectCorners,
  rectFromPoints,
  rectsIntersect,
} from "../../PageMoodboard/layout/geometry";
import { pointInPolygon } from "../../PageMoodboard/layout/pointInPolygon";
import { polygonIntersectsRect } from "../../PageMoodboard/layout/segmentsIntersect";
import { worldPointFromClient } from "./htmlStagePointer";

const MIN_DRAG = 4;

interface DragState {
  origin: Vec2;
  path: Vec2[];
  active: boolean;
  mode: "rect" | "lasso" | null;
}

// HTML analogue of useSelection.ts. Listens on the stage container for bare
// pointerdowns (nodes stopPropagation before these fire), tracks the drag in
// world coords, and commits the same way the Konva version does — marquee
// uses rectsIntersect, lasso uses pointInPolygon / polygonIntersectsRect.
export const useHtmlSelection = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const drag = useRef<DragState>({
    origin: { x: 0, y: 0 },
    path: [],
    active: false,
    mode: null,
  });
  const tool = useMoodboardStore((s) => s.tool);
  const setMarquee = useMoodboardStore((s) => s.setMarquee);
  const setLassoPath = useMoodboardStore((s) => s.setLassoPath);
  const setSelection = useMoodboardStore((s) => s.setSelection);

  useEffect(() => {
    if (tool !== "select" && tool !== "lasso") return;
    const el = containerRef.current;
    if (!el) return;

    const commit = () => {
      const { nodes, rootOrder, transient } = useMoodboardStore.getState();
      const candidates = rootOrder
        .map((id) => nodes[id])
        .filter((n): n is NonNullable<typeof n> => Boolean(n));
      if (drag.current.mode === "rect") {
        const rect = transient.marquee;
        if (!rect || (rect.width < MIN_DRAG && rect.height < MIN_DRAG)) {
          setSelection([]);
        } else {
          const hit = candidates
            .filter((n) =>
              rectsIntersect(
                { x: n.x, y: n.y, width: n.width, height: n.height },
                rect,
              ),
            )
            .map((n) => n.id);
          setSelection(hit);
        }
        setMarquee(null);
      } else if (drag.current.mode === "lasso") {
        const path = drag.current.path;
        if (path.length < 3) {
          setSelection([]);
        } else {
          const closed = [...path, path[0]];
          const hit = candidates
            .filter((n) => {
              const corners = rectCorners(n);
              if (corners.some((c) => pointInPolygon(c, closed))) return true;
              if (polygonIntersectsRect(closed, n)) return true;
              return false;
            })
            .map((n) => n.id);
          setSelection(hit);
        }
        setLassoPath(null);
      }
      drag.current.active = false;
      drag.current.mode = null;
      drag.current.path = [];
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Nodes stopPropagation in their own pointerdown, so reaching here means
      // the user clicked on bare stage.
      if (e.button !== 0) return;
      if (useMoodboardStore.getState().transient.isPanning) return;
      // Space-held pan is handled before this; if that hook is active and panning,
      // isPanning is true. We also ignore if the target was a node (defensive).
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-moodboard-html-node]")) return;
      if (target && target.closest("[data-moodboard-html-group]")) return;
      // Transformer handles use React stopPropagation which can't stop this
      // native listener, so filter on the data attribute instead — otherwise
      // grabbing a resize/rotate handle also starts a marquee drag.
      if (target && target.closest("[data-moodboard-html-handle]")) return;
      const { viewport } = useMoodboardStore.getState();
      const pos = worldPointFromClient(el, e.clientX, e.clientY, viewport);
      if (!pos) return;
      drag.current = {
        origin: pos,
        path: tool === "lasso" ? [pos] : [],
        active: true,
        mode: tool === "lasso" ? "lasso" : "rect",
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const { viewport } = useMoodboardStore.getState();
      const pos = worldPointFromClient(el, e.clientX, e.clientY, viewport);
      if (!pos) return;
      if (drag.current.mode === "rect") {
        const dx = pos.x - drag.current.origin.x;
        const dy = pos.y - drag.current.origin.y;
        if (Math.abs(dx) < MIN_DRAG && Math.abs(dy) < MIN_DRAG) return;
        setMarquee(rectFromPoints(drag.current.origin, pos));
      } else if (drag.current.mode === "lasso") {
        drag.current.path.push(pos);
        setLassoPath([...drag.current.path]);
      }
    };

    const handlePointerUp = () => {
      if (!drag.current.active) return;
      commit();
    };

    // Bare-stage "click" (zero-area drag) should clear selection — the commit
    // path handles that via the MIN_DRAG branch.
    el.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [containerRef, tool, setMarquee, setLassoPath, setSelection]);
};
