import type Editor from "../engine/editor";
import { ColorAction } from "../engine/editor/actions/ColorAction";

// Apply a color change to an object: writes the new hex through
// activeScene.setColor (which handles material/Chroma plumbing), and
// records a ColorAction on the undo stack with the before-state read
// from the live object so the helper is self-contained.
//
// View callers only need to provide editor + uuid + new hex; the
// helper handles engine + history orchestration.
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
