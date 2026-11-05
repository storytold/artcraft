import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { MediaAsset } from "../../media/types";
import { buildWaveformSourceKey } from "../../media/waveform-summary";
import { videoCache } from "../../services/video-cache/service";
import { waveformCache } from "../../services/waveform-cache/service";
import { hasMediaId } from "../../timeline/element-utils";
import type { SceneTracks } from "../../timeline/types";

export class RemoveMediaAssetCommand extends Command {
  private savedTracks: SceneTracks | null = null;
  private removedAsset: MediaAsset | null = null;
  // Where the asset sat in the bin when it was removed, so undo can put it back
  // in the same spot instead of restoring a snapshot of the whole list.
  private removedIndex = 0;

  constructor({
    projectId,
    assetId,
  }: {
    projectId: string;
    assetId: string;
  }) {
    super();
    this.projectId = projectId;
    this.assetId = assetId;
  }

  private projectId: string;
  private assetId: string;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const assets = editor.media.getAssets();

    this.savedTracks = editor.scenes.getActiveScene().tracks;

    this.removedIndex = assets.findIndex(
      (media: MediaAsset) => media.id === this.assetId,
    );
    this.removedAsset =
      this.removedIndex === -1 ? null : assets[this.removedIndex];

    if (!this.removedAsset) {
      console.error("Media asset not found:", this.assetId);
      return;
    }

    if (this.removedAsset.url) {
      URL.revokeObjectURL(this.removedAsset.url);
    }
    if (this.removedAsset.thumbnailUrl) {
      URL.revokeObjectURL(this.removedAsset.thumbnailUrl);
    }

    videoCache.clearVideo({ mediaId: this.assetId });
    waveformCache.clearSource({
      sourceKey: buildWaveformSourceKey({
        kind: "media",
        id: this.assetId,
      }),
    });

    editor.media.setAssets({
      assets: assets.filter((media: MediaAsset) => media.id !== this.assetId),
    });

    const elementsToRemove: Array<{ trackId: string; elementId: string }> = [];

    for (const track of [
      ...this.savedTracks!.overlay,
      this.savedTracks!.main,
      ...this.savedTracks!.audio,
    ]) {
      for (const element of track.elements) {
        if (hasMediaId(element) && element.mediaId === this.assetId) {
          elementsToRemove.push({ trackId: track.id, elementId: element.id });
        }
      }
    }

    if (elementsToRemove.length > 0) {
      editor.timeline.deleteElements({ elements: elementsToRemove });
    }

    // Persistence handled by host via ProjectStorageAdapter
  }

  undo(): void {
    const editor = EditorCore.getInstance();

    // FIX: undo used to restore the whole asset list snapshotted in execute().
    // That dropped any asset added afterwards outside the undo history (assets
    // panel, timeline drag-drop), and in a multi-select delete it put the other
    // deleted assets back from an older snapshot with their already-revoked blob
    // URLs. Put back only the asset this command removed, at its old position
    // (clamped to the current length), with a freshly created URL. If it is
    // already in the bin there is nothing to restore.
    if (this.removedAsset) {
      const current = editor.media.getAssets();
      if (!current.some((a) => a.id === this.assetId)) {
        const restoredAsset: MediaAsset = {
          ...this.removedAsset,
          url: URL.createObjectURL(this.removedAsset.file),
        };
        const index = Math.min(this.removedIndex, current.length);

        editor.media.setAssets({
          assets: [
            ...current.slice(0, index),
            restoredAsset,
            ...current.slice(index),
          ],
        });
      }

      // Persistence handled by host via ProjectStorageAdapter
    }

    if (this.savedTracks) {
      editor.timeline.updateTracks(this.savedTracks);
    }
  }
}
