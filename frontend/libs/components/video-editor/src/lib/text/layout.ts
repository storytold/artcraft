import type { TextBackground } from "./background";
import { DEFAULTS } from "../timeline/defaults";
import type { TextAlign } from "./primitives";

// Lower-level text geometry: measurement, background rect, decoration
// drawing. The higher-level layout pipeline (resolveTextLayout →
// measureTextLayout → drawMeasuredTextLayout) lives in
// text/primitives.ts. These two files are mutually-recursive at the
// type level (layout exposes TextCanvasContext + TextBlockMeasurement;
// primitives exposes TextAlign) but neither calls the other at
// runtime, so the import cycle resolves cleanly.

type TextRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface TextBlockMeasurement {
  visualCenterOffset: number;
  height: number;
  maxWidth: number;
}

export type TextCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

const TEXT_DECORATION_THICKNESS_RATIO = 0.07;
const STRIKETHROUGH_VERTICAL_RATIO = 0.35;

export function setCanvasLetterSpacing({
  ctx,
  letterSpacingPx,
}: {
  ctx: TextCanvasContext;
  letterSpacingPx: number;
}): void {
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${letterSpacingPx}px`;
  }
}

export function getMetricAscent({
  metrics,
  fallbackFontSize,
}: {
  metrics: TextMetrics;
  fallbackFontSize: number;
}): number {
  return metrics.actualBoundingBoxAscent ?? fallbackFontSize * 0.8;
}

export function getMetricDescent({
  metrics,
  fallbackFontSize,
}: {
  metrics: TextMetrics;
  fallbackFontSize: number;
}): number {
  return metrics.actualBoundingBoxDescent ?? fallbackFontSize * 0.2;
}

export function measureTextBlock({
  lineMetrics,
  lineHeightPx,
}: {
  lineMetrics: TextMetrics[];
  lineHeightPx: number;
}): TextBlockMeasurement {
  let maxWidth = 0;

  for (const metrics of lineMetrics) {
    maxWidth = Math.max(maxWidth, metrics.width);
  }

  const lineCount = lineMetrics.length;
  const height = lineCount * lineHeightPx;
  const visualCenterOffset = ((lineCount - 1) * lineHeightPx) / 2;

  return { visualCenterOffset, height, maxWidth };
}

function getTextRect({
  textAlign,
  block,
}: {
  textAlign: TextAlign;
  block: TextBlockMeasurement;
}): TextRect {
  const textAlignToLeft: Record<typeof textAlign, number> = {
    left: 0,
    right: -block.maxWidth,
    center: -block.maxWidth / 2,
  };
  const left = textAlignToLeft[textAlign];

  return {
    left,
    top: -block.height / 2,
    width: block.maxWidth,
    height: block.height,
  };
}

function isTextBackgroundVisible({
  background,
}: {
  background: TextBackground;
}): boolean {
  return (
    background.enabled &&
    Boolean(background.color) &&
    background.color !== "transparent"
  );
}

export function getTextBackgroundRect({
  textAlign,
  block,
  background,
  fontSizeRatio = 1,
}: {
  textAlign: TextAlign;
  block: TextBlockMeasurement;
  background: TextBackground;
  fontSizeRatio?: number;
}): TextRect | null {
  if (!isTextBackgroundVisible({ background })) {
    return null;
  }

  const textRect = getTextRect({ textAlign, block });
  const paddingX =
    (background.paddingX ?? DEFAULTS.text.background.paddingX) * fontSizeRatio;
  const paddingY =
    (background.paddingY ?? DEFAULTS.text.background.paddingY) * fontSizeRatio;
  const offsetX = background.offsetX ?? DEFAULTS.text.background.offsetX;
  const offsetY = background.offsetY ?? DEFAULTS.text.background.offsetY;

  return {
    left: textRect.left - paddingX + offsetX,
    top: textRect.top - paddingY + offsetY,
    width: textRect.width + paddingX * 2,
    height: textRect.height + paddingY * 2,
  };
}

export function getTextVisualRect({
  textAlign,
  block,
  background,
  fontSizeRatio = 1,
}: {
  textAlign: TextAlign;
  block: TextBlockMeasurement;
  background: TextBackground;
  fontSizeRatio?: number;
}): TextRect {
  const textRect = getTextRect({ textAlign, block });
  const backgroundRect = getTextBackgroundRect({
    textAlign,
    block,
    background,
    fontSizeRatio,
  });

  if (!backgroundRect) {
    return textRect;
  }

  const left = Math.min(textRect.left, backgroundRect.left);
  const top = Math.min(textRect.top, backgroundRect.top);
  const right = Math.max(
    textRect.left + textRect.width,
    backgroundRect.left + backgroundRect.width,
  );
  const bottom = Math.max(
    textRect.top + textRect.height,
    backgroundRect.top + backgroundRect.height,
  );

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

export function drawTextDecoration({
  ctx,
  textDecoration,
  lineWidth,
  lineY,
  metrics,
  scaledFontSize,
  textAlign,
}: {
  ctx: TextCanvasContext;
  textDecoration: string;
  lineWidth: number;
  lineY: number;
  metrics: TextMetrics;
  scaledFontSize: number;
  textAlign: CanvasTextAlign;
}): void {
  if (textDecoration === "none" || !textDecoration) return;

  const thickness = Math.max(
    1,
    scaledFontSize * TEXT_DECORATION_THICKNESS_RATIO,
  );
  const ascent = getMetricAscent({ metrics, fallbackFontSize: scaledFontSize });
  const descent = getMetricDescent({
    metrics,
    fallbackFontSize: scaledFontSize,
  });

  let xStart = -lineWidth / 2;
  if (textAlign === "left") xStart = 0;
  if (textAlign === "right") xStart = -lineWidth;

  if (textDecoration === "underline") {
    const underlineY = lineY + descent + thickness;
    ctx.fillRect(xStart, underlineY, lineWidth, thickness);
  }

  if (textDecoration === "line-through") {
    const strikeY = lineY - (ascent - descent) * STRIKETHROUGH_VERTICAL_RATIO;
    ctx.fillRect(xStart, strikeY, lineWidth, thickness);
  }
}
