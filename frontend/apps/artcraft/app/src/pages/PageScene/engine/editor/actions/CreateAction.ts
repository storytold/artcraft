import * as THREE from "three";
import type Editor from "../../editor";
import type { UndoableAction } from "../HistoryManager";
import {
  ObjectSnap,
  recreateFromSnapshot,
  snapshotObject,
} from "./snapshots";

// Records the creation of an object. apply() re-creates from the
// captured snapshot (used on redo). revert() removes the object using
// the lower-level utils.deleteObject path so it does NOT recurse
// through editor.deleteObject (which would try to record a fresh
// delete entry).
export class CreateAction implements UndoableAction {
  readonly label: string;
  private readonly snap: ObjectSnap;

  constructor(
    private readonly editor: Editor,
    obj: THREE.Object3D,
  ) {
    this.snap = snapshotObject(obj);
    this.label = `Create ${this.snap.name}`;
  }

  async apply(): Promise<void> {
    await recreateFromSnapshot(this.editor, this.snap);
    this.editor.selection.refreshOutliner();
  }

  async revert(): Promise<void> {
    this.editor.utils.deleteObject(this.snap.uuid);
    this.editor.selection.refreshOutliner();
  }
}
