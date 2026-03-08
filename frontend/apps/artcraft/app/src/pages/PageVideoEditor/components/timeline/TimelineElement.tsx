import { useCallback, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faImage, faFont, faVolumeHigh } from "@fortawesome/pro-solid-svg-icons";
import { timeToPixels } from "../../lib/timeline/pixel-utils";
import type { TimelineElement as TElement } from "../../types";

interface Props {
  element: TElement;
  trackId: string;
  zoomLevel: number;
  scrollLeft: number;
  isSelected: boolean;
  trackHeight: number;
  onMouseDown: (
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

const TYPE_COLORS: Record<string, string> = {
  video: "bg-blue-600/60 border-blue-400/40",
  image: "bg-indigo-600/60 border-indigo-400/40",
  audio: "bg-purple-600/60 border-purple-400/40",
  text: "bg-emerald-600/60 border-emerald-400/40",
};

const TYPE_ICONS = {
  video: faFilm,
  image: faImage,
  audio: faVolumeHigh,
  text: faFont,
};

export const TimelineElementComponent = memo(function TimelineElementComponent({
  element,
  trackId,
  zoomLevel,
  scrollLeft,
  isSelected,
  trackHeight,
  onMouseDown,
  onResizeStart,
  containerRef,
}: Props) {
  const left = timeToPixels(element.startTime, zoomLevel) - scrollLeft;
  const width = timeToPixels(element.duration, zoomLevel);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      onMouseDown(
        e,
        element.id,
        trackId,
        element.startTime,
        containerRef.current.getBoundingClientRect(),
      );
    },
    [element.id, element.startTime, trackId, onMouseDown, containerRef],
  );

  const handleResizeLeft = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      onResizeStart(e, "left", element.id, trackId, element, containerRef.current.getBoundingClientRect());
    },
    [element, trackId, onResizeStart, containerRef],
  );

  const handleResizeRight = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      onResizeStart(e, "right", element.id, trackId, element, containerRef.current.getBoundingClientRect());
    },
    [element, trackId, onResizeStart, containerRef],
  );

  // Cull off-screen elements
  if (left + width < -50 || left > 3000) return null;

  const colors = TYPE_COLORS[element.type] ?? "bg-gray-600/60 border-gray-400/40";
  const icon = TYPE_ICONS[element.type as keyof typeof TYPE_ICONS];

  return (
    <div
      className={`absolute top-[2px] flex cursor-grab items-center gap-1 overflow-hidden rounded border px-2 text-xs text-white/90 transition-shadow select-none ${colors} ${isSelected ? "ring-2 ring-primary shadow-lg shadow-primary/20" : "hover:brightness-110"}`}
      style={{
        left,
        width: Math.max(width, 20),
        height: trackHeight - 4,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-white/20"
        onMouseDown={handleResizeLeft}
      />

      {/* Content */}
      {icon && <FontAwesomeIcon icon={icon} className="shrink-0 text-[10px] opacity-70" />}
      <span className="truncate">{element.name}</span>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-white/20"
        onMouseDown={handleResizeRight}
      />
    </div>
  );
});
