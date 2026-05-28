import { Command, type CommandResult } from "../../base-command";
import type { SceneTracks } from "../../../timeline/types";
import { EditorCore } from "../../../core";
import { canTrackHaveAudio } from "../../../timeline/track-capabilities";
import { findTrackInSceneTracks, updateTrackInSceneTracks } from "../../../timeline/track-element-update";

export class ToggleTrackMuteCommand extends Command {
  private savedState: SceneTracks | null = null;

  constructor(private trackId: string) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const targetTrack = findTrackInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
    });
    if (!targetTrack) {
      return;
    }

    const updatedTracks = updateTrackInSceneTracks({
      tracks: this.savedState,
      trackId: this.trackId,
      update: (track) =>
        canTrackHaveAudio(track) ? { ...track, muted: !track.muted } : track,
    });

    editor.timeline.updateTracks(updatedTracks);
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}
