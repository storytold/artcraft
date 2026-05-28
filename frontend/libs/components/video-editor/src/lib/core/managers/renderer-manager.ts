import type { EditorCore } from "../index";

// Rendering subsystem (CanvasRenderer, SceneExporter, scene-builder,
// services/renderer node tree) has not yet been ported. This manager
// holds the renderTree reference + subscribe/notify so panels can
// register against it, but the actual snapshot/export operations
// throw until the renderer port lands.
//
// When the rendering port arrives, restore `saveSnapshot`,
// `copySnapshot`, and `exportProject` from OpenCut's
// renderer-manager.ts (the methods are mechanical orchestration
// over the CanvasRenderer/SceneExporter classes).

type SnapshotResult = { success: boolean; error?: string };

// Opaque placeholder until services/renderer/nodes/root-node lands.
type RootNode = unknown;

export interface ExportOptions {
  format: string;
  quality: number;
  fps?: number;
  includeAudio?: boolean;
}

export interface ExportResult {
  success: boolean;
  buffer?: ArrayBuffer;
  cancelled?: boolean;
  error?: string;
}

export class RendererManager {
  private renderTree: RootNode | null = null;
  private _isDegraded = false;
  private listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  get isDegraded(): boolean {
    return this._isDegraded;
  }

  setDegraded(degraded: boolean): void {
    if (this._isDegraded === degraded) return;
    this._isDegraded = degraded;
    this.notify();
  }

  setRenderTree({ renderTree }: { renderTree: RootNode | null }): void {
    this.renderTree = renderTree;
    this.notify();
  }

  getRenderTree(): RootNode | null {
    return this.renderTree;
  }

  async saveSnapshot(): Promise<SnapshotResult> {
    return {
      success: false,
      error: "Rendering subsystem not yet ported",
    };
  }

  async copySnapshot(): Promise<SnapshotResult> {
    return {
      success: false,
      error: "Rendering subsystem not yet ported",
    };
  }

  async exportProject(_args: {
    options: ExportOptions;
    onProgress?: ({ progress }: { progress: number }) => void;
    onCancel?: () => boolean;
  }): Promise<ExportResult> {
    return {
      success: false,
      error: "Rendering subsystem not yet ported",
    };
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
