import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { MediaAsset } from "../../media/types";
import { buildWaveformSourceKey } from "../../media/waveform-summary";
import { videoCache } from "../../services/video-cache/service";
import { waveformCache } from "../../services/waveform-cache/service";
import { hasMediaId } from "../../timeline/element-utils";
import type { SceneTracks } from "../../timeline/types";

export class RemoveMediaAssetCommand extends Command {
  private savedAssets: MediaAsset[] | null = null;
  private savedTracks: SceneTracks | null = null;
  private removedAsset: MediaAsset | null = null;

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

    this.savedAssets = [...assets];
    this.savedTracks = editor.scenes.getActiveScene().tracks;

    this.removedAsset =
      assets.find((media: MediaAsset) => media.id === this.assetId) ?? null;

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

    if (this.savedAssets && this.removedAsset) {
      const restoredAsset: MediaAsset = {
        ...this.removedAsset,
        url: URL.createObjectURL(this.removedAsset.file),
      };

      editor.media.setAssets({
        assets: this.savedAssets.map((a) =>
          a.id === this.assetId ? restoredAsset : a,
        ),
      });

      // Persistence handled by host via ProjectStorageAdapter
    }

    if (this.savedTracks) {
      editor.timeline.updateTracks(this.savedTracks);
    }
  }
}
