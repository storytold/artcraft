import type { GraphicStrokeAlign } from "./definitions/shared";

// applyAlignedStroke handles stroke alignment without having to construct
// inset/outset paths for each shape. The center case is straightforward;
// inside uses canvas clipping to mask the inner half of a doubled stroke,
// and outside renders onto a scratch canvas with composite-out to keep
// only the outer half (matching how Figma/Illustrator align strokes).

type GraphicRenderContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

function createTempCanvas({
  width,
  height,
}: {
  width: number;
  height: number;
}): OffscreenCanvas | HTMLCanvasElement {
  try {
    return new OffscreenCanvas(width, height);
  } catch {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
}

function applyStroke({
  ctx,
  path,
  strokeWidth,
  strokeColor,
}: {
  ctx: GraphicRenderContext;
  path: Path2D;
  strokeWidth: number;
  strokeColor: string;
}) {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.stroke(path);
}

export function applyAlignedStroke({
  ctx,
  path,
  strokeWidth,
  strokeAlign,
  strokeColor,
}: {
  ctx: GraphicRenderContext;
  path: Path2D;
  strokeWidth: number;
  strokeAlign: GraphicStrokeAlign;
  strokeColor: string;
}): void {
  if (strokeWidth <= 0) {
    return;
  }

  if (strokeAlign === "inside") {
    ctx.save();
    ctx.clip(path);
    applyStroke({
      ctx,
      path,
      strokeWidth: strokeWidth * 2,
      strokeColor,
    });
    ctx.restore();
    return;
  }

  if (strokeAlign === "outside") {
    const strokeCanvas = createTempCanvas({
      width: ctx.canvas.width,
      height: ctx.canvas.height,
    });
    const strokeCtx = strokeCanvas.getContext("2d") as GraphicRenderContext | null;
    if (!strokeCtx) {
      return;
    }

    applyStroke({
      ctx: strokeCtx,
      path,
      strokeWidth: strokeWidth * 2,
      strokeColor,
    });

    // Keep only the outer half of the doubled stroke so alpha fills do not
    // leave a visible inner stroke behind.
    strokeCtx.globalCompositeOperation = "destination-out";
    strokeCtx.fill(path);

    ctx.drawImage(strokeCanvas, 0, 0);
    return;
  }

  applyStroke({
    ctx,
    path,
    strokeWidth,
    strokeColor,
  });
}
