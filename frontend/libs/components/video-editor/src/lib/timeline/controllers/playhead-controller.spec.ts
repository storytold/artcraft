import type { MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real `../../wasm` loads a wasm module. These tests never reach the
// time math (we make `getRulerEl` return null so `scrub()` exits early), so a
// tiny stand-in with just the constant the file imports is enough.
vi.mock("../../wasm", () => ({
  TICKS_PER_SECOND: 1000,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
  snapSeekMediaTime: ({ time }: { time: number }) => time,
}));

// The snap helpers pull in the whole editor core (and its wasm usage) just by
// being imported. They are only used while scrubbing over a real ruler, which
// these tests skip, so empty stand-ins are enough.
vi.mock("../snapping", () => ({}));
vi.mock("../bookmarks", () => ({}));
vi.mock("../element-snap-source", () => ({}));
vi.mock("../animation-snap-points", () => ({}));

import {
  PlayheadController,
  type PlayheadConfig,
} from "./playhead-controller";

// Builds a controller whose config is made of spies, so each test can ask
// "which calls did the controller make?" without a real editor behind it.
function buildController() {
  const setScrubbing = vi.fn();
  const seek = vi.fn();
  const config = {
    zoomLevel: 1,
    duration: 10_000,
    // null ruler => scrub() returns before doing any pixel/time math.
    getRulerEl: () => null,
    getRulerScrollEl: () => null,
    getTracksScrollEl: () => null,
    getPlayheadEl: () => null,
    getActiveProjectFps: () => ({ numerator: 30, denominator: 1 }),
    isShiftHeld: () => false,
    getIsPlaying: () => false,
    getSceneTracks: () => ({}),
    getSceneBookmarks: () => [],
    seek,
    setScrubbing,
    setTimelineViewState: vi.fn(),
  } as unknown as PlayheadConfig;
  const controller = new PlayheadController({ configRef: { current: config } });
  return { controller, setScrubbing };
}

// A minimal stand-in for the React mouse event the handle receives.
function fakeMouseDown(): ReactMouseEvent {
  return {
    button: 0,
    clientX: 100,
    target: null,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ReactMouseEvent;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PlayheadController.destroy", () => {
  it("clears the scrubbing flag when destroyed in the middle of a scrub", () => {
    const { controller, setScrubbing } = buildController();

    // Arrange: the user presses the playhead handle, so scrubbing starts.
    controller.onPlayheadMouseDown(fakeMouseDown());
    expect(setScrubbing.mock.calls).toEqual([[true]]);
    expect(controller.isActive).toBe(true);

    // Act: the timeline unmounts before the mouse button is released.
    controller.destroy();

    // Assert: the shared "is scrubbing" flag was turned back off. Without
    // this, audio playback stays muted on every later seek.
    expect(setScrubbing.mock.calls).toEqual([[true], [false]]);
    expect(controller.isActive).toBe(false);
  });

  it("does not touch the scrubbing flag when destroyed while idle", () => {
    const { controller, setScrubbing } = buildController();

    // React StrictMode runs mount -> cleanup -> mount in development, so
    // destroy() on a controller that never scrubbed must stay a no-op.
    controller.destroy();

    expect(setScrubbing).not.toHaveBeenCalled();
  });
});
