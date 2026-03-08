import { memo } from "react";
import { TRACK_CONFIG } from "../../constants/timeline";
import { TimelineElementComponent } from "./TimelineElement";
import type { TimelineTrack as TTrack } from "../../types";

interface Props {
  track: TTrack;
  zoomLevel: number;
  scrollLeft: number;
  selectedElementIds: Set<string>;
  onElementMouseDown: (
    e: React.MouseEvent,
    elementId: string,
    trackId: string,
    startTime: number,
    containerRect: DOMRect,
  ) => void;
  onResizeStart: (
    e: React.MouseEvent,
    side: "left" | "right",
    elementId: string,
    trackId: string,
    element: { startTime: number; duration: number; trimStart: number; trimEnd: number },
    containerRect: DOMRect,
  ) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const TimelineTrackComponent = memo(function TimelineTrackComponent({
  track,
  zoomLevel,
  scrollLeft,
  selectedElementIds,
  onElementMouseDown,
  onResizeStart,
  containerRef,
}: Props) {
  const config = TRACK_CONFIG[track.type];
  const height = config.height;

  return (
    <div
      className={`relative border-b border-ui-panel-border/50 ${config.color}`}
      style={{ height }}
    >
      {track.elements.map((element) => (
        <TimelineElementComponent
          key={element.id}
          element={element}
          trackId={track.id}
          zoomLevel={zoomLevel}
          scrollLeft={scrollLeft}
          isSelected={selectedElementIds.has(element.id)}
          trackHeight={height}
          onMouseDown={onElementMouseDown}
          onResizeStart={onResizeStart}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
});
