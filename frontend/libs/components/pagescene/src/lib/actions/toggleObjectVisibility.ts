import type Editor from "../engine/editor";
import { VisibilityAction } from "../engine/editor/actions/VisibilityAction";
import { OutlinerItemVisibilityToggledEvent } from "../engine/events/EngineEvent";

// Toggle the visibility of an object: flips obj.visible +
// userData.visible, syncs the outliner row icon in the Zustand store,
// and records the toggle on the undo stack.
//
// View callers (Outliner) only need to provide editor + uuid; the
// helper reads the before-state from the live engine object so the
// view doesn't have to plumb it.
export function toggleObjectVisibility(editor: Editor, uuid: string): void {
  const obj = editor.activeScene.scene.getObjectByProperty("uuid", uuid);
  if (!obj) return;
  const before = obj.visible;
  editor.bus.emit(new OutlinerItemVisibilityToggledEvent(uuid));
  editor.sceneManager?.hideObject(uuid);
  editor.history.record(
    new VisibilityAction(editor, uuid, before, !before),
  );
}
