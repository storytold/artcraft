
export const normalizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number): OffscreenCanvas => {
  const newCanvas = new OffscreenCanvas(width, height);
  newCanvas.width = width;
  newCanvas.height = height;

  const ctx = newCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get offscreen canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, width, height);
  return newCanvas;
}

export const drawAlphaMask = (canvas: OffscreenCanvas, width: number, height: number) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill the entire screen with black and composite to keep non-transparent pixels
  ctx.save();
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
