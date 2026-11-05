import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// PaintSurface drags in react-konva; only its two layer-id constants matter here.
vi.mock("../PaintSurface", () => ({ BG_LAYER_ID: "bg", DRAW_LAYER_ID: "draw" }));

import { captureStageEditsBitmap, useStageSnapshot } from "./useUpdateSnapshot";

let nextId = 1;
let pending: Map<number, FrameRequestCallback>;
let cancelled: number[];

beforeEach(() => {
  nextId = 1;
  pending = new Map();
  cancelled = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelled.push(id);
    pending.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Runs every callback currently queued (one "frame").
const runFrame = () => {
  const queued = [...pending.entries()];
  pending.clear();
  queued.forEach(([, cb]) => cb(0));
};

const refs = () => ({
  stageRef: { current: null } as never,
  imageRef: { current: null } as never,
  isSelectingRef: { current: false } as never,
  transformerRefs: { current: {} } as never,
});

describe("useStageSnapshot", () => {
  it("keeps one frame queued while mounted", () => {
    const r = refs();
    renderHook(() => useStageSnapshot(r.stageRef, r.imageRef, r.isSelectingRef, r.transformerRefs));
    runFrame();
    runFrame();
    expect(pending.size).toBe(1);
  });

  it("cancels the LATEST queued frame on unmount (the loop used to run forever)", () => {
    const r = refs();
    const { unmount } = renderHook(() =>
      useStageSnapshot(r.stageRef, r.imageRef, r.isSelectingRef, r.transformerRefs),
    );
    runFrame();
    runFrame();
    const latest = [...pending.keys()][0];
    unmount();
    expect(cancelled).toEqual([latest]);
    expect(pending.size).toBe(0);
  });

  it("does not re-render the host on every frame", () => {
    const r = refs();
    let renders = 0;
    renderHook(() => {
      renders++;
      useStageSnapshot(r.stageRef, r.imageRef, r.isSelectingRef, r.transformerRefs);
    });
    const before = renders;
    runFrame();
    runFrame();
    runFrame();
    expect(renders).toBe(before);
  });
});

describe("captureStageEditsBitmap", () => {
  it("returns undefined when there is no stage", async () => {
    expect(
      await captureStageEditsBitmap({ current: null } as never, { current: {} } as never),
    ).toBeUndefined();
  });
});
