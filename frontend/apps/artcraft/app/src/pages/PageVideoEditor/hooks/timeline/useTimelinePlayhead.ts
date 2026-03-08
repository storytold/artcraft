import { useCallback, useRef } from "react";
import { pixelsToTime } from "../../lib/timeline/pixel-utils";
import type { VideoEditorCore } from "../../core/EditorCore";

export function useTimelinePlayhead(
  editor: VideoEditorCore,
  zoomLevel: number,
  scrollLeft: number,
) {
  const isDragging = useRef(false);

  const getTimeFromX = useCallback(
    (clientX: number, rulerRect: DOMRect) => {
      const x = clientX - rulerRect.left + scrollLeft;
      return Math.max(0, pixelsToTime(x, zoomLevel));
    },
    [zoomLevel, scrollLeft],
  );

  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent, rulerRect: DOMRect) => {
      isDragging.current = true;
      editor.playback.setScrubbing({ isScrubbing: true });
      const time = getTimeFromX(e.clientX, rulerRect);
      editor.playback.seek({ time });

      const handleMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const t = getTimeFromX(moveEvent.clientX, rulerRect);
        editor.playback.seek({ time: t });
      };

      const handleUp = () => {
        isDragging.current = false;
        editor.playback.setScrubbing({ isScrubbing: false });
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [editor, getTimeFromX],
  );

  return { handleRulerMouseDown };
}
