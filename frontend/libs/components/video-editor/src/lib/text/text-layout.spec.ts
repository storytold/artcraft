import { describe, expect, it } from "vitest";
import { getTextBackgroundRect, getTextVisualRect, measureTextBlock } from "./layout";
import { buildTextFontString, measureTextLayout, quoteFontFamily, resolveTextLayout } from "./primitives";

const metrics = (width: number) => ({ width }) as TextMetrics;
const NO_BACKGROUND = { enabled: false, color: "#000000" };

describe("measureTextBlock", () => {
  it("uses the widest line and stacks line heights", () => {
    const block = measureTextBlock({ lineMetrics: [metrics(100), metrics(250), metrics(40)], lineHeightPx: 20 });
    expect(block).toEqual({ maxWidth: 250, height: 60, visualCenterOffset: 20 });
  });

  it("handles a single line", () => {
    expect(measureTextBlock({ lineMetrics: [metrics(80)], lineHeightPx: 30 })).toEqual({ maxWidth: 80, height: 30, visualCenterOffset: 0 });
  });
});

describe("text rectangles", () => {
  const block = { maxWidth: 200, height: 60, visualCenterOffset: 20 };

  it("anchors the rectangle by alignment", () => {
    const rect = (textAlign: "left" | "center" | "right") => getTextVisualRect({ textAlign, block, background: NO_BACKGROUND });
    expect(rect("left").left).toBe(0);
    expect(rect("center").left).toBe(-100);
    expect(rect("right").left).toBe(-200);
    expect(rect("center").top).toBe(-30);
  });

  it("has no background rect when the plate is off or transparent", () => {
    expect(getTextBackgroundRect({ textAlign: "center", block, background: NO_BACKGROUND })).toBeNull();
    expect(getTextBackgroundRect({ textAlign: "center", block, background: { enabled: true, color: "transparent" } })).toBeNull();
  });

  it("pads and offsets the background, scaled by the font ratio", () => {
    const rect = getTextBackgroundRect({
      textAlign: "center",
      block,
      background: { enabled: true, color: "#fff", paddingX: 10, paddingY: 5, offsetX: 3, offsetY: -2 },
      fontSizeRatio: 2,
    });
    expect(rect).toEqual({ left: -100 - 20 + 3, top: -30 - 10 - 2, width: 240, height: 80 });
  });

  it("grows the visual rect to include an offset background", () => {
    const visual = getTextVisualRect({
      textAlign: "center",
      block,
      background: { enabled: true, color: "#fff", paddingX: 0, paddingY: 0, offsetX: 50, offsetY: 0 },
    });
    expect(visual.left).toBe(-100);
    expect(visual.width).toBe(250);
  });
});

describe("text layout", () => {
  const base = { content: "a\nbb", fontSize: 45, fontFamily: 'My "Font"', fontWeight: "bold", fontStyle: "italic", textAlign: "center" } as const;

  it("scales the font with the canvas height and the 90 reference", () => {
    const layout = resolveTextLayout({ text: base, canvasHeight: 1080 });
    expect(layout.scaledFontSize).toBe(45 * (1080 / 90));
    expect(layout.fontSizeRatio).toBe(3);
  });

  it("quotes the font family and escapes quotes", () => {
    expect(quoteFontFamily({ fontFamily: 'My "Font"' })).toBe('"My \\"Font\\""');
    expect(buildTextFontString({ fontFamily: "Arial", fontWeight: "bold", fontStyle: "italic", scaledFontSize: 24 })).toBe(
      'italic bold 24px "Arial", sans-serif',
    );
  });

  it("measures one line per newline using the context", () => {
    const calls: string[] = [];
    const ctx = {
      save() {},
      restore() {},
      measureText(line: string) {
        calls.push(line);
        return { width: line.length * 10 } as TextMetrics;
      },
    } as unknown as CanvasRenderingContext2D;
    const layout = measureTextLayout({ text: base, canvasHeight: 90, ctx });
    expect(calls).toEqual(["a", "bb"]);
    expect(layout.block.maxWidth).toBe(20);
    expect(layout.block.height).toBe(2 * layout.lineHeightPx);
  });

  it("measures an empty string as one empty line", () => {
    const ctx = { save() {}, restore() {}, measureText: () => ({ width: 0 }) as TextMetrics } as unknown as CanvasRenderingContext2D;
    const layout = measureTextLayout({ text: { ...base, content: "" }, canvasHeight: 90, ctx });
    expect(layout.lines).toEqual([""]);
  });
});
