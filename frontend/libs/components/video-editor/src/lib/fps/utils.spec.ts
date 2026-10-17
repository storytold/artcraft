import { describe, expect, it } from "vitest";
import {
  floatToFrameRate,
  frameRateToFloat,
  frameRatesEqual,
  getHighestImportedVideoFps,
  getRaisedProjectFpsForImportedMedia,
} from "./utils";

// Only `type` and `fps` matter to these helpers, so the tests build just those two fields.
const video = (fps: number | undefined) => ({ type: "video", fps }) as never;
const audio = (fps: number | undefined) => ({ type: "audio", fps }) as never;

describe("frameRateToFloat / frameRatesEqual", () => {
  it("divides numerator by denominator", () => {
    expect(frameRateToFloat({ numerator: 30_000, denominator: 1_001 })).toBeCloseTo(29.97, 2);
    expect(frameRateToFloat({ numerator: 24, denominator: 1 })).toBe(24);
  });

  it("compares the exact fraction, not the float value", () => {
    expect(
      frameRatesEqual({
        a: { numerator: 30, denominator: 1 },
        b: { numerator: 30, denominator: 1 },
      }),
    ).toBe(true);
    expect(
      frameRatesEqual({
        a: { numerator: 30, denominator: 1 },
        b: { numerator: 60, denominator: 2 },
      }),
    ).toBe(false);
  });
});

describe("floatToFrameRate", () => {
  it("snaps NTSC-style floats to the exact drop-frame fraction", () => {
    expect(floatToFrameRate(29.97)).toEqual({ numerator: 30_000, denominator: 1_001 });
    expect(floatToFrameRate(23.976)).toEqual({ numerator: 24_000, denominator: 1_001 });
    expect(floatToFrameRate(59.94)).toEqual({ numerator: 60_000, denominator: 1_001 });
  });

  it("returns standard integer rates unchanged", () => {
    expect(floatToFrameRate(24)).toEqual({ numerator: 24, denominator: 1 });
    expect(floatToFrameRate(60)).toEqual({ numerator: 60, denominator: 1 });
  });

  it("uses n/1 for a non-standard integer rate", () => {
    expect(floatToFrameRate(15)).toEqual({ numerator: 15, denominator: 1 });
  });

  it("reduces an arbitrary float to lowest terms", () => {
    const rate = floatToFrameRate(12.5);
    expect(rate).toEqual({ numerator: 25, denominator: 2 });
    expect(frameRateToFloat(rate)).toBe(12.5);
  });
});

describe("getHighestImportedVideoFps", () => {
  it("returns the largest video fps", () => {
    expect(getHighestImportedVideoFps({ mediaAssets: [video(24), video(60), video(30)] })).toBe(60);
  });

  it("ignores non-video assets and missing, zero or invalid fps", () => {
    expect(
      getHighestImportedVideoFps({
        mediaAssets: [audio(120), video(undefined), video(0), video(Number.NaN), video(25)],
      }),
    ).toBe(25);
  });

  it("returns null when nothing qualifies", () => {
    expect(getHighestImportedVideoFps({ mediaAssets: [] })).toBeNull();
    expect(getHighestImportedVideoFps({ mediaAssets: [audio(30)] })).toBeNull();
  });
});

describe("getRaisedProjectFpsForImportedMedia", () => {
  const current = { numerator: 30, denominator: 1 };

  it("raises the project rate when imported video is faster", () => {
    expect(
      getRaisedProjectFpsForImportedMedia({ currentFps: current, importedAssets: [video(60)] }),
    ).toEqual({ numerator: 60, denominator: 1 });
  });

  it("never lowers the project rate", () => {
    expect(
      getRaisedProjectFpsForImportedMedia({ currentFps: current, importedAssets: [video(24)] }),
    ).toBeNull();
    expect(
      getRaisedProjectFpsForImportedMedia({ currentFps: current, importedAssets: [video(30)] }),
    ).toBeNull();
  });

  it("does nothing when there is no usable video", () => {
    expect(
      getRaisedProjectFpsForImportedMedia({ currentFps: current, importedAssets: [audio(120)] }),
    ).toBeNull();
  });
});
