import { describe, expect, it, vi } from "vitest";

// The real `../wasm` reads TICKS_PER_SECOND from the wasm module; use a fixed
// value so these pure-math tests do not depend on loading it.
vi.mock("../wasm", () => ({
  TICKS_PER_SECOND: 1000,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
}));

import { getMouseTimeFromClientX } from "./drag-utils";
import {
  getCenteredLineLeft,
  getTimelinePixelsPerSecond,
  snapPixelToDeviceGrid,
  timelineTimeToPixels,
  timelineTimeToSnappedPixels,
} from "./pixel-utils";
import { TIMELINE_ZOOM_MAX } from "./scale";
import {
  getTimelinePaddingPx,
  getTimelineZoomMin,
  getZoomPercent,
  sliderToZoom,
  zoomToSlider,
} from "./zoom-utils";

describe("pixel-utils", () => {
  it("scales pixels per second by zoom (base is 50 px/s)", () => {
    expect(getTimelinePixelsPerSecond({ zoomLevel: 1 })).toBe(50);
    expect(getTimelinePixelsPerSecond({ zoomLevel: 2 })).toBe(100);
  });

  it("converts ticks to pixels", () => {
    // 2 seconds (2000 ticks at the mocked 1000/s) at 50 px/s
    expect(timelineTimeToPixels({ time: 2000, zoomLevel: 1 })).toBe(100);
  });

  it("snaps to the device pixel grid", () => {
    expect(snapPixelToDeviceGrid({ pixel: 10.3, devicePixelRatio: 1 })).toBe(10);
    expect(snapPixelToDeviceGrid({ pixel: 10.3, devicePixelRatio: 2 })).toBe(10.5);
  });

  it("falls back to a ratio of 1 for invalid device pixel ratios", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(snapPixelToDeviceGrid({ pixel: 10.4, devicePixelRatio: bad })).toBe(
        snapPixelToDeviceGrid({ pixel: 10.4, devicePixelRatio: window.devicePixelRatio || 1 }),
      );
    }
  });

  it("combines time conversion and snapping", () => {
    expect(timelineTimeToSnappedPixels({ time: 2010, zoomLevel: 1, devicePixelRatio: 1 })).toBe(100);
  });

  it("centers a line on a pixel", () => {
    expect(getCenteredLineLeft({ centerPixel: 100 })).toBe(99);
    expect(getCenteredLineLeft({ centerPixel: 100, lineWidthPx: 10 })).toBe(95);
  });
});

describe("drag-utils getMouseTimeFromClientX", () => {
  const rect = { left: 100 } as DOMRect;

  it("maps pointer x to ticks, including scroll offset", () => {
    // x = 250 - 100 + 0 = 150 px -> 3 s at 50 px/s -> 3000 ticks
    expect(getMouseTimeFromClientX({ clientX: 250, containerRect: rect, zoomLevel: 1, scrollLeft: 0 })).toBe(3000);
    expect(getMouseTimeFromClientX({ clientX: 250, containerRect: rect, zoomLevel: 1, scrollLeft: 50 })).toBe(4000);
  });

  it("never returns negative time", () => {
    expect(getMouseTimeFromClientX({ clientX: 0, containerRect: rect, zoomLevel: 1, scrollLeft: 0 })).toBe(0);
  });
});

describe("zoom-utils", () => {
  it("round-trips slider <-> zoom", () => {
    const minZoom = 0.5;
    for (const p of [0, 0.25, 0.5, 1]) {
      expect(zoomToSlider({ zoomLevel: sliderToZoom({ sliderPosition: p, minZoom }), minZoom })).toBeCloseTo(p);
    }
  });

  it("hits the endpoints and clamps out-of-range input", () => {
    expect(sliderToZoom({ sliderPosition: 0, minZoom: 1 })).toBe(1);
    expect(sliderToZoom({ sliderPosition: 1, minZoom: 1 })).toBeCloseTo(TIMELINE_ZOOM_MAX);
    expect(sliderToZoom({ sliderPosition: 5, minZoom: 1 })).toBeCloseTo(TIMELINE_ZOOM_MAX);
    expect(sliderToZoom({ sliderPosition: -5, minZoom: 1 })).toBe(1);
    expect(zoomToSlider({ zoomLevel: 1000, minZoom: 1 })).toBeCloseTo(1);
    expect(zoomToSlider({ zoomLevel: 0.001, minZoom: 1 })).toBe(0);
  });

  it("reports zoom percent between min and max", () => {
    expect(getZoomPercent({ zoomLevel: 1, minZoom: 1 })).toBe(0);
    expect(getZoomPercent({ zoomLevel: TIMELINE_ZOOM_MAX, minZoom: 1 })).toBe(1);
  });

  it("computes a min zoom that fits the clip and never exceeds the max", () => {
    // 10 s clip in a 1000 px container: 25% of the width (250 px) / (10 s * 50) = 0.5
    expect(getTimelineZoomMin({ duration: 10_000, containerWidth: 1000 })).toBeCloseTo(0.5);
    expect(getTimelineZoomMin({ duration: 10_000, containerWidth: null })).toBeCloseTo(0.5);
    expect(getTimelineZoomMin({ duration: 0, containerWidth: 1e9 })).toBe(TIMELINE_ZOOM_MAX);
  });

  it("shrinks padding from 75% to 15% of the container as zoom increases", () => {
    expect(getTimelinePaddingPx({ containerWidth: 1000, zoomLevel: 1, minZoom: 1 })).toBeCloseTo(750);
    expect(getTimelinePaddingPx({ containerWidth: 1000, zoomLevel: TIMELINE_ZOOM_MAX, minZoom: 1 })).toBeCloseTo(150);
  });
});
