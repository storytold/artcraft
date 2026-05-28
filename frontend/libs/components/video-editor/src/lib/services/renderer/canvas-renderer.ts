import type { FrameRate } from "opencut-wasm";
import type { AnyBaseNode } from "./nodes/base-node";
import { createCanvasSurface } from "./canvas-utils";
import { buildFrameDescriptor } from "./compositor/frame-descriptor";
import { wasmCompositor } from "./compositor/wasm-compositor";
import { resolveRenderTree } from "./resolve";
import {
  measureSpanAsync,
  measureSpanSync,
  onRenderPerfFrameComplete,
} from "../../diagnostics/render-perf";

export type CanvasRendererParams = {
  width: number;
  height: number;
  fps: FrameRate;
};

export class CanvasRenderer {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  fps: FrameRate;

  constructor({ width, height, fps }: CanvasRendererParams) {
    this.width = width;
    this.height = height;
    this.fps = fps;

    const surface = createCanvasSurface({ width, height });
    this.canvas = surface.canvas;
    this.context = surface.context;
  }

  getOutputCanvas(): HTMLCanvasElement {
    wasmCompositor.ensureInitialized({
      width: this.width,
      height: this.height,
    });
    return wasmCompositor.getCanvas();
  }

  setSize({ width, height }: { width: number; height: number }) {
    this.width = width;
    this.height = height;

    const surface = createCanvasSurface({ width, height });
    this.canvas = surface.canvas;
    this.context = surface.context;
  }

  async render({ node, time }: { node: AnyBaseNode; time: number }) {
    await measureSpanAsync({
      name: "resolve",
      fn: () => resolveRenderTree({ node, renderer: this, time }),
    });
    const { frame, textures } = await measureSpanAsync({
      name: "buildFrame",
      fn: () => buildFrameDescriptor({ node, renderer: this }),
    });
    wasmCompositor.ensureInitialized({
      width: this.width,
      height: this.height,
    });
    measureSpanSync({
      name: "syncTextures",
      fn: () => wasmCompositor.syncTextures(textures),
    });
    measureSpanSync({
      name: "renderFrame",
      fn: () => wasmCompositor.render(frame),
    });
  }

  async renderToCanvas({
    node,
    time,
    targetCanvas,
  }: {
    node: AnyBaseNode;
    time: number;
    targetCanvas: HTMLCanvasElement;
  }) {
    await this.render({ node, time });

    const ctx = targetCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get target canvas context");
    }

    measureSpanSync({
      name: "drawImage",
      fn: () =>
        ctx.drawImage(
          wasmCompositor.getCanvas(),
          0,
          0,
          targetCanvas.width,
          targetCanvas.height,
        ),
    });
    onRenderPerfFrameComplete();
  }
}
