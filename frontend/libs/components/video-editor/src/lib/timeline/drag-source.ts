import type { TimelineDragData } from "./drag";

const TIMELINE_DRAG_MIME = "application/x-timeline-drag";

// Owns the state of an in-progress timeline drag session.
//
// Exists because browsers restrict `DataTransfer.getData()` to the `drop`
// event for security — during `dragover`/`dragenter` only `types` is
// readable. The drop target needs the payload (element type, target
// element types, source duration) while the pointer is hovering, so we
// keep a live copy here and hand it out via `getActive`.
export class TimelineDragSource {
  private active: TimelineDragData | null = null;

  begin({
    dataTransfer,
    dragData,
  }: {
    dataTransfer: DataTransfer;
    dragData: TimelineDragData;
  }): void {
    dataTransfer.setData(TIMELINE_DRAG_MIME, JSON.stringify(dragData));
    dataTransfer.effectAllowed = "copy";
    this.active = dragData;
  }

  end(): void {
    this.active = null;
  }

  getActive(): TimelineDragData | null {
    return this.active;
  }

  isActive(): boolean {
    return this.active !== null;
  }
}
