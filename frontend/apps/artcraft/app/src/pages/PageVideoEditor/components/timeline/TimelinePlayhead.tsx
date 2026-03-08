import { useVideoEditor } from "../../hooks/useVideoEditor";
import { timeToPixels } from "../../lib/timeline/pixel-utils";

interface Props {
  zoomLevel: number;
  scrollLeft: number;
  height: number;
}

export function TimelinePlayhead({ zoomLevel, scrollLeft, height }: Props) {
  const editor = useVideoEditor();
  const currentTime = editor.playback.getCurrentTime();
  const x = timeToPixels(currentTime, zoomLevel) - scrollLeft;

  // Don't render if off-screen
  if (x < -10 || x > 3000) return null;

  return (
    <div
      className="pointer-events-none absolute top-0 z-20"
      style={{ left: x, height }}
    >
      {/* Playhead triangle */}
      <div
        className="absolute -left-[5px] -top-[2px] h-0 w-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "8px solid #ef4444",
        }}
      />
      {/* Playhead line */}
      <div className="absolute left-0 top-0 w-[1px] bg-red-500" style={{ height }} />
    </div>
  );
}
