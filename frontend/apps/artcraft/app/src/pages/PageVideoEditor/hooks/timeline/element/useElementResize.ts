import { useCallback, useRef } from "react";
import { pixelsToTime } from "../../../lib/timeline/pixel-utils";
import type { VideoEditorCore } from "../../../core/EditorCore";

export function useElementResize(
  editor: VideoEditorCore,
  zoomLevel: number,
  scrollLeft: number,
) {
  const isResizing = useRef(false);

  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      side: "left" | "right",
      elementId: string,
      trackId: string,
      element: { startTime: number; duration: number; trimStart: number; trimEnd: number },
      containerRect: DOMRect,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;

      const startX = e.clientX;
      const origStart = element.startTime;
      const origDuration = element.duration;
      const origTrimStart = element.trimStart;
      const origTrimEnd = element.trimEnd;

      const handleMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const dx = moveEvent.clientX - startX;
        const dt = pixelsToTime(dx, zoomLevel);

        if (side === "left") {
          const newTrimStart = Math.max(0, origTrimStart + dt);
          const trimDelta = newTrimStart - origTrimStart;
          const newStart = origStart + trimDelta;
          const newDuration = origDuration - trimDelta;
          if (newDuration > 0.1) {
            editor.timeline.updateElement({
              trackId,
              elementId,
              updates: {
                startTime: newStart,
                duration: newDuration,
                trimStart: newTrimStart,
              },
            });
          }
        } else {
          const newTrimEnd = Math.max(0, origTrimEnd - dt);
          const newDuration = Math.max(0.1, origDuration + dt);
          editor.timeline.updateElement({
            trackId,
            elementId,
            updates: { duration: newDuration, trimEnd: newTrimEnd },
          });
        }
      };

      const handleUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [editor, zoomLevel, scrollLeft],
  );

  return { handleResizeStart, isResizing };
}
