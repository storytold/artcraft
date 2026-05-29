import type { EditorCore } from "../index";
import type { MediaAsset } from "../../media/types";
import { videoCache } from "../../services/video-cache";
import { waveformCache } from "../../services/waveform-cache";
import { BatchCommand } from "../../commands";
import { RemoveMediaAssetCommand } from "../../commands/media";

// MediaManager holds the active project's MediaAsset list in memory.
// In OpenCut this manager also wrote each asset to IndexedDB via
// storageService — that path is removed here per the host-routed
// persistence model: ProjectStorageAdapter saves the whole project
// (which embeds its media assets) on debounced flushes. Hosts that
// need finer-grained media persistence wire it through the adapter.

export class MediaManager {
  private assets: MediaAsset[] = [];
  private isLoading = false;
  private listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  // The asset's `id` is the caller-provided MediaHandle id. Pre-Phase-2
  // this was a generated UUID; now uploads go through MediaSourceAdapter
  // and the handle's id is the stable identifier the editor stores in
  // project state. Returns the existing entry (idempotent no-op) when
  // the asset id is already in the bin so re-imports of the same gallery
  // token don't produce duplicate rows.
  async addMediaAsset({
    asset,
  }: {
    projectId?: string;
    asset: MediaAsset;
  }): Promise<MediaAsset | null> {
    const existing = this.assets.find((a) => a.id === asset.id);
    if (existing) {
      return existing;
    }

    // Append and remember the insertion index so we can roll back to
    // exactly the appended entry on failure (filter-by-id would strip
    // any pre-existing duplicate too).
    const insertIndex = this.assets.length;
    this.assets = [...this.assets, asset];
    this.notify();

    try {
      this.editor.project.ratchetFpsForImportedMedia({
        importedAssets: [asset],
      });
      return asset;
    } catch (error) {
      console.error("Failed to register media asset:", error);
      this.assets = [
        ...this.assets.slice(0, insertIndex),
        ...this.assets.slice(insertIndex + 1),
      ];
      this.notify();
      this.editor.adapters.toast.error("Failed to add media", {
        description: error instanceof Error ? error.message : undefined,
      });
      return null;
    }
  }

  removeMediaAsset({ projectId, id }: { projectId: string; id: string }): void {
    this.removeMediaAssets({ projectId, ids: [id] });
  }

  removeMediaAssets({
    projectId,
    ids,
  }: {
    projectId: string;
    ids: string[];
  }): void {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return;
    }

    const command =
      uniqueIds.length === 1
        ? new RemoveMediaAssetCommand({
            projectId,
            assetId: uniqueIds[0],
          })
        : new BatchCommand(
            uniqueIds.map(
              (id) =>
                new RemoveMediaAssetCommand({
                  projectId,
                  assetId: id,
                }),
            ),
          );

    this.editor.command.execute({ command });
  }

  loadProjectMedia({ assets }: { assets: MediaAsset[] }): void {
    this.assets = assets;
    this.isLoading = false;
    this.notify();
  }

  clearProjectMedia(): void {
    waveformCache.clearAll();

    this.assets.forEach((asset) => {
      if (asset.url) {
        URL.revokeObjectURL(asset.url);
      }
      if (asset.thumbnailUrl) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
    });

    this.assets = [];
    this.notify();
  }

  clearAllAssets(): void {
    videoCache.clearAll();
    waveformCache.clearAll();

    this.assets.forEach((asset) => {
      if (asset.url) {
        URL.revokeObjectURL(asset.url);
      }
      if (asset.thumbnailUrl) {
        URL.revokeObjectURL(asset.thumbnailUrl);
      }
    });

    this.assets = [];
    this.notify();
  }

  getAssets(): MediaAsset[] {
    return this.assets;
  }

  setAssets({ assets }: { assets: MediaAsset[] }): void {
    this.assets = assets;
    this.notify();
  }

  isLoadingMedia(): boolean {
    return this.isLoading;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
