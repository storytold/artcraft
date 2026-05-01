import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";

// Records a color change. apply() and revert() both call
// activeScene.setColor — the engine handles material magic. The action
// captures the uuid + before/after hex pair at construction time.
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
  }

  revert(): void {
    this.editor.activeScene.setColor(this.uuid, this.before);
  }
}
