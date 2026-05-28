import { Command, type CommandResult } from "../../base-command";
import type { SceneTracks, TrackType } from "../../../timeline/types";
import { generateUUID } from "../../../utils/id";
import { EditorCore } from "../../../core";
import {
  buildEmptyTrack,
  getDefaultInsertIndexForTrack,
} from "../../../timeline/placement";

export class AddTrackCommand extends Command {
  private trackId: string;
  private savedState: SceneTracks | null = null;

  constructor({
    type,
    index,
  }: {
    type: TrackType;
    index?: number;
  }) {
    super();
    this.type = type;
    this.index = index;
    this.trackId = generateUUID();
  }

  private type: TrackType;
  private index?: number;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const insertIndex =
      this.index ??
      getDefaultInsertIndexForTrack({
        tracks: this.savedState,
        trackType: this.type,
      });

    const updatedTracks =
      this.type === "audio"
        ? buildAudioTrackState({
            tracks: this.savedState,
            insertIndex,
            trackId: this.trackId,
          })
        : buildOverlayTrackState({
            tracks: this.savedState,
            insertIndex,
            trackId: this.trackId,
            trackType: this.type,
          });

    editor.timeline.updateTracks(updatedTracks);
    return undefined;
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }

  getTrackId(): string {
    return this.trackId;
  }
}

function buildAudioTrackState({
  tracks,
  insertIndex,
  trackId,
}: {
  tracks: SceneTracks;
  insertIndex: number;
  trackId: string;
}): SceneTracks {
  const audioInsertIndex = Math.max(0, insertIndex - tracks.overlay.length - 1);
  const newTrack = buildEmptyTrack({
    id: trackId,
    type: "audio",
  });
  return {
    ...tracks,
    audio: [
      ...tracks.audio.slice(0, audioInsertIndex),
      newTrack,
      ...tracks.audio.slice(audioInsertIndex),
    ],
  };
}

function buildOverlayTrackState({
  tracks,
  insertIndex,
  trackId,
  trackType,
}: {
  tracks: SceneTracks;
  insertIndex: number;
  trackId: string;
  trackType: Exclude<TrackType, "audio">;
}): SceneTracks {
  const overlayInsertIndex = Math.min(insertIndex, tracks.overlay.length);
  const newTrack =
    trackType === "video"
      ? buildEmptyTrack({ id: trackId, type: "video" })
      : trackType === "text"
        ? buildEmptyTrack({ id: trackId, type: "text" })
        : trackType === "graphic"
          ? buildEmptyTrack({ id: trackId, type: "graphic" })
          : buildEmptyTrack({ id: trackId, type: "effect" });
  return {
    ...tracks,
    overlay: [
      ...tracks.overlay.slice(0, overlayInsertIndex),
      newTrack,
      ...tracks.overlay.slice(overlayInsertIndex),
    ],
  };
}
