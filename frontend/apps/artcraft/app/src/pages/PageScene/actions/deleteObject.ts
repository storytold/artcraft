import type Editor from "../engine/editor";

// Editor.deleteObject already removes the THREE.js object via SceneUtils
// and updates the store via the helper that calls
// usePageSceneStore.getState().removeSceneObject. This action exists for
// symmetry with addObject and to give callers a single import surface.
export function deleteObject(editor: Editor, id: string): void {
  editor.deleteObject(id);
}
