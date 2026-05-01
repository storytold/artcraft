import type Editor from "../engine/editor";
import { ColorAction } from "../engine/editor/actions/ColorAction";

// One-shot apply: use when the change is atomic (e.g. a button click
// or programmatic setter). Records a single ColorAction.
//
// For interactive flows where a single user gesture fires many
// intermediate values (the native <input type="color"> dialog spams
// onChange per slider pixel), use beginColorSession instead — it
// applies each intermediate value to the engine for visual feedback
// but records only ONE ColorAction on commit.
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

// Session-style color edit: snapshots the before-state at construction
// (focus / picker open), applies each intermediate value to the engine
// (visual feedback during slider drag), and records exactly one
// ColorAction on commit (focus loss / picker close). No-op on commit
// if the final color matches the before-state.
export type ColorSession = {
  apply(color: string): void;
  commit(): void;
};

export function beginColorSession(
  editor: Editor,
  uuid: string,
): ColorSession {
  const startObj = editor.activeScene.scene.getObjectByProperty(
    "uuid",
    uuid,
  );
  const before = (startObj?.userData.color as string) ?? "#ffffff";
  return {
    apply(color: string) {
      editor.activeScene.setColor(uuid, color);
    },
    commit() {
      const endObj = editor.activeScene.scene.getObjectByProperty(
        "uuid",
        uuid,
      );
      const after = (endObj?.userData.color as string) ?? before;
      if (before === after) return;
      editor.history.record(new ColorAction(editor, uuid, before, after));
    },
  };
}
