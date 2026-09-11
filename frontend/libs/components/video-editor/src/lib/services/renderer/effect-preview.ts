import { createCanvasSurface } from "./canvas-utils";
import { effectsRegistry, resolveEffectPasses } from "../../effects";
import { buildDefaultParamValues } from "../../params/registry";
import type { ParamValues } from "../../params";
import { gpuRenderer } from "./gpu-renderer";

const PREVIEW_SIZE = 160;
const PREVIEW_IMAGE_PATH = "/effects/preview.jpg";

class EffectPreviewService {
  private testSourceCanvas: OffscreenCanvas | null = null;
  private previewImageElement: HTMLImageElement | null = null;
  private onReadyCallbacks = new Set<() => void>();

  readonly PREVIEW_SIZE = PREVIEW_SIZE;

  constructor() {
    this.loadPreviewImage();
  }

  onPreviewImageReady({ callback }: { callback: () => void }): () => void {
    this.onReadyCallbacks.add(callback);
    return () => this.onReadyCallbacks.delete(callback);
  }

  renderPreview({
    effectType,
    params,
    targetCanvas,
    uniformDimensions,
  }: {
    effectType: string;
    params: ParamValues;
    targetCanvas: HTMLCanvasElement;
    uniformDimensions?: { width: number; height: number };
  }): void {
    const size = PREVIEW_SIZE;
    const targetCtx = targetCanvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D | null;
    if (!targetCtx) {
      return;
    }

    targetCanvas.width = size;
    targetCanvas.height = size;

    const source = this.getTestSource({ width: size, height: size });
    if (!source) {
      targetCtx.clearRect(0, 0, size, size);
      return;
    }

    try {
      const definition = effectsRegistry.get(effectType);
      const resolvedParams =
        Object.keys(params).length > 0
          ? params
          : buildDefaultParamValues(definition.params);

      const passes = resolveEffectPasses({
        definition,
        effectParams: resolvedParams,
        width: uniformDimensions?.width ?? size,
        height: uniformDimensions?.height ?? size,
      });
      const result = this.applyGpuEffect({
        source,
        width: size,
        height: size,
        passes,
      });

      targetCtx.drawImage(result, 0, 0, size, size);
    } catch (error) {
      console.warn("Failed to render effect preview", { effectType, error });
      targetCtx.clearRect(0, 0, size, size);
      targetCtx.drawImage(source, 0, 0, size, size);
    }
  }

  private loadPreviewImage(): void {
    if (typeof window === "undefined") return;
    const image = new Image();
    image.onload = () => {
      this.testSourceCanvas = null;
      for (const callback of this.onReadyCallbacks) {
        callback();
      }
    };
    image.src = PREVIEW_IMAGE_PATH;
    this.previewImageElement = image;
  }

  private createTestSource({
    width,
    height,
  }: {
    width: number;
    height: number;
  }): OffscreenCanvas | null {
    const isImageReady =
      this.previewImageElement?.complete &&
      (this.previewImageElement.naturalWidth ?? 0) > 0;
    if (!isImageReady || !this.previewImageElement) {
      return null;
    }

    const { canvas, context } = createCanvasSurface({ width, height });
    context.drawImage(this.previewImageElement, 0, 0, width, height);
    return canvas;
  }

  private getTestSource({
    width,
    height,
  }: {
    width: number;
    height: number;
  }): OffscreenCanvas | null {
    if (
      !this.testSourceCanvas ||
      this.testSourceCanvas.width !== width ||
      this.testSourceCanvas.height !== height
    ) {
      this.testSourceCanvas = this.createTestSource({ width, height });
    }
    return this.testSourceCanvas;
  }

  private applyGpuEffect({
    source,
    width,
    height,
    passes,
  }: {
    source: OffscreenCanvas;
    width: number;
    height: number;
    passes: ReturnType<typeof resolveEffectPasses>;
  }): OffscreenCanvas {
    return gpuRenderer.applyEffect({
      source,
      width,
      height,
      passes,
    });
  }
}

export const effectPreviewService = new EffectPreviewService();
