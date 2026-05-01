import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";

// Records a color change. apply() and revert() both call
// activeScene.setColor — the engine handles material magic.
//
// Coalescing: tryMerge absorbs a follow-up ColorAction whose `before`
// matches this one's `after`, so the native <input type="color">
// per-pixel onChange spam (and any other burst color source) collapses
// into one undo entry without session machinery on the caller.
export class ColorAction implements UndoableAction {
  readonly label = "Color";

  constructor(
    private readonly editor: Editor,
    public readonly uuid: string,
    private readonly before: string,
    private after: string,
  ) {}

  apply(): void {
    this.editor.activeScene.setColor(this.uuid, this.after);
  }

  revert(): void {
    this.editor.activeScene.setColor(this.uuid, this.before);
  }

  tryMerge(other: UndoableAction): boolean {
    if (!(other instanceof ColorAction)) return false;
    if (other.uuid !== this.uuid) return false;
    if (this.after !== other.before) return false;
    this.after = other.after;
    return true;
  }
}
