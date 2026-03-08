import { useCallback, useRef } from "react";
import { DRAG_THRESHOLD_PX } from "../../../constants/timeline";
import { pixelsToTime, timeToPixels } from "../../../lib/timeline/pixel-utils";
import { findSnapPoints, snapToNearestPoint } from "../../../lib/timeline/snap-utils";
import type { VideoEditorCore } from "../../../core/EditorCore";

interface DragState {
  elementId: string;
  trackId: string;
  startMouseX: number;
  startElementTime: number;
  clickOffsetTime: number;
  isDragging: boolean;
}

export function useElementInteraction(
  editor: VideoEditorCore,
  zoomLevel: number,
  scrollLeft: number,
  snappingEnabled: boolean,
) {
  const dragState = useRef<DragState | null>(null);
  const snapLineRef = useRef<number | null>(null);

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      elementId: string,
      trackId: string,
      elementStartTime: number,
      containerRect: DOMRect,
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const mouseX = e.clientX - containerRect.left + scrollLeft;
      const clickTime = pixelsToTime(mouseX, zoomLevel);
      const offsetTime = clickTime - elementStartTime;

      dragState.current = {
        elementId,
        trackId,
        startMouseX: e.clientX,
        startElementTime: elementStartTime,
        clickOffsetTime: offsetTime,
        isDragging: false,
      };

      // Select the element
      editor.selection.setSelectedElements({
        elements: [{ trackId, elementId }],
      });

      const handleMove = (moveEvent: MouseEvent) => {
        if (!dragState.current) return;
        const dx = Math.abs(moveEvent.clientX - dragState.current.startMouseX);
        if (!dragState.current.isDragging && dx < DRAG_THRESHOLD_PX) return;
        dragState.current.isDragging = true;

        const currentMouseX =
          moveEvent.clientX - containerRect.left + scrollLeft;
        let newStartTime = Math.max(
          0,
          pixelsToTime(currentMouseX, zoomLevel) -
            dragState.current.clickOffsetTime,
        );

        if (snappingEnabled) {
          const tracks = editor.timeline.getTracks();
          const playheadTime = editor.playback.getCurrentTime();
          const snapPoints = findSnapPoints(tracks, playheadTime, elementId);
          const { snappedTime, snapPoint } = snapToNearestPoint(
            newStartTime,
            snapPoints,
            zoomLevel,
          );
          newStartTime = snappedTime;
          snapLineRef.current = snapPoint
            ? timeToPixels(snapPoint.time, zoomLevel)
            : null;
        }

        editor.timeline.updateElement({
          trackId: dragState.current.trackId,
          elementId: dragState.current.elementId,
          updates: { startTime: newStartTime },
        });
      };

      const handleUp = () => {
        snapLineRef.current = null;
        dragState.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [editor, zoomLevel, scrollLeft, snappingEnabled],
  );

  return { handleMouseDown, snapLineX: snapLineRef };
}
