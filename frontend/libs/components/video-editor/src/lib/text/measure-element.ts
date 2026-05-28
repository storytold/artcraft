import { CORNER_RADIUS_MIN } from "./background";
import { DEFAULTS } from "../timeline/defaults";
import type { TextElement } from "../timeline/types";
import type { TextBackground } from "./background";
import { resolveNumberAtTime } from "../animation/values";
import {
  getTextVisualRect,
} from "./layout";
import {
  measureTextLayout,
  type MeasuredTextLayout,
  type TextAlign,
  type TextDecoration,
  type TextFontStyle,
  type TextFontWeight,
  type TextLayoutParams,
} from "./primitives";

// Whole-element text measurement that bridges the param storage (loose
// `{string: ParamValue}` map) to the typed TextLayoutParams shape the
// layout pipeline expects. Animation-aware: background padding/offset/
// corner-radius all resolve at `localTime` so an animated text plate
// reports the right visualRect for hit-testing during scrub.

export interface ResolvedTextBackground extends TextBackground {
  paddingX: number;
  paddingY: number;
  offsetX: number;
  offsetY: number;
  cornerRadius: number;
}

export interface MeasuredTextElement extends MeasuredTextLayout {
  resolvedBackground: ResolvedTextBackground;
  visualRect: { left: number; top: number; width: number; height: number };
}

let textMeasurementContext:
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D
  | null = null;

// Shared measurement context — reused across all measureTextElement
// calls so we don't create a canvas per measurement. Falls back from
// OffscreenCanvas (workers + main thread) to a hidden <canvas>.
export function getTextMeasurementContext():
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D {
  if (textMeasurementContext) {
    return textMeasurementContext;
  }

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext("2d");
    if (context) {
      textMeasurementContext = context;
      return context;
    }
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      textMeasurementContext = context;
      return context;
    }
  }

  throw new Error("Failed to create text measurement context");
}

export function measureTextElement({
  element,
  canvasHeight,
  localTime,
  ctx,
}: {
  element: TextElement;
  canvasHeight: number;
  localTime: number;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): MeasuredTextElement {
  const text = buildTextLayoutParamsFromElement({ element });
  const measuredLayout = measureTextLayout({
    text,
    canvasHeight,
    ctx,
  });

  const bg = buildTextBackgroundFromElement({ element });
  const resolvedBackground: ResolvedTextBackground = {
    ...bg,
    paddingX: resolveNumberAtTime({
      baseValue: bg.paddingX ?? DEFAULTS.text.background.paddingX,
      animations: element.animations,
      propertyPath: "background.paddingX",
      localTime,
    }),
    paddingY: resolveNumberAtTime({
      baseValue: bg.paddingY ?? DEFAULTS.text.background.paddingY,
      animations: element.animations,
      propertyPath: "background.paddingY",
      localTime,
    }),
    offsetX: resolveNumberAtTime({
      baseValue: bg.offsetX ?? DEFAULTS.text.background.offsetX,
      animations: element.animations,
      propertyPath: "background.offsetX",
      localTime,
    }),
    offsetY: resolveNumberAtTime({
      baseValue: bg.offsetY ?? DEFAULTS.text.background.offsetY,
      animations: element.animations,
      propertyPath: "background.offsetY",
      localTime,
    }),
    cornerRadius: resolveNumberAtTime({
      baseValue: bg.cornerRadius ?? CORNER_RADIUS_MIN,
      animations: element.animations,
      propertyPath: "background.cornerRadius",
      localTime,
    }),
  };

  const visualRect = getTextVisualRect({
    textAlign: text.textAlign,
    block: measuredLayout.block,
    background: resolvedBackground,
    fontSizeRatio: measuredLayout.fontSizeRatio,
  });

  return {
    ...measuredLayout,
    resolvedBackground,
    visualRect,
  };
}

export function buildTextLayoutParamsFromElement({
  element,
}: {
  element: TextElement;
}): TextLayoutParams {
  return {
    content: readStringParam({
      params: element.params,
      key: "content",
      fallback: "Default text",
    }),
    fontSize: readNumberParam({
      params: element.params,
      key: "fontSize",
      fallback: 15,
    }),
    fontFamily: readStringParam({
      params: element.params,
      key: "fontFamily",
      fallback: "Arial",
    }),
    fontWeight: readFontWeight({
      value: element.params.fontWeight,
      fallback: "normal",
    }),
    fontStyle: readFontStyle({
      value: element.params.fontStyle,
      fallback: "normal",
    }),
    textAlign: readTextAlign({
      value: element.params.textAlign,
      fallback: "center",
    }),
    textDecoration: readTextDecoration({
      value: element.params.textDecoration,
      fallback: "none",
    }),
    letterSpacing: readNumberParam({
      params: element.params,
      key: "letterSpacing",
      fallback: DEFAULTS.text.letterSpacing,
    }),
    lineHeight: readNumberParam({
      params: element.params,
      key: "lineHeight",
      fallback: DEFAULTS.text.lineHeight,
    }),
  };
}

export function buildTextBackgroundFromElement({
  element,
}: {
  element: TextElement;
}): TextBackground {
  return {
    enabled: readBooleanParam({
      params: element.params,
      key: "background.enabled",
      fallback: DEFAULTS.text.background.enabled,
    }),
    color: readStringParam({
      params: element.params,
      key: "background.color",
      fallback: DEFAULTS.text.background.color,
    }),
    cornerRadius: readNumberParam({
      params: element.params,
      key: "background.cornerRadius",
      fallback: DEFAULTS.text.background.cornerRadius,
    }),
    paddingX: readNumberParam({
      params: element.params,
      key: "background.paddingX",
      fallback: DEFAULTS.text.background.paddingX,
    }),
    paddingY: readNumberParam({
      params: element.params,
      key: "background.paddingY",
      fallback: DEFAULTS.text.background.paddingY,
    }),
    offsetX: readNumberParam({
      params: element.params,
      key: "background.offsetX",
      fallback: DEFAULTS.text.background.offsetX,
    }),
    offsetY: readNumberParam({
      params: element.params,
      key: "background.offsetY",
      fallback: DEFAULTS.text.background.offsetY,
    }),
  };
}

function readStringParam({
  params,
  key,
  fallback,
}: {
  params: TextElement["params"];
  key: string;
  fallback: string;
}): string {
  const value = params[key];
  return typeof value === "string" ? value : fallback;
}

function readNumberParam({
  params,
  key,
  fallback,
}: {
  params: TextElement["params"];
  key: string;
  fallback: number;
}): number {
  const value = params[key];
  return typeof value === "number" ? value : fallback;
}

function readBooleanParam({
  params,
  key,
  fallback,
}: {
  params: TextElement["params"];
  key: string;
  fallback: boolean;
}): boolean {
  const value = params[key];
  return typeof value === "boolean" ? value : fallback;
}

function readTextAlign({
  value,
  fallback,
}: {
  value: unknown;
  fallback: TextAlign;
}): TextAlign {
  return value === "left" || value === "center" || value === "right"
    ? value
    : fallback;
}

function readFontWeight({
  value,
  fallback,
}: {
  value: unknown;
  fallback: TextFontWeight;
}): TextFontWeight {
  return value === "bold" || value === "normal" ? value : fallback;
}

function readFontStyle({
  value,
  fallback,
}: {
  value: unknown;
  fallback: TextFontStyle;
}): TextFontStyle {
  return value === "italic" || value === "normal" ? value : fallback;
}

function readTextDecoration({
  value,
  fallback,
}: {
  value: unknown;
  fallback: TextDecoration;
}): TextDecoration {
  return value === "none" || value === "underline" || value === "line-through"
    ? value
    : fallback;
}
