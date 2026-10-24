import type { MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real `../../wasm` loads a wasm module. Plain-number stand-ins (1000
// ticks per second, every tick count already on a frame) are enough to drive
// a drag and read back the times it commits.
vi.mock("../../wasm", () => ({
  TICKS_PER_SECOND: 1000,
  ZERO_MEDIA_TIME: 0,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
  addMediaTime: ({ a, b }: { a: number; b: number }) => a + b,
  clampMediaTime: ({
    time,
    min,
    max,
  }: {
    time: number;
    min: number;
    max: number;
  }) => Math.max(min, Math.min(max, time)),
  roundFrameTicks: ({ ticks }: { ticks: number }) => ticks,
  snapSeekMediaTime: ({ time }: { time: number }) => time,
}));

// Pixel conversion is only used to draw the diamond while dragging.
vi.mock("../pixel-utils", () => ({ timelineTimeToSnappedPixels: () => 0 }));

// Looks keyframes up in a plain { keyframeId: time } table.
const keyframeTimes: Record<string, number> = {};
vi.mock("../../animation", () => ({
  getKeyframeById: ({ keyframeId }: { keyframeId: string }) =>
    keyframeId in keyframeTimes ? { time: keyframeTimes[keyframeId] } : null,
}));

// Records the target time instead of editing a real timeline.
vi.mock("../../commands/timeline", () => ({
  RetimeKeyframeCommand: class {
    constructor(
      public readonly args: { keyframeId: string; nextTime: number },
    ) {}
  },
}));
vi.mock("../../commands", () => ({
  BatchCommand: class {
    constructor(public readonly commands: unknown[]) {}
  },
}));

import {
  KeyframeDragController,
  type KeyframeDragConfig,
} from "./keyframe-drag-controller";
import type { SelectedKeyframeRef } from "../../animation/types";
import type { TimelineElement } from "../types";

// A 10 second clip with three keyframes on one property, 1 second apart.
const ELEMENT_DURATION = 10000;
const element = {
  id: "el-1",
  duration: ELEMENT_DURATION,
  animations: {},
} as unknown as TimelineElement;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("KeyframeDragController group drag", () => {
  it("keeps the spacing of a selected group when it is dragged past the end of the clip", () => {
    setKeyframeTimes({ a: 7000, b: 8000, c: 9000 });
    const { controller, executed } = buildController({
      selected: ["a", "b", "c"],
    });

    // Act: grab the middle keyframe and drag 5 seconds (250px) to the right,
    // which is far more room than the clip has left.
    dragRight({ controller, grabbed: ["b"], pixels: 250 });

    // Assert: the group stops when its last keyframe reaches the end of the
    // clip (+1s), so the 1 second gaps survive instead of all three keyframes
    // piling up on the final tick.
    expect(committedTimes(executed)).toEqual({
      a: 8000,
      b: 9000,
      c: 10000,
    });
  });

  it("keeps the spacing of a selected group when it is dragged before the start of the clip", () => {
    setKeyframeTimes({ a: 1000, b: 2000, c: 3000 });
    const { controller, executed } = buildController({
      selected: ["a", "b", "c"],
    });

    dragRight({ controller, grabbed: ["b"], pixels: -250 });

    expect(committedTimes(executed)).toEqual({ a: 0, b: 1000, c: 2000 });
  });

  it("moves a group by exactly the dragged distance when everything fits", () => {
    setKeyframeTimes({ a: 1000, b: 2000, c: 3000 });
    const { controller, executed } = buildController({
      selected: ["a", "b", "c"],
    });

    // 100px at 50px per second is 2 seconds.
    dragRight({ controller, grabbed: ["b"], pixels: 100 });

    expect(committedTimes(executed)).toEqual({ a: 3000, b: 4000, c: 5000 });
  });

  it("still clamps a single keyframe at the end of the clip", () => {
    setKeyframeTimes({ a: 9000 });
    const { controller, executed } = buildController({ selected: ["a"] });

    dragRight({ controller, grabbed: ["a"], pixels: 250 });

    expect(committedTimes(executed)).toEqual({ a: 10000 });
  });
});

function setKeyframeTimes(times: Record<string, number>) {
  for (const key of Object.keys(keyframeTimes)) delete keyframeTimes[key];
  Object.assign(keyframeTimes, times);
}

function ref(keyframeId: string): SelectedKeyframeRef {
  return {
    trackId: "t",
    elementId: "el-1",
    propertyPath: "opacity",
    keyframeId,
  } as unknown as SelectedKeyframeRef;
}

// Builds a controller whose config collects every command it executes.
function buildController({ selected }: { selected: string[] }) {
  const executed: unknown[] = [];
  const selectedKeyframes = selected.map(ref);
  const config = {
    zoomLevel: 1,
    getFps: () => ({ numerator: 30, denominator: 1 }),
    element,
    displayedStartTime: 0,
    selectedKeyframes,
    isKeyframeSelected: ({ keyframe }: { keyframe: SelectedKeyframeRef }) =>
      selected.includes(keyframe.keyframeId),
    setKeyframeSelection: vi.fn(),
    toggleKeyframeSelection: vi.fn(),
    selectKeyframeRange: vi.fn(),
    executeCommand: (command: unknown) => executed.push(command),
    seek: vi.fn(),
    getTotalDuration: () => ELEMENT_DURATION,
  } as unknown as KeyframeDragConfig;
  const controller = new KeyframeDragController({
    configRef: { current: config },
  });
  return { controller, executed };
}

// Presses on a keyframe, moves the mouse sideways and releases it.
function dragRight({
  controller,
  grabbed,
  pixels,
}: {
  controller: KeyframeDragController;
  grabbed: string[];
  pixels: number;
}) {
  controller.onKeyframeMouseDown({
    event: {
      clientX: 400,
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as ReactMouseEvent,
    keyframes: grabbed.map(ref),
  });
  // The first move only crosses the click-versus-drag threshold.
  document.dispatchEvent(new MouseEvent("mousemove", { clientX: 420 }));
  document.dispatchEvent(
    new MouseEvent("mousemove", { clientX: 400 + pixels }),
  );
  document.dispatchEvent(new MouseEvent("mouseup", { clientX: 400 + pixels }));
}

// Reads { keyframeId: nextTime } back from the executed command(s).
function committedTimes(executed: unknown[]): Record<string, number> {
  expect(executed).toHaveLength(1);
  const command = executed[0] as {
    commands?: { args: { keyframeId: string; nextTime: number } }[];
    args?: { keyframeId: string; nextTime: number };
  };
  const parts = command.commands ?? [command as { args: never }];
  return Object.fromEntries(
    parts.map(({ args }) => [args.keyframeId, args.nextTime]),
  );
}
