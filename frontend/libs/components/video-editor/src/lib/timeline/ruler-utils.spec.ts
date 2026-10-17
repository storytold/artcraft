import { describe, expect, it } from "vitest";
import { formatRulerLabel, getRulerConfig, shouldShowLabel } from "./ruler-utils";

const fps = (numerator: number, denominator = 1) => ({ numerator, denominator });

describe("getRulerConfig", () => {
  it("uses frame-level ticks when zoomed far in", () => {
    // 100x zoom at 30 fps: 5000 px/s -> 166 px per frame
    const { labelIntervalSeconds, tickIntervalSeconds } = getRulerConfig({ zoomLevel: 100, fps: fps(30) });
    expect(labelIntervalSeconds).toBeCloseTo(2 / 30);
    expect(tickIntervalSeconds).toBeCloseTo(1 / 30);
  });

  it("uses whole-second intervals at normal zoom", () => {
    // zoom 1 => 50 px/s; a label needs 120 px, so the first multiplier that fits is 3 s
    const { labelIntervalSeconds, tickIntervalSeconds } = getRulerConfig({ zoomLevel: 1, fps: fps(30) });
    expect(labelIntervalSeconds).toBe(3);
    expect(tickIntervalSeconds).toBeLessThanOrEqual(labelIntervalSeconds);
  });

  it("widens the interval as the timeline zooms out", () => {
    const near = getRulerConfig({ zoomLevel: 1, fps: fps(30) }).labelIntervalSeconds;
    const far = getRulerConfig({ zoomLevel: 0.1, fps: fps(30) }).labelIntervalSeconds;
    expect(far).toBeGreaterThan(near);
  });

  it("falls back to 60 s when even the largest multiplier is too tight", () => {
    expect(getRulerConfig({ zoomLevel: 0.0001, fps: fps(30) }).labelIntervalSeconds).toBe(60);
  });

  it("always puts labels on tick positions, for any zoom and common frame rate", () => {
    const rates = [fps(24), fps(25), fps(30), fps(60), fps(30_000, 1_001), fps(24_000, 1_001)];
    for (const rate of rates) {
      for (const zoomLevel of [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100]) {
        const { labelIntervalSeconds, tickIntervalSeconds } = getRulerConfig({ zoomLevel, fps: rate });
        const ratio = labelIntervalSeconds / tickIntervalSeconds;
        expect(Math.abs(ratio - Math.round(ratio))).toBeLessThan(0.01);
        expect(tickIntervalSeconds).toBeGreaterThan(0);
      }
    }
  });
});

describe("shouldShowLabel", () => {
  it("is true on multiples of the interval", () => {
    expect(shouldShowLabel({ time: 0, labelIntervalSeconds: 5 })).toBe(true);
    expect(shouldShowLabel({ time: 10, labelIntervalSeconds: 5 })).toBe(true);
  });

  it("tolerates float error just below a multiple", () => {
    expect(shouldShowLabel({ time: 9.99999, labelIntervalSeconds: 5 })).toBe(true);
    expect(shouldShowLabel({ time: 10.00001, labelIntervalSeconds: 5 })).toBe(true);
  });

  it("is false between multiples", () => {
    expect(shouldShowLabel({ time: 7, labelIntervalSeconds: 5 })).toBe(false);
  });
});

describe("formatRulerLabel", () => {
  it("prints MM:SS on second boundaries", () => {
    expect(formatRulerLabel({ timeInSeconds: 0, fps: fps(30) })).toBe("00:00");
    expect(formatRulerLabel({ timeInSeconds: 65, fps: fps(30) })).toBe("01:05");
  });

  it("includes hours past one hour", () => {
    expect(formatRulerLabel({ timeInSeconds: 3725, fps: fps(30) })).toBe("1:02:05");
  });

  it("prints the frame number between seconds", () => {
    expect(formatRulerLabel({ timeInSeconds: 1.5, fps: fps(30) })).toBe("15f");
    expect(formatRulerLabel({ timeInSeconds: 2 + 1 / 24, fps: fps(24) })).toBe("1f");
  });

  it("treats a time a hair below a boundary as the boundary", () => {
    expect(formatRulerLabel({ timeInSeconds: 2.99999, fps: fps(30) })).toBe("00:03");
  });
});
