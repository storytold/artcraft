export function createCanvasSurface({
  width,
  height,
}: {
  width: number;
  height: number;
}): {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
} {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create 2D rendering context");
  }
  return { canvas, context };
}
