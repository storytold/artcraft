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
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
