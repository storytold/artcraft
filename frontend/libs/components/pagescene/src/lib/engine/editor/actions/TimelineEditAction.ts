import type { UndoableAction } from "../HistoryManager";
import type {
  TimelineController,
  TimelineUndoSnapshot,
} from "../TimelineController";

// One timeline edit as an undo step. Every mutation of the timeline —
// keyframe add/move/delete, clip placement, easing, duration, even Save and
// Cancel — records one of these with whole-timeline {live, saved} snapshots
// captured before and after. Undo/redo restore the pair wholesale, so any
// interleaving of edits, saves, and cancels replays coherently with no
// per-kind bookkeeping. Timelines are small (this codebase already clones
// one on every change event), which is what makes snapshotting affordable.
// Continuous gestures (drags, the easing popover) capture `before` at
// gesture start and record on commit, so a whole drag is a single step.
export class TimelineEditAction implements UndoableAction {
  constructor(
    private readonly controller: TimelineController,
    readonly label: string,
    private readonly before: TimelineUndoSnapshot,
    private readonly after: TimelineUndoSnapshot,
  ) {}

  apply(): void {
    this.controller.restoreSnapshot(this.after);
  }

  revert(): void {
    this.controller.restoreSnapshot(this.before);
  }
}
