import { Command, type CommandResult } from "../../base-command";
import { EditorCore } from "../../../core";
import type { SceneTracks } from "../../../timeline/types";

export class RemoveTrackCommand extends Command {
  private savedState: SceneTracks | null = null;

  constructor(private trackId: string) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;
    const updatedTracks: SceneTracks = {
      ...this.savedState,
      overlay: this.savedState.overlay.filter((track) => track.id !== this.trackId),
      audio: this.savedState.audio.filter((track) => track.id !== this.trackId),
    };
    editor.timeline.updateTracks(updatedTracks);
    // FIX: clips on the deleted track used to stay selected, so the selection
    // kept pointing at elements that no longer exist (the toolbar and shortcuts
    // still treated them as a live element selection). Keep only the selected
    // clips that live on other tracks. Undo restores the earlier selection.
    return {
      selection: {
        selectedElements: editor.selection
          .getSelectedElements()
          .filter((ref) => ref.trackId !== this.trackId),
        selectedKeyframes: editor.selection
          .getSelectedKeyframes()
          .filter((ref) => ref.trackId !== this.trackId),
        // A mask-point selection on the deleted track would otherwise keep
        // winning the "active selection" priority, and the keyframe anchor
        // would point at a keyframe that no longer exists.
        selectedMaskPoints:
          editor.selection.getSelectedMaskPointSelection()?.trackId ===
          this.trackId
            ? null
            : editor.selection.getSelectedMaskPointSelection(),
        keyframeSelectionAnchor:
          editor.selection.getKeyframeSelectionAnchor()?.trackId ===
          this.trackId
            ? null
            : editor.selection.getKeyframeSelectionAnchor(),
      },
    };
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
