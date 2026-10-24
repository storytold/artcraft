import { describe, expect, it } from "vitest";
import { drawCssBackground } from "./canvas";
import { patternCraftGradients } from "../data/colors/pattern-craft";
import { syntaxUIGradients } from "../data/colors/syntax-ui";

// Spec for the background swatches that ship in the editor's colour picker. The picker paints each swatch with real CSS,
// and the export paints the same string with the hand-written parser and canvas painter. A string the painter can't
// handle either throws (the export fails) or silently paints something else (the export doesn't match the swatch).
// canvas.spec.ts covers the geometry with hand-made strings; this file runs the strings the app actually ships.

type Recorded = {
  // Every gradient the painter created: its arguments and the colour stops it added.
  gradients: Array<{ kind: string; args: number[]; stops: Array<[number, string]> }>;
  // Every solid fillStyle the painter set (gradient objects are not strings and are left out).
  solidFills: string[];
};

// A canvas context that records what the painter asks of it and, like a real canvas, rejects the values a real canvas
// rejects: a non-finite number in a gradient call and a stop offset outside 0..1 both throw in Chromium and WebKit.
function recordingContext(): { ctx: CanvasRenderingContext2D; recorded: Recorded } {
  const recorded: Recorded = { gradients: [], solidFills: [] };
  const checkFinite = (args: number[]) => {
    args.forEach((value) => {
      if (!Number.isFinite(value)) throw new TypeError(`non-finite gradient argument: ${args.join(",")}`);
    });
  };
  const makeGradient = (kind: string, args: number[]) => {
    checkFinite(args);
    const call = { kind, args, stops: [] as Array<[number, string]> };
    recorded.gradients.push(call);
    return {
      addColorStop: (offset: number, color: string) => {
        if (!(offset >= 0 && offset <= 1)) throw new RangeError(`stop offset out of range: ${offset}`);
        call.stops.push([offset, color]);
      },
    };
  };
  let fillStyle: unknown = "";
  const ctx = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: unknown) {
      fillStyle = value;
      if (typeof value === "string") recorded.solidFills.push(value);
    },
    fillRect: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
    createLinearGradient: (...args: number[]) => makeGradient("linear", args),
    createRadialGradient: (...args: number[]) => makeGradient("radial", args),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, recorded };
}

// The comma-separated layers of a CSS background, split at top-level commas only.
function topLevelLayers(css: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of css) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) layers.push(current.trim());
  return layers;
}

const isGradientLayer = (layer: string) => /^(repeating-)?(linear|radial)-gradient\(/i.test(layer);

// A solid colour the browser accepts for fillStyle: hex, rgb()/rgba()/hsl()/hsla() or a plain keyword.
const isSolidColour = (value: string) =>
  /^#[0-9a-f]{3,8}$/i.test(value) || /^(rgb|hsl)a?\([^)]*\)$/i.test(value) || /^[a-z]+$/i.test(value);

const shipped: Array<[string, string]> = [
  ...patternCraftGradients.map((css, index): [string, string] => [`pattern craft #${index + 1}`, css]),
  ...syntaxUIGradients.map((css, index): [string, string] => [`syntax ui #${index + 1}`, css]),
];

describe("shipped background swatches", () => {
  it("ships swatches to check", () => {
    expect(shipped.length).toBeGreaterThan(20);
  });

  it.each(shipped)("paints %s without throwing", (_name, css) => {
    const { ctx } = recordingContext();
    expect(() => drawCssBackground({ ctx, width: 1920, height: 1080, css })).not.toThrow();
  });

  it.each(shipped)("paints every gradient layer of %s as a gradient", (_name, css) => {
    const { ctx, recorded } = recordingContext();
    drawCssBackground({ ctx, width: 1920, height: 1080, css });
    const layers = topLevelLayers(css);
    const expectedGradients = layers.filter(isGradientLayer).length;
    // A gradient layer the parser couldn't read would fall back to a string fill that canvas ignores.
    expect(recorded.gradients.length).toBe(expectedGradients);
    // The remaining layers are solid colours; each one must be a colour canvas accepts.
    const stringFills = recorded.solidFills.filter((fill) => fill !== "");
    expect(stringFills.length).toBe(layers.length - expectedGradients);
    stringFills.forEach((fill) => expect(isSolidColour(fill)).toBe(true));
  });

  it.each(shipped)("gives every stop of %s a colour canvas accepts", (_name, css) => {
    const { ctx, recorded } = recordingContext();
    drawCssBackground({ ctx, width: 1920, height: 1080, css });
    recorded.gradients.forEach((gradient) =>
      gradient.stops.forEach(([, colour]) => expect(isSolidColour(colour)).toBe(true)),
    );
  });
});
