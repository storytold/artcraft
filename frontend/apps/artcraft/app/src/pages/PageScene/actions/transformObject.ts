import type Editor from "../engine/editor";
import { TransformAction } from "../engine/editor/actions/TransformAction";
import {
  snapshotTransform,
  transformsEqual,
} from "../engine/editor/actions/snapshots";
import type { XYZ } from "../datastructures/common";

// Apply a transform change and record it for undo.
//
// Burst inputs (panel keystrokes, scrub drags) call this on every
// engine update. HistoryManager.record coalesces consecutive
// TransformActions for the same uuid into one undo entry, so the
// caller doesn't need session-state — `tryMerge` on TransformAction
// folds successive entries into the most recent one.
//
// Snapshots before and after so the recorded action holds the actual
// engine state delta (not the panel's local React state). Also
// re-syncs the Zustand objectPanel slice so the panel's
// currentSceneObject reflects the post-update transform.
export function transformObject(
  editor: Editor,
  uuid: string,
  position: XYZ,
  rotation: XYZ,
  scale: XYZ,
): void {
  const obj = editor.activeScene.scene.getObjectByProperty("uuid", uuid);
  if (!obj) return;
  const before = snapshotTransform(obj);

  editor.sceneManager?.updateSelectedTransform(position, rotation, scale);

  const after = snapshotTransform(obj);
  if (!transformsEqual(before, after)) {
    editor.history.record(new TransformAction(editor, uuid, before, after));
  }
  editor.selection.updateSelectedUI();
}
