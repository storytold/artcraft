import { Vector2d } from "konva/lib/types";
import { useEffect } from "react";
import { DragState } from "../types";
// This piece of code ensures that when you are selecting or dragging and go off the stage,
// it releases the controls mouse drag.
export const useGlobalMouseUp = (
  setIsDragging: (value: DragState | undefined) => void,
  setIsDrawing: (value: boolean) => void,
  setCurrentLineId: (value: string | null) => void,
  setIsSelecting: (value: boolean) => void,
  isSelectingRef: React.MutableRefObject<boolean>,
  setSelectionRect: (value: any) => void,
  onSelectionChange?: (isSelecting: boolean) => void,
  onBeforeReset?: () => void,
) => {
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      onBeforeReset?.();
      // Always reset all states when mouse is released anywhere
      setIsDragging(undefined);
      setIsDrawing(false);
      setCurrentLineId(null);
      setIsSelecting(false);
      isSelectingRef.current = false;
      onSelectionChange?.(false);
      setSelectionRect(null);
    };

    // Listen to mouseup on the entire window
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [onSelectionChange, onBeforeReset]);
};
