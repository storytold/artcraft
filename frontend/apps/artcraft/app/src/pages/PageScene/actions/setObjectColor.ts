import type Editor from "../engine/editor";
import { ColorAction } from "../engine/editor/actions/ColorAction";

// Apply a color change and record it for undo.
//
// Burst inputs (the native <input type="color"> dialog spams onChange
// per slider pixel) call this on every onChange. HistoryManager.record
// coalesces consecutive ColorActions for the same uuid into one undo
// entry via ColorAction.tryMerge — so the caller doesn't need
// session-state.
//
// Reads the before-state from the live engine object so the helper is
// self-contained and stays correct even after undo/redo (where the
// engine state diverges from any local React state the view may hold).
export function setObjectColor(
  editor: Editor,
  uuid: string,
  color: string,
): void {
  const obj = editor.activeScene.scene.getObjectByProperty("uuid", uuid);
  if (!obj) return;
  const before = (obj.userData.color as string) ?? "#ffffff";
  if (before === color) return;
  editor.activeScene.setColor(uuid, color);
  editor.history.record(new ColorAction(editor, uuid, before, color));
}
