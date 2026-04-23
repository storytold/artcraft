import { useEffect, useRef } from "react";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";
import { Vec2 } from "../../PageMoodboard/types";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  clamp,
} from "../../PageMoodboard/layout/geometry";

const ZOOM_STEP = 1.1;

const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (/input|textarea/i.test(el.tagName)) return true;
  if (el.isContentEditable) return true;
  return false;
};

// HTML analogue of useViewportControls.ts. Wheel zooms around the cursor;
// middle-mouse and space+left drag pan; Cmd/Ctrl+0 resets. Everything is
// derived from the container's bounding rect — no Konva stage required.
export const useHtmlViewportControls = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const setZoom = useMoodboardStore((s) => s.setZoom);
  const setPan = useMoodboardStore((s) => s.setPan);
  const resetViewport = useMoodboardStore((s) => s.resetViewport);
  const setIsPanning = useMoodboardStore((s) => s.setIsPanning);
  const spaceHeld = useRef(false);
  const panState = useRef<{
    active: boolean;
    startScreen: Vec2;
    startPan: Vec2;
  }>({
    active: false,
    startScreen: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (isEditableTarget(document.activeElement)) return;
      e.preventDefault();
      const { viewport } = useMoodboardStore.getState();
      const rect = el.getBoundingClientRect();
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const oldScale = viewport.zoom;
      const mousePointTo = {
        x: (pointer.x - viewport.pan.x) / oldScale,
        y: (pointer.y - viewport.pan.y) / oldScale,
      };
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = clamp(
        direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP,
        ZOOM_MIN,
        ZOOM_MAX,
      );
      const newPan = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setZoom(newScale);
      setPan(newPan);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, setZoom, setPan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const beginPan = (clientX: number, clientY: number) => {
      panState.current = {
        active: true,
        startScreen: { x: clientX, y: clientY },
        startPan: { ...useMoodboardStore.getState().viewport.pan },
      };
      setIsPanning(true);
      el.style.cursor = "grabbing";
    };

    const endPan = () => {
      if (!panState.current.active) return;
      panState.current.active = false;
      setIsPanning(false);
      el.style.cursor = spaceHeld.current ? "grab" : "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        beginPan(e.clientX, e.clientY);
        return;
      }
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
        if (!panState.current.active) el.style.cursor = "grab";
        e.preventDefault();
      }
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "0") {
        e.preventDefault();
        resetViewport();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
        if (!panState.current.active) el.style.cursor = "";
      }
    };

    el.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      el.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      el.style.cursor = "";
    };
  }, [containerRef, setPan, resetViewport, setIsPanning]);
};
