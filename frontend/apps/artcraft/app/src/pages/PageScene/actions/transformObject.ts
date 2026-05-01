import type Editor from "../engine/editor";
import { TransformAction } from "../engine/editor/actions/TransformAction";

// A transform "session" — opened on the first edit of a multi-input
// editing flow (e.g. Object Panel position/rotation/scale text fields),
// committed at the end of the session (selection change, panel
// unmount, focus moving away from the panel).
//
// The session captures the before-state at construction. On commit it
// captures the after-state, pushes a single TransformAction onto the
// undo stack only if the transform actually changed, and re-syncs the
// Zustand `objectPanel` slice from the engine so the panel's view of
// the selection matches the engine state.
//
// Engine-level concerns (capture / apply / revert) stay in
// `engine/editor/actions/TransformAction.ts`; this file is the
// orchestration wrapper that the action layer (UI code) uses so the
// view never has to construct an UndoableAction directly.
export type TransformSession = {
  commit(): void;
};

export function beginTransformSession(
  editor: Editor,
  uuid: string,
): TransformSession {
  const action = new TransformAction(editor, uuid);
  return {
    commit() {
      if (action.commit()) {
        editor.history.record(action);
      }
      // Push the engine's post-edit transform back into the Zustand
      // objectPanel slice so the panel's currentSceneObject vectors
      // are in sync with what the user just committed. Idempotent.
      editor.selection.updateSelectedUI();
    },
  };
}
