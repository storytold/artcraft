import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";
import {
  TransformSnap,
  snapshotTransform,
  transformsEqual,
  writeTransform,
} from "./snapshots";

// Records a transform change. Caller holds the instance between the
// drag/edit boundary callbacks (gizmo dragstart/dragend, panel input
// focus/blur) and calls commit() at the end. If the transform didn't
// actually change, commit() returns false and the caller drops the
// action without recording.
//
// Begin/end transaction state lives on the action itself — no need for
// a per-manager pendingTransform field.
export class TransformAction implements UndoableAction {
  readonly label = "Transform";
  private readonly before: TransformSnap;
  private after?: TransformSnap;

  constructor(
    private readonly editor: Editor,
    private readonly uuid: string,
  ) {
    const obj = editor.activeScene.scene.getObjectByProperty("uuid", uuid);
    if (!obj) {
      this.before = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      return;
    }
    this.before = snapshotTransform(obj);
  }

  // Capture the after-state from the live object. Returns true if it
  // differs from the before-state (worth recording).
  commit(): boolean {
    const obj = this.editor.activeScene.scene.getObjectByProperty(
      "uuid",
      this.uuid,
    );
    if (!obj) return false;
    this.after = snapshotTransform(obj);
    return !transformsEqual(this.before, this.after);
  }

  apply(): void {
    if (this.after) writeTransform(this.editor, this.uuid, this.after);
  }

  revert(): void {
    writeTransform(this.editor, this.uuid, this.before);
  }
}
