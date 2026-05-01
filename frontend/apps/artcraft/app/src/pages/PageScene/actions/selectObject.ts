import type Editor from "../engine/editor";

// Selecting in the engine triggers Editor.publishSelect which writes the
// selection into the store, so this action only needs to invoke the engine
// path.
export function selectObject(editor: Editor, id: string): void {
  editor.sceneManager?.select_object(id);
}

export function deselectObject(editor: Editor): void {
  if (editor.sceneManager) {
    editor.sceneManager.selected_objects = undefined;
  }
  editor.selection.publishSelect();
}
