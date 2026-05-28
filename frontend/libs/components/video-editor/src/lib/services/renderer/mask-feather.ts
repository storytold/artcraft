import { gpuRenderer } from "./gpu-renderer";

export function applyMaskFeather({
  maskCanvas,
  width,
  height,
  feather,
}: {
  maskCanvas: OffscreenCanvas;
  width: number;
  height: number;
  feather: number;
}): OffscreenCanvas {
  return gpuRenderer.applyMaskFeather({
    maskCanvas,
    width,
    height,
    feather,
  });
}
