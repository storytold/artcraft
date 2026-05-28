import type { EditorCore } from "../index";
import type { MediaAsset } from "../../media/types";
import { generateUUID } from "../../utils/id";
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

  async addMediaAsset({
    asset,
  }: {
    projectId?: string;
    asset: Omit<MediaAsset, "id">;
  }): Promise<MediaAsset | null> {
    const newAsset: MediaAsset = {
      ...asset,
      id: generateUUID(),
    };

    this.assets = [...this.assets, newAsset];
    this.notify();

    try {
      this.editor.project.ratchetFpsForImportedMedia({
        importedAssets: [newAsset],
      });
      return newAsset;
    } catch (error) {
      console.error("Failed to register media asset:", error);
      this.assets = this.assets.filter((asset) => asset.id !== newAsset.id);
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
