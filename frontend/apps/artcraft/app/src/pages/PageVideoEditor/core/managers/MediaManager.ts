import type { VideoEditorCore } from "../EditorCore";
import type { MediaAsset } from "../../types";

let nextId = 1;
const generateId = () => `media-${nextId++}-${Date.now()}`;

export class MediaManager {
  private assets: MediaAsset[] = [];
  private listeners = new Set<() => void>();

  constructor(private editor: VideoEditorCore) {
    void this.editor;
  }

  addMediaAsset({ asset }: { asset: Omit<MediaAsset, "id"> }): MediaAsset {
    const newAsset: MediaAsset = { ...asset, id: generateId() };
    this.assets = [...this.assets, newAsset];
    this.notify();
    return newAsset;
  }

  removeMediaAsset({ id }: { id: string }): void {
    const asset = this.assets.find((a) => a.id === id);
    if (asset?.url) URL.revokeObjectURL(asset.url);
    if (asset?.thumbnailUrl) URL.revokeObjectURL(asset.thumbnailUrl);
    this.assets = this.assets.filter((a) => a.id !== id);
    this.notify();
  }

  getAssets(): MediaAsset[] {
    return this.assets;
  }

  getAssetById(id: string): MediaAsset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  clearAllAssets(): void {
    this.assets.forEach((asset) => {
      if (asset.url) URL.revokeObjectURL(asset.url);
      if (asset.thumbnailUrl) URL.revokeObjectURL(asset.thumbnailUrl);
    });
    this.assets = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
