import type Editor from "../engine/editor";

// Toggle the persistent skeleton overlay for one object (the outliner's
// bone icon). Editor-only chrome — the helper lives on layer 1, so it never
// appears in renders/captures — but the flag persists in the scene JSON via
// userData.skeletonVisible. Deliberately not undoable (view state, not
// scene content), matching the FK-mode visualization it complements.
export function toggleSkeletonHelper(editor: Editor, uuid: string): void {
  editor.skeletonHelpers.setVisible(
    uuid,
    !editor.skeletonHelpers.isVisible(uuid),
  );
  // Refresh so the outliner row's bone icon reflects the new state.
  editor.selection.refreshOutliner();
}
