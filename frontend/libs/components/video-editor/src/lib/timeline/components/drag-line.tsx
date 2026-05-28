import { getDropLineY } from "./drop-target";
import type { TimelineTrack, DropTarget } from "../types";
import { TIMELINE_LAYERS } from "./layers";

interface DragLineProps {
  dropTarget: DropTarget | null;
  tracks: TimelineTrack[];
  isVisible: boolean;
  headerHeight?: number;
}

export function DragLine({
  dropTarget,
  tracks,
  isVisible,
  headerHeight = 0,
}: DragLineProps) {
  if (!isVisible || !dropTarget) return null;

  const y = getDropLineY({ dropTarget, tracks });
  const lineTop = y + headerHeight;

  return (
    <div
      className="bg-primary pointer-events-none absolute right-0 left-0 h-0.5"
      style={{ top: `${lineTop}px`, zIndex: TIMELINE_LAYERS.dragLine }}
    />
  );
}
