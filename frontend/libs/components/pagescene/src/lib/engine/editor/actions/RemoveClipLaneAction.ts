import type { UndoableAction } from "../HistoryManager";
import type { TimelineController } from "../TimelineController";
import type { ClipLane } from "../../timeline/types";

// Removing a clip strip (the strip's × or Del/Backspace) gets its own undo
// step — unlike other clip edits, which ride the timeline Save/Cancel
// session, a deletion is destructive enough to deserve immediate undo. To
// keep that session-independence honest, removeClipLane also strips the
// lane from the controller's `saved` snapshot (else Cancel would resurrect
// it and the next Save would double-record the removal); this action
// therefore captures BOTH the live lane and its saved-snapshot entry (which
// may differ in placement, or be absent for a never-saved strip) so undo
// restores both worlds exactly. Snapshots are deep-cloned at construction
// so later mutations can't corrupt them.
export class RemoveClipLaneAction implements UndoableAction {
  readonly label = "Remove Animation Clip";
  private readonly lane: ClipLane;
  private readonly savedLane: ClipLane | null;

  constructor(
    private readonly controller: TimelineController,
    lane: ClipLane,
  ) {
    this.lane = JSON.parse(JSON.stringify(lane));
    this.savedLane = controller.getSavedClipLane(lane.id);
  }

  apply(): void {
    this.controller.removeClipLane(this.lane.id);
  }

  revert(): void {
    this.controller.restoreClipLane(this.lane, this.savedLane ?? undefined);
  }
}
