import type { MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real `../../wasm` loads a wasm module. These tests only start and tear
// down a resize (no mouse movement), so plain-number stand-ins for the few
// time helpers used while building the resize members are enough.
vi.mock("../../wasm", () => ({
  TICKS_PER_SECOND: 1000,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
  addMediaTime: ({ a, b }: { a: number; b: number }) => a + b,
  subMediaTime: ({ a, b }: { a: number; b: number }) => a - b,
  maxMediaTime: ({ a, b }: { a: number; b: number }) => Math.max(a, b),
  minMediaTime: ({ a, b }: { a: number; b: number }) => Math.min(a, b),
}));

// These modules pull in the wider editor (and wasm) just by being imported.
// They are only called while the mouse is moving, which these tests skip.
vi.mock("../group-resize", () => ({}));
vi.mock("../snapping", () => ({}));
vi.mock("../element-snap-source", () => ({}));
vi.mock("../playhead-snap-source", () => ({}));
vi.mock("../animation-snap-points", () => ({}));
vi.mock("../element-utils", () => ({ isRetimableElement: () => false }));

import { ResizeController, type ResizeConfig } from "./resize-controller";
import type { TimelineElement, TimelineTrack } from "../types";

// One video-ish element on the main track, starting at 0 and lasting 1s.
const element = {
  id: "el-1",
  startTime: 0,
  duration: 1000,
  trimStart: 0,
  trimEnd: 0,
  sourceDuration: undefined,
} as unknown as TimelineElement;
const track = { id: "main", elements: [element] } as unknown as TimelineTrack;

// Builds a controller whose config is made of spies, so each test can ask
// "which calls did the controller make?" without a real editor behind it.
function buildController() {
  const discardPreview = vi.fn();
  const onSnapPointChange = vi.fn();
  const config = {
    zoomLevel: 1,
    snappingEnabled: false,
    isShiftHeld: () => false,
    getSceneTracks: () => ({ overlay: [], main: track, audio: [] }),
    getCurrentPlayheadTime: () => 0,
    getActiveProjectFps: () => ({ numerator: 30, denominator: 1 }),
    selectedElements: [{ trackId: "main", elementId: "el-1" }],
    discardPreview,
    previewElements: vi.fn(),
    commitElements: vi.fn(),
    onSnapPointChange,
  } as unknown as ResizeConfig;
  const controller = new ResizeController({ configRef: { current: config } });
  return { controller, discardPreview, onSnapPointChange };
}

// A minimal stand-in for the React mouse event on the resize handle.
function fakeMouseDown(): ReactMouseEvent {
  return {
    clientX: 50,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ReactMouseEvent;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResizeController.destroy", () => {
  it("discards the live preview and clears the snap line when destroyed mid-resize", () => {
    const { controller, discardPreview, onSnapPointChange } =
      buildController();

    // Arrange: the user grabs the right edge of the clip.
    controller.onResizeStart({
      event: fakeMouseDown(),
      element,
      track,
      side: "right",
    });
    expect(controller.isResizing).toBe(true);
    // Forget the discard that onResizeStart does on its way in.
    discardPreview.mockClear();
    onSnapPointChange.mockClear();

    // Act: the timeline unmounts before the mouse button is released.
    controller.destroy();

    // Assert: the half-applied preview is thrown away (otherwise the next
    // commitPreview() from an unrelated tool would bake it into undo
    // history), the snap indicator is cleared and the session is over.
    expect(discardPreview).toHaveBeenCalledTimes(1);
    expect(onSnapPointChange).toHaveBeenCalledWith(null);
    expect(controller.isResizing).toBe(false);
  });

  it("does not discard anything when destroyed while idle", () => {
    const { controller, discardPreview, onSnapPointChange } =
      buildController();

    // React StrictMode runs mount -> cleanup -> mount in development, and
    // some other tool may own a preview, so an idle destroy must be a no-op.
    controller.destroy();

    expect(discardPreview).not.toHaveBeenCalled();
    expect(onSnapPointChange).not.toHaveBeenCalled();
  });
});
