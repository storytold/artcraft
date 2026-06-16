import { useEffect, useRef } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import { Vec2 } from "../types";
import { stagePointerPos } from "./useStagePointer";
import { pointInPolygon } from "../layout/pointInPolygon";
import { polygonIntersectsRect } from "../layout/segmentsIntersect";
import { rectCorners, rectFromPoints, rectsIntersect } from "../layout/geometry";

const MIN_DRAG = 4; // screen px before a press becomes a drag

interface DragState {
  origin: Vec2;
  path: Vec2[];
  active: boolean;
  mode: "rect" | "lasso" | null;
}

// Selection state machine for rectangle marquee (Select tool) and free-form
// lasso (Lasso tool). Pan gestures (middle-mouse, spacebar+left) are owned
// by `useViewportControls` and stop the event at the capture phase, so
// they never reach Konva's mousedown and therefore never reach this hook.
export const useSelection = (
  stageRef: React.RefObject<Konva.Stage | null>,
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
    const stage = stageRef.current;
    if (!stage) return;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only on bare canvas — clicks on nodes are handled by the node's
      // own onMouseDown for single-select.
      if (e.target !== stage) return;
      // Primary button only; middle-mouse is the pan hook's domain.
      if (e.evt.button !== 0) return;
      const pos = stagePointerPos(stage);
      if (!pos) return;
      drag.current = {
        origin: pos,
        path: tool === "lasso" ? [pos] : [],
        active: true,
        mode: tool === "lasso" ? "lasso" : "rect",
      };
    };

    const handleMouseMove = () => {
      if (!drag.current.active) return;
      const pos = stagePointerPos(stage);
      if (!pos) return;
      if (drag.current.mode === "rect") {
        // Suppress marquee until the drag exceeds a threshold so bare clicks
        // don't leave a zero-area rect behind.
        const dx = pos.x - drag.current.origin.x;
        const dy = pos.y - drag.current.origin.y;
        if (Math.abs(dx) < MIN_DRAG && Math.abs(dy) < MIN_DRAG) return;
        setMarquee(rectFromPoints(drag.current.origin, pos));
      } else if (drag.current.mode === "lasso") {
        drag.current.path.push(pos);
        // Slice copy so subscribers see a new identity.
        setLassoPath([...drag.current.path]);
      }
    };

    const commitSelection = () => {
      const { nodes, rootOrder } = useMoodboardStore.getState();
      const candidates = rootOrder
        .map((id) => nodes[id])
        .filter((n): n is NonNullable<typeof n> => Boolean(n));

      if (drag.current.mode === "rect") {
        const rect = useMoodboardStore.getState().transient.marquee;
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

    const handleMouseUp = () => {
      if (!drag.current.active) return;
      commitSelection();
    };

    stage.on("mousedown.moodboardSelection", handleMouseDown);
    stage.on("mousemove.moodboardSelection", handleMouseMove);
    stage.on("mouseup.moodboardSelection", handleMouseUp);
    const onWindowUp = () => {
      if (drag.current.active) commitSelection();
    };
    window.addEventListener("mouseup", onWindowUp);
    return () => {
      stage.off("mousedown.moodboardSelection");
      stage.off("mousemove.moodboardSelection");
      stage.off("mouseup.moodboardSelection");
      window.removeEventListener("mouseup", onWindowUp);
    };
  }, [stageRef, tool, setMarquee, setLassoPath, setSelection]);
};
