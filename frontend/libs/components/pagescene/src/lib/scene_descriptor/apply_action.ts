// Undoable history action for a whole-scene descriptor apply.
//
// A descriptor apply replaces the entire scene, so it's recorded as a
// single history entry: undo restores the full pre-apply snapshot, redo
// re-applies the full post-apply snapshot — "revert the entire config
// application at once", in one Ctrl+Z. Both snapshots are the same
// serialized form the editor's load path already consumes.

import type Editor from "../engine/editor";
import type { UndoableAction } from "../engine/editor/HistoryManager";
import { SceneResetEvent } from "../engine/events/EngineEvent";

export class ApplyDescriptorAction implements UndoableAction {
  readonly label: string;

  constructor(
    private readonly editor: Editor,
    // Full-scene JSON snapshots (the shape SaveManager.getSceneJson emits,
    // stringified). `before` is the scene prior to the apply; `after` is
    // the scene the apply produced.
    private readonly before: string,
    private readonly after: string,
    label = "Apply scene config",
  ) {
    this.label = label;
  }

  // do / redo — restore the post-apply scene.
  async apply(): Promise<void> {
    await reloadScene(this.editor, this.after);
  }

  // undo — restore the pre-apply scene.
  async revert(): Promise<void> {
    await reloadScene(this.editor, this.before);
  }
}

// Rebuild the scene from a full-scene JSON snapshot. Mirrors the tail of
// Editor.applyJson (minus the history.clear, which would defeat undo) so
// transient UI — selection, outliner — is reset to match the new graph.
export async function reloadScene(editor: Editor, json: string): Promise<void> {
  const result = await editor.save_manager.loadCache(json);
  if (!result.applied) return;
  editor.bus.emit(new SceneResetEvent());
  editor.selection.refreshOutliner();
}
