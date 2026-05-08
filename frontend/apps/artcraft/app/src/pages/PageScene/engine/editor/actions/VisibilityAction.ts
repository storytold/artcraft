import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";

// Records a visibility toggle. Writes both obj.visible and
// userData.visible directly. The outliner refresh fires in
// HistoryManager's replay wrapper so the row icon stays in sync.
export class VisibilityAction implements UndoableAction {
  readonly label: string;

  constructor(
    private readonly editor: Editor,
    private readonly uuid: string,
    private readonly before: boolean,
    private readonly after: boolean,
  ) {
    this.label = after ? "Show" : "Hide";
  }

  apply(): void {
    this.write(this.after);
    this.editor.selection.refreshOutliner();
  }

  revert(): void {
    this.write(this.before);
    this.editor.selection.refreshOutliner();
  }

  private write(visible: boolean): void {
    const obj = this.editor.activeScene.scene.getObjectByProperty(
      "uuid",
      this.uuid,
    );
    if (!obj) return;
    obj.visible = visible;
    obj.userData["visible"] = visible;
  }
}
