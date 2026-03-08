import { useRef, useMemo, useCallback } from "react";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import { useTimelineZoom } from "../../hooks/timeline/useTimelineZoom";
import { useElementInteraction } from "../../hooks/timeline/element/useElementInteraction";
import { useElementResize } from "../../hooks/timeline/element/useElementResize";
import { useTimelineUIStore } from "../../stores/timeline-store";
import { getTotalTracksHeight } from "../../lib/timeline/track-utils";

import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineRuler } from "./TimelineRuler";
import { TimelinePlayhead } from "./TimelinePlayhead";
import { TimelineTrackComponent } from "./TimelineTrack";
import { TrackLabels } from "./TrackLabels";
import { SnapIndicator } from "./SnapIndicator";

export function TimelinePanel() {
  const editor = useVideoEditor();
  const tracks = editor.timeline.getTracks();
  const containerRef = useRef<HTMLDivElement>(null);
  const { snappingEnabled } = useTimelineUIStore();

  const {
    zoomLevel,
    scrollLeft,
    setScrollLeft,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
  } = useTimelineZoom();

  const { handleMouseDown: handleElementDrag, snapLineX } =
    useElementInteraction(editor, zoomLevel, scrollLeft, snappingEnabled);

  const { handleResizeStart } = useElementResize(editor, zoomLevel, scrollLeft);

  const selectedElementIds = useMemo(() => {
    const selected = editor.selection.getSelectedElements();
    return new Set(selected.map((s) => s.elementId));
  }, [editor.selection.getSelectedElements()]);

  const totalHeight = getTotalTracksHeight(tracks);
  const trackAreaHeight = Math.max(totalHeight, 120);

  const handleTrackAreaClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect if clicking on empty track area
      if (e.target === e.currentTarget) {
        editor.selection.clearSelection();
      }
    },
    [editor],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollLeft((e.target as HTMLDivElement).scrollLeft);
    },
    [setScrollLeft],
  );

  return (
    <div className="flex h-full flex-col">
      <TimelineToolbar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      <div className="flex flex-1 overflow-hidden">
        {/* Track labels */}
        <TrackLabels tracks={tracks} />

        {/* Timeline content area */}
        <div
          className="relative flex-1 overflow-x-auto overflow-y-auto"
          onWheel={handleWheel}
          onScroll={handleScroll}
        >
          <div ref={containerRef} className="relative min-w-[2000px]">
            {/* Ruler */}
            <TimelineRuler zoomLevel={zoomLevel} scrollLeft={scrollLeft} />

            {/* Tracks */}
            <div
              className="relative"
              style={{ minHeight: trackAreaHeight }}
              onClick={handleTrackAreaClick}
            >
              {tracks.map((track) => (
                <TimelineTrackComponent
                  key={track.id}
                  track={track}
                  zoomLevel={zoomLevel}
                  scrollLeft={scrollLeft}
                  selectedElementIds={selectedElementIds}
                  onElementMouseDown={handleElementDrag}
                  onResizeStart={handleResizeStart}
                  containerRef={containerRef}
                />
              ))}

              {/* Empty state */}
              {tracks.length <= 1 &&
                tracks.every((t) => t.elements.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-base-fg/30">
                    Drop media here to start editing
                  </div>
                )}
            </div>

            {/* Playhead */}
            <TimelinePlayhead
              zoomLevel={zoomLevel}
              scrollLeft={scrollLeft}
              height={trackAreaHeight + 24}
            />

            {/* Snap indicator */}
            <SnapIndicator
              x={snapLineX.current}
              height={trackAreaHeight + 24}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
