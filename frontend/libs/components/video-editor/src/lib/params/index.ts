import { converter, formatHex, formatHex8, parse } from "culori";
import { clamp, snapToStep } from "../utils/math";

export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, ParamValue>;

export type ParamGroup = "stroke";

export type ChannelValueKind = "scalar" | "discrete";
export type ChannelEasingMode = "independent" | "shared";

export interface LinearRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ChannelComponentDefinition<TKey extends string = string> {
  key: TKey;
  valueKind: ChannelValueKind;
  defaultInterpolation: "linear" | "hold";
}

export interface LeafChannelLayout<TValue extends ParamValue = ParamValue> {
  kind: "leaf";
  component: ChannelComponentDefinition<"value">;
  easingMode: "independent";
  decompose: (value: TValue) => { value: TValue };
  compose: (components: { value?: TValue }) => TValue | null;
}

export interface CompositeChannelLayout<
  TValue extends ParamValue = ParamValue,
  TComponents extends object = Record<string, ParamValue>,
> {
  kind: "composite";
  components: Array<ChannelComponentDefinition<keyof TComponents & string>>;
  easingMode: ChannelEasingMode;
  decompose: (value: TValue) => TComponents | null;
  compose: (components: Partial<TComponents>) => TValue | null;
}

export type ChannelLayout<
  TValue extends ParamValue = ParamValue,
  TComponents extends object = Record<string, ParamValue>,
> = LeafChannelLayout<TValue> | CompositeChannelLayout<TValue, TComponents>;

export type ParamChannelLayout =
  | LeafChannelLayout<number>
  | LeafChannelLayout<boolean>
  | LeafChannelLayout<string>
  | CompositeChannelLayout<string, LinearRgba>;

const toRgb = converter("rgb");

function srgbToLinear({ value }: { value: number }): number {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb({ value }: { value: number }): number {
  const clamped = clamp({ value, min: 0, max: 1 });
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

export function parseColorToLinearRgba({
  color,
}: {
  color: string;
}): LinearRgba | null {
  const parsed = parse(color);
  const rgb = parsed ? toRgb(parsed) : null;
  if (!rgb) {
    return null;
  }

  return {
    r: srgbToLinear({ value: rgb.r ?? 0 }),
    g: srgbToLinear({ value: rgb.g ?? 0 }),
    b: srgbToLinear({ value: rgb.b ?? 0 }),
    a: clamp({ value: rgb.alpha ?? 1, min: 0, max: 1 }),
  };
}

export function formatLinearRgba({
  color,
}: {
  color: LinearRgba;
}): string {
  const rgb: {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
    alpha: number;
  } = {
    mode: "rgb",
    r: linearToSrgb({ value: color.r }),
    g: linearToSrgb({ value: color.g }),
    b: linearToSrgb({ value: color.b }),
    alpha: clamp({ value: color.a, min: 0, max: 1 }),
  };
  return rgb.alpha < 1 ? formatHex8(rgb) : formatHex(rgb);
}

function createLeafChannelLayout<TValue extends ParamValue>({
  valueKind,
  defaultInterpolation,
}: {
  valueKind: ChannelValueKind;
  defaultInterpolation: "linear" | "hold";
}): LeafChannelLayout<TValue> {
  return {
    kind: "leaf",
    component: {
      key: "value",
      valueKind,
      defaultInterpolation,
    },
    easingMode: "independent",
    decompose: (value) => ({ value }),
    compose: ({ value }) => value ?? null,
  };
}

export const NUMBER_CHANNEL_LAYOUT: LeafChannelLayout<number> =
  createLeafChannelLayout<number>({
    valueKind: "scalar",
    defaultInterpolation: "linear",
  });

export const BOOLEAN_CHANNEL_LAYOUT: LeafChannelLayout<boolean> =
  createLeafChannelLayout<boolean>({
    valueKind: "discrete",
    defaultInterpolation: "hold",
  });

export const STRING_CHANNEL_LAYOUT: LeafChannelLayout<string> =
  createLeafChannelLayout<string>({
    valueKind: "discrete",
    defaultInterpolation: "hold",
  });

const colorComponent = (
  key: keyof LinearRgba,
): ChannelComponentDefinition<keyof LinearRgba> => ({
  key,
  valueKind: "scalar",
  defaultInterpolation: "linear",
});

export const COLOR_CHANNEL_LAYOUT: CompositeChannelLayout<string, LinearRgba> = {
  kind: "composite",
  components: [
    colorComponent("r"),
    colorComponent("g"),
    colorComponent("b"),
    colorComponent("a"),
  ],
  easingMode: "shared",
  decompose: (value) => parseColorToLinearRgba({ color: value }),
  compose: ({ r, g, b, a }) =>
    typeof r === "number" &&
    typeof g === "number" &&
    typeof b === "number" &&
    typeof a === "number"
      ? formatLinearRgba({ color: { r, g, b, a } })
      : null,
};

interface BaseParamDefinition<TKey extends string = string> {
  key: TKey;
  label: string;
  group?: ParamGroup;
  keyframable?: boolean;
  dependencies?: Array<{ param: string; equals: ParamValue }>;
}

export interface NumberParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "number";
  default: number;
  channels?: LeafChannelLayout<number>;
  min: number;
  max?: number;
  step: number;
  // When set, min/max/step are in display space. display = stored * displayMultiplier.
  displayMultiplier?: number;
  // Show as percentage of max. min/max/step/default stay in stored space.
  unit?: "percent";
  // Short label shown as the scrub-handle icon in the number field (e.g. "W", "R").
  shortLabel?: string;
}

export interface BooleanParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "boolean";
  default: boolean;
  channels?: LeafChannelLayout<boolean>;
}

export interface ColorParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "color";
  default: string;
  channels?: ChannelLayout<string, LinearRgba>;
}

export interface SelectParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "select";
  default: string;
  channels?: LeafChannelLayout<string>;
  options: Array<{ value: string; label: string }>;
}

export interface TextParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "text";
  default: string;
  channels?: LeafChannelLayout<string>;
}

export interface FontParamDefinition<TKey extends string = string>
  extends BaseParamDefinition<TKey> {
  type: "font";
  default: string;
  channels?: LeafChannelLayout<string>;
}

export type ParamDefinition<TKey extends string = string> =
  | NumberParamDefinition<TKey>
  | BooleanParamDefinition<TKey>
  | ColorParamDefinition<TKey>
  | SelectParamDefinition<TKey>
  | TextParamDefinition<TKey>
  | FontParamDefinition<TKey>;

export function getParamChannelLayout({
  param,
}: {
  param: ParamDefinition;
}): ParamChannelLayout {
  switch (param.type) {
    case "number":
      return param.channels ?? NUMBER_CHANNEL_LAYOUT;
    case "boolean":
      return param.channels ?? BOOLEAN_CHANNEL_LAYOUT;
    case "color":
      return param.channels ?? COLOR_CHANNEL_LAYOUT;
    case "select":
    case "text":
    case "font":
      return param.channels ?? STRING_CHANNEL_LAYOUT;
    default: {
      const exhaustive: never = param;
      return exhaustive;
    }
  }
}

export function getParamValueKind({
  param,
}: {
  param: ParamDefinition;
}): "number" | "color" | "discrete" {
  const layout = getParamChannelLayout({ param });
  if (layout.kind === "composite") {
    return "color";
  }
  if (layout.component.valueKind === "scalar") {
    return "number";
  }
  return "discrete";
}

export function getParamDefaultInterpolation({
  param,
}: {
  param: ParamDefinition;
}): "linear" | "hold" {
  const layout = getParamChannelLayout({ param });
  if (layout.kind === "leaf") {
    return layout.component.defaultInterpolation;
  }
  return layout.components[0]?.defaultInterpolation ?? "linear";
}

export function getParamNumericRange({
  param,
}: {
  param: ParamDefinition;
}): { min?: number; max?: number; step?: number } | undefined {
  if (param.type !== "number") {
    return undefined;
  }

  return {
    min: param.min,
    max: param.max,
    step: param.step,
  };
}

export function coerceParamValue({
  param,
  value,
}: {
  param: ParamDefinition;
  value: unknown;
}): ParamValue | null {
  switch (param.type) {
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return null;
      }

      const steppedValue = snapToStep({ value, step: param.step });
      const maxValue = param.max ?? Number.POSITIVE_INFINITY;
      return Math.min(maxValue, Math.max(param.min, steppedValue));
    }
    case "boolean":
      return typeof value === "boolean" ? value : null;
    case "color":
    case "text":
    case "font":
      return typeof value === "string" ? value : null;
    case "select":
      return typeof value === "string" &&
        param.options.some((option) => option.value === value)
        ? value
        : null;
    default: {
      const exhaustive: never = param;
      return exhaustive;
    }
  }
}
