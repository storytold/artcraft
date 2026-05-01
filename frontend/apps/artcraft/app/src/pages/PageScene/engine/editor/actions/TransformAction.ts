import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";
import {
  TransformSnap,
  transformsEqual,
  writeTransform,
} from "./snapshots";

// Records a transform change. Constructor takes the before/after
// snapshots directly; callers are responsible for snapshotting the
// live object before the engine write and after.
//
// Coalescing: tryMerge absorbs a follow-up TransformAction whose
// `before` matches this one's `after` (chain continuity), extending
// `after` to the new endpoint. This collapses panel keystroke /
// scrub-drag / gizmo-drag bursts into a single undo entry without
// any session-state on the caller — HistoryManager.record handles it.
export class TransformAction implements UndoableAction {
  readonly label = "Transform";
  private before: TransformSnap;
  private after: TransformSnap;

  constructor(
    private readonly editor: Editor,
    public readonly uuid: string,
    before: TransformSnap,
    after: TransformSnap,
  ) {
    this.before = before;
    this.after = after;
  }

  apply(): void {
    writeTransform(this.editor, this.uuid, this.after);
  }

  revert(): void {
    writeTransform(this.editor, this.uuid, this.before);
  }

  tryMerge(other: UndoableAction): boolean {
    if (!(other instanceof TransformAction)) return false;
    if (other.uuid !== this.uuid) return false;
    // Continuation: the new edit must start where our current end is.
    if (!transformsEqual(this.after, other.before)) return false;
    this.after = other.after;
    return true;
  }
}
