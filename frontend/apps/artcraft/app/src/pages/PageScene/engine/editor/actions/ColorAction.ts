import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";

// Records a color change. apply() and revert() both call
// activeScene.setColor — the engine handles material magic. The action
// captures the uuid + before/after hex pair at construction time.
//
// Each replay also fires SelectionBridge.updateSelectedUI() so the
// Object Panel re-reads userData.color and refreshes its preview.
// Without this, undo correctly reverts the THREE.js material but
// ControlPanelSceneObject's local React state stays at the redo
// value (the per-frame getSelectedSum check that picks up transform
// changes doesn't notice color changes).
export class ColorAction implements UndoableAction {
  readonly label = "Color";

  constructor(
    private readonly editor: Editor,
    private readonly uuid: string,
    private readonly before: string,
    private readonly after: string,
  ) {}

  apply(): void {
    this.editor.activeScene.setColor(this.uuid, this.after);
    this.editor.selection.updateSelectedUI();
  }

  revert(): void {
    this.editor.activeScene.setColor(this.uuid, this.before);
    this.editor.selection.updateSelectedUI();
  }
}
