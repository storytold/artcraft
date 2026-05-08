import type Editor from "../engine/editor";

// Editor.deleteObject already removes the THREE.js object via SceneUtils,
// which emits ObjectRemovedEvent + InspectorPanelChangedEvent on the
// engine bus; the bridge translates those into the matching store
// mutations. This action exists for symmetry with addObject and to
// give callers a single import surface.
export function deleteObject(editor: Editor, id: string): void {
  editor.deleteObject(id);
}
