import { useRef, useMemo, useCallback } from "react";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import { useTimelinePlayhead } from "../../hooks/timeline/useTimelinePlayhead";
import { generateRulerTicks } from "../../lib/timeline/ruler-utils";
import { pixelsToTime } from "../../lib/timeline/pixel-utils";

interface Props {
  zoomLevel: number;
  scrollLeft: number;
}

export function TimelineRuler({ zoomLevel, scrollLeft }: Props) {
  const editor = useVideoEditor();
  const rulerRef = useRef<HTMLDivElement>(null);
  const { handleRulerMouseDown } = useTimelinePlayhead(
    editor,
    zoomLevel,
    scrollLeft,
  );

  const visibleWidth = 2000; // approximate, updated on resize
  const startTime = pixelsToTime(scrollLeft, zoomLevel);
  const endTime = pixelsToTime(scrollLeft + visibleWidth, zoomLevel);

  const ticks = useMemo(
    () => generateRulerTicks(startTime, endTime, zoomLevel),
    [startTime, endTime, zoomLevel],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!rulerRef.current) return;
      handleRulerMouseDown(e, rulerRef.current.getBoundingClientRect());
    },
    [handleRulerMouseDown],
  );

  return (
    <div
      ref={rulerRef}
      className="relative h-6 cursor-pointer select-none border-b border-ui-panel-border bg-ui-panel/50"
      onMouseDown={onMouseDown}
    >
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{ left: tick.x - scrollLeft }}
        >
          <div
            className={`${tick.isMajor ? "h-6 bg-base-fg/30" : "h-3 bg-base-fg/15"}`}
            style={{ width: 1 }}
          />
          {tick.label && (
            <span className="absolute left-1 top-0 text-[10px] text-base-fg/50">
              {tick.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
