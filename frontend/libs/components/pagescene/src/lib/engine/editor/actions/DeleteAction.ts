import * as THREE from "three";
import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";
import {
  ObjectSnap,
  recreateFromSnapshot,
  snapshotObject,
} from "./snapshots";

// Records the deletion of an object. Mirror of CreateAction with
// apply/revert swapped. apply() removes via utils.deleteObject (the
// non-recording path) so a redo of a delete during replay can't
// re-trigger recordDelete.
export class DeleteAction implements UndoableAction {
  readonly label: string;
  private readonly snap: ObjectSnap;

  constructor(
    private readonly editor: Editor,
    obj: THREE.Object3D,
  ) {
    this.snap = snapshotObject(obj);
    this.label = `Delete ${this.snap.name}`;
  }

  async apply(): Promise<void> {
    this.editor.utils.deleteObject(this.snap.uuid);
    this.editor.selection.refreshOutliner();
  }

  async revert(): Promise<void> {
    await recreateFromSnapshot(this.editor, this.snap);
    this.editor.selection.refreshOutliner();
  }
}
