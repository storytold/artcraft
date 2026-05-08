import type { SelectionBridge } from "../SelectionBridge";
import type { UndoableAction } from "../HistoryManager";

// Records a lock-toggle. Routes both apply() and revert() through
// SelectionBridge.setLockState so the gizmo attach/detach side effects
// fire — the same path the user-toggle uses, just at a target state
// instead of a flip.
export class LockAction implements UndoableAction {
  readonly label: string;

  constructor(
    private readonly selection: SelectionBridge,
    private readonly uuid: string,
    private readonly before: boolean,
    private readonly after: boolean,
  ) {
    this.label = after ? "Lock" : "Unlock";
  }

  apply(): void {
    this.selection.setLockState(this.uuid, this.after);
    this.selection.refreshOutliner();
  }

  revert(): void {
    this.selection.setLockState(this.uuid, this.before);
    this.selection.refreshOutliner();
  }
}
