import { useEffect, useRef } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import { Vec2 } from "../types";

const ZOOM_STEP = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

interface ViewportSetters {
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<Vec2>;
  setZoom: (z: number) => void;
  setPan: (p: Vec2) => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (/input|textarea/i.test(el.tagName)) return true;
  if (el.isContentEditable) return true;
  return false;
};

// Centralizes wheel-zoom and three pan gestures (drag-empty, spacebar+drag,
// middle-click drag) for the moodboard canvas. Owns no state of its own —
// reads zoom/pan from refs (live values) and writes through the provided
// setters so React state stays in sync.
export const useViewportControls = (
  stageRef: React.RefObject<Konva.Stage | null>,
  setters: ViewportSetters,
) => {
  const { zoomRef, panRef, setZoom, setPan } = setters;
  const setIsPanning = useMoodboardStore((s) => s.setIsPanning);

  // Track spacebar so any subsequent mousedown becomes a pan, not a select.
  const spaceHeld = useRef(false);
  // Whether a pan drag is currently in flight, plus its origin in screen px
  // and the pan offset captured at drag start.
  const panState = useRef<{
    active: boolean;
    startScreen: Vec2;
    startPan: Vec2;
  }>({
    active: false,
    startScreen: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
  });

  // Wheel: zoom around cursor.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const container = stage.container();

    const handleWheel = (e: WheelEvent) => {
      // Ignore zoom if the user is typing in the text-edit overlay or an input.
      if (isEditableTarget(document.activeElement)) return;
      e.preventDefault();
      const oldScale = zoomRef.current;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const stagePos = panRef.current;
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = clamp(
        direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      const newPan = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setZoom(newScale);
      setPan(newPan);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [stageRef, zoomRef, panRef, setZoom, setPan]);

  // Pan gestures: middle-mouse drag, or spacebar+left-drag. Plain left
  // click is reserved for selection (clicking nodes, lasso, future marquee)
  // so it never triggers pan, even on empty canvas.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const container = stage.container();

    const beginPan = (clientX: number, clientY: number) => {
      panState.current = {
        active: true,
        startScreen: { x: clientX, y: clientY },
        startPan: { ...panRef.current },
      };
      setIsPanning(true);
      container.style.cursor = "grabbing";
    };

    const endPan = () => {
      if (!panState.current.active) return;
      panState.current.active = false;
      setIsPanning(false);
      container.style.cursor = spaceHeld.current ? "grab" : "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Middle-mouse always pans. stopPropagation so Konva's internal
      // mousedown dispatcher never runs — otherwise `useSelection` would
      // start a marquee underneath the pan.
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        beginPan(e.clientX, e.clientY);
        return;
      }
      // Spacebar + left-click pans (Figma convention).
      if (e.button === 0 && spaceHeld.current) {
        e.preventDefault();
        e.stopPropagation();
        beginPan(e.clientX, e.clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!panState.current.active) return;
      const dx = e.clientX - panState.current.startScreen.x;
      const dy = e.clientY - panState.current.startScreen.y;
      setPan({
        x: panState.current.startPan.x + dx,
        y: panState.current.startPan.y + dy,
      });
    };

    const handleMouseUp = () => endPan();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.code === "Space" && !spaceHeld.current) {
        spaceHeld.current = true;
        if (!panState.current.active) container.style.cursor = "grab";
        // Prevent page from scrolling on spacebar.
        e.preventDefault();
      }
      // Cmd/Ctrl+0 → reset zoom + pan.
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "0") {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
        if (!panState.current.active) container.style.cursor = "";
      }
    };

    // Capture-phase so we run BEFORE Konva's internal mousedown dispatch.
    // stopPropagation inside pan-claim branches then prevents Konva from
    // forwarding the event to node/stage handlers.
    container.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      container.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      container.style.cursor = "";
    };
  }, [stageRef, panRef, setPan, setZoom, setIsPanning]);
};
