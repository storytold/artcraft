import type Editor from "../engine/editor";
import { LockAction } from "../engine/editor/actions/LockAction";
import { usePageSceneStore } from "../PageSceneStore";

// Toggle the locked state of an object: flips userData.locked, runs
// the gizmo attach/detach side effect, syncs the outliner row icon in
// the Zustand store, and records the toggle on the undo stack.
//
// View callers (Outliner) only need to provide editor + uuid; the
// action handles the engine + store + history orchestration.
export function toggleObjectLock(editor: Editor, uuid: string): void {
  const before = editor.selection.isObjectLocked(uuid);
  usePageSceneStore.getState().toggleOutlinerLock(uuid);
  editor.selection.lockUnlockObject(uuid);
  editor.history.record(
    new LockAction(editor.selection, uuid, before, !before),
  );
}
