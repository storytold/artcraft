import type { UndoableAction } from "../HistoryManager";
import type { TimelineController } from "../TimelineController";
import { cloneTimeline, type TimelineData } from "../../timeline/types";

// Records a timeline "Save": the whole timeline before vs. after the save.
// Mirrors TransformAction's before/commit/after shape. The controller
// constructs this with the pre-save (last-saved) timeline, calls commit()
// to capture the post-save timeline, and records it only if they differ.
export class SaveTimelineAction implements UndoableAction {
  readonly label = "Save Timeline";
  private after?: TimelineData;

  constructor(
    private readonly controller: TimelineController,
    private readonly before: TimelineData,
  ) {}

  commit(): boolean {
    const current = this.controller.getTimeline();
    if (!current) return false;
    this.after = cloneTimeline(current);
    return JSON.stringify(this.before) !== JSON.stringify(this.after);
  }

  apply(): void {
    if (this.after) this.controller.loadTimeline(this.after);
  }

  revert(): void {
    this.controller.loadTimeline(this.before);
  }
}
