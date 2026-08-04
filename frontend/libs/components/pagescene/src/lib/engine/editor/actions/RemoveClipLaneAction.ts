import type { UndoableAction } from "../HistoryManager";
import type { TimelineController } from "../TimelineController";
import type { ClipLane } from "../../timeline/types";

// Removing a clip strip (the strip's × or Del/Backspace) gets its own undo
// step — unlike other clip edits, which ride the timeline Save/Cancel
// session, a deletion is destructive enough to deserve immediate undo.
// The lane is deep-cloned at construction so later mutations can't corrupt
// the snapshot; undo re-inserts it verbatim via restoreClipLane.
export class RemoveClipLaneAction implements UndoableAction {
  readonly label = "Remove Animation Clip";
  private readonly lane: ClipLane;

  constructor(
    private readonly controller: TimelineController,
    lane: ClipLane,
  ) {
    this.lane = JSON.parse(JSON.stringify(lane));
  }

  apply(): void {
    this.controller.removeClipLane(this.lane.id);
  }

  revert(): void {
    this.controller.restoreClipLane(this.lane);
  }
}
