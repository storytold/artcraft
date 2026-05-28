import {
  getCompositorCanvas,
  getLastFrameProfile,
  initCompositor,
  releaseTexture,
  renderFrame,
  resizeCompositor,
  uploadTexture,
} from "opencut-wasm";
import {
  incrementCounter,
  isRenderPerfEnabled,
  recordWasmFrameProfile,
} from "../../../diagnostics/render-perf";
import type {
  ExternalTextureDescriptor,
  FrameDescriptor,
  RenderedTextureDescriptor,
  TextureUploadDescriptor,
} from "./types";

/**
 * One slot in the derived-texture cache. The OffscreenCanvas is persistent —
 * we reuse and redraw into it across frames, which is the change that takes
 * the WebGL upload path off the per-frame critical path for static content.
 */
type RenderedCacheEntry = {
  kind: "rendered";
  canvas: OffscreenCanvas;
  contentHash: string;
  width: number;
  height: number;
};

type ExternalCacheEntry = {
  kind: "external";
  source: CanvasImageSource;
  width: number;
  height: number;
};

class WasmCompositor {
  private canvas: HTMLCanvasElement | null = null;
  private initializedSize: { width: number; height: number } | null = null;
  private cache = new Map<string, RenderedCacheEntry | ExternalCacheEntry>();

  ensureInitialized({ width, height }: { width: number; height: number }) {
    if (!this.canvas) {
      initCompositor(width, height);
      this.canvas = getCompositorCanvas();
      this.initializedSize = { width, height };
      return;
    }

    if (
      !this.initializedSize ||
      this.initializedSize.width !== width ||
      this.initializedSize.height !== height
    ) {
      resizeCompositor(width, height);
      this.initializedSize = { width, height };
    }
  }

  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      throw new Error("Compositor is not initialized");
    }
    return this.canvas;
  }

  syncTextures(textures: TextureUploadDescriptor[]) {
    const nextIds = new Set(textures.map((texture) => texture.id));
    for (const previousId of this.cache.keys()) {
      if (!nextIds.has(previousId)) {
        releaseTexture(previousId);
        this.cache.delete(previousId);
      }
    }

    for (const texture of textures) {
      if (texture.kind === "external") {
        this.syncExternalTexture(texture);
      } else {
        this.syncRenderedTexture(texture);
      }
    }
  }

  render(frame: FrameDescriptor) {
    renderFrame(frame);
    if (isRenderPerfEnabled()) {
      recordWasmFrameProfile(
        getLastFrameProfile() as Array<{ name: string; durationMs: number }>,
      );
    }
  }

  private syncExternalTexture(texture: ExternalTextureDescriptor) {
    const previous = this.cache.get(texture.id);
    if (
      previous?.kind === "external" &&
      previous.source === texture.source &&
      previous.width === texture.width &&
      previous.height === texture.height
    ) {
      incrementCounter({ name: "textureCacheHit" });
      return;
    }

    incrementCounter({ name: "textureUpload" });
    incrementCounter({
      name: "textureUploadPixels",
      by: texture.width * texture.height,
    });
    uploadTexture({
      id: texture.id,
      source: ensureOffscreenCanvas({
        source: texture.source,
        width: texture.width,
        height: texture.height,
        label: `texture upload ${texture.id}`,
      }),
      width: texture.width,
      height: texture.height,
    });
    this.cache.set(texture.id, {
      kind: "external",
      source: texture.source,
      width: texture.width,
      height: texture.height,
    });
  }

  private syncRenderedTexture(texture: RenderedTextureDescriptor) {
    const previous = this.cache.get(texture.id);
    if (
      previous?.kind === "rendered" &&
      previous.contentHash === texture.contentHash &&
      previous.width === texture.width &&
      previous.height === texture.height
    ) {
      incrementCounter({ name: "textureCacheHit" });
      return;
    }

    const canvas =
      previous?.kind === "rendered" &&
      previous.width === texture.width &&
      previous.height === texture.height
        ? previous.canvas
        : createBackingCanvas({
            width: texture.width,
            height: texture.height,
          });

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(`Failed to get 2d context for texture ${texture.id}`);
    }
    ctx.clearRect(0, 0, texture.width, texture.height);
    texture.draw(ctx);

    incrementCounter({ name: "textureUpload" });
    incrementCounter({
      name: "textureUploadPixels",
      by: texture.width * texture.height,
    });
    uploadTexture({
      id: texture.id,
      source: canvas,
      width: texture.width,
      height: texture.height,
    });
    this.cache.set(texture.id, {
      kind: "rendered",
      canvas,
      contentHash: texture.contentHash,
      width: texture.width,
      height: texture.height,
    });
  }
}

export const wasmCompositor = new WasmCompositor();

function createBackingCanvas({
  width,
  height,
}: {
  width: number;
  height: number;
}): OffscreenCanvas {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("OffscreenCanvas is not supported in this environment");
  }
  return new OffscreenCanvas(width, height);
}

function ensureOffscreenCanvas({
  source,
  width,
  height,
  label,
}: {
  source: CanvasImageSource;
  width: number;
  height: number;
  label: string;
}): OffscreenCanvas {
  if (source instanceof OffscreenCanvas) {
    return source;
  }

  if (typeof OffscreenCanvas === "undefined") {
    throw new Error(`OffscreenCanvas is required for ${label}`);
  }

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(`Failed to get 2d context for ${label}`);
  }
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}
