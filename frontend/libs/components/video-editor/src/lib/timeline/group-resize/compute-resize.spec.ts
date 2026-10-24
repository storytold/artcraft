import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds, TICKS_PER_SECOND } from "../../wasm";
import { computeGroupResize } from "./compute-resize";
import type { GroupResizeMember } from "./types";

// Spec for the group-resize solver: how far a multi-clip edge drag may go, and
// the trim/start/duration values each clip gets afterwards.

const fps = { numerator: 30, denominator: 1 };
const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });
// One frame at 30 fps, in ticks: the shortest a clip may become.
const frame = TICKS_PER_SECOND / 30;

// A clip at `start` for `duration` seconds with no trims, neighbours or source limit.
function member(
  id: string,
  start: number,
  duration: number,
  overrides: Partial<GroupResizeMember> = {},
): GroupResizeMember {
  return {
    trackId: "t1",
    elementId: id,
    startTime: sec(start),
    duration: sec(duration),
    trimStart: sec(0),
    trimEnd: sec(0),
    leftNeighborBound: null,
    rightNeighborBound: null,
    ...overrides,
  };
}

describe("computeGroupResize", () => {
  it("returns a zero delta and no updates for an empty group", () => {
    expect(
      computeGroupResize({ members: [], side: "right", deltaTime: sec(2), fps }),
    ).toEqual({ deltaTime: sec(0), updates: [] });
  });

  it("lengthens a clip from its right edge", () => {
    const result = computeGroupResize({
      members: [member("a", 1, 2)],
      side: "right",
      deltaTime: sec(1),
      fps,
    });
    expect(result.deltaTime).toBe(sec(1));
    expect(result.updates[0].patch).toEqual({
      startTime: sec(1),
      duration: sec(3),
      trimStart: sec(0),
      trimEnd: sec(0),
    });
  });

  it("moves the start and trims the source when a clip shrinks from the left", () => {
    const result = computeGroupResize({
      members: [member("a", 1, 2)],
      side: "left",
      deltaTime: sec(1),
      fps,
    });
    expect(result.updates[0].patch).toEqual({
      startTime: sec(2),
      duration: sec(1),
      trimStart: sec(1),
      trimEnd: sec(0),
    });
  });

  it("stops a right-edge drag at the next clip on the track", () => {
    const result = computeGroupResize({
      members: [member("a", 0, 2, { rightNeighborBound: sec(3) })],
      side: "right",
      deltaTime: sec(5),
      fps,
    });
    expect(result.deltaTime).toBe(sec(1));
    expect(result.updates[0].patch.duration).toBe(sec(3));
  });

  it("stops a left-edge drag at the previous clip and at time zero", () => {
    const touching = computeGroupResize({
      members: [member("a", 4, 2, { leftNeighborBound: sec(3) })],
      side: "left",
      deltaTime: sec(-5),
      fps,
    });
    expect(touching.deltaTime).toBe(sec(-1));

    const atZero = computeGroupResize({
      members: [member("a", 2, 2)],
      side: "left",
      deltaTime: sec(-5),
      fps,
    });
    expect(atZero.deltaTime).toBe(sec(-2));
    expect(atZero.updates[0].patch.startTime).toBe(sec(0));
  });

  it("never lets a clip get shorter than one frame", () => {
    const right = computeGroupResize({
      members: [member("a", 0, 2)],
      side: "right",
      deltaTime: sec(-10),
      fps,
    });
    expect(right.updates[0].patch.duration).toBe(frame);

    const left = computeGroupResize({
      members: [member("a", 0, 2)],
      side: "left",
      deltaTime: sec(10),
      fps,
    });
    expect(left.updates[0].patch.duration).toBe(frame);
  });

  it("stops a right-edge drag at the end of the source media", () => {
    // 5s of source, 1s trimmed off the front, 2s shown, so 2s more is the most that fits.
    const result = computeGroupResize({
      members: [
        member("a", 0, 2, { sourceDuration: sec(5), trimStart: sec(1), trimEnd: sec(2) }),
      ],
      side: "right",
      deltaTime: sec(10),
      fps,
    });
    expect(result.deltaTime).toBe(sec(2));
    expect(result.updates[0].patch.trimEnd).toBe(sec(0));
  });

  it("stops a left-edge drag when the trimmed-off start is used up", () => {
    // 1s was trimmed off the front, so the left edge can only move 1s earlier.
    const result = computeGroupResize({
      members: [
        member("a", 5, 2, { sourceDuration: sec(5), trimStart: sec(1), trimEnd: sec(2) }),
      ],
      side: "left",
      deltaTime: sec(-4),
      fps,
    });
    expect(result.deltaTime).toBe(sec(-1));
    expect(result.updates[0].patch.trimStart).toBe(sec(0));
    expect(result.updates[0].patch.startTime).toBe(sec(4));
  });

  it("applies the tightest limit of the whole group to every clip", () => {
    const result = computeGroupResize({
      members: [
        member("a", 0, 2, { rightNeighborBound: sec(10) }),
        member("b", 0, 2, { trackId: "t2", rightNeighborBound: sec(3) }),
        member("c", 0, 2, { trackId: "t3" }),
      ],
      side: "right",
      deltaTime: sec(4),
      fps,
    });
    // b can only grow by 1s, so a and c grow by 1s as well.
    expect(result.deltaTime).toBe(sec(1));
    expect(result.updates.map((u) => u.patch.duration)).toEqual([sec(3), sec(3), sec(3)]);
  });

  it("is limited by a later clip's ceiling even when the first clip has none", () => {
    const result = computeGroupResize({
      members: [
        member("a", 0, 2),
        member("b", 0, 2, { trackId: "t2", rightNeighborBound: sec(3) }),
      ],
      side: "right",
      deltaTime: sec(4),
      fps,
    });
    expect(result.deltaTime).toBe(sec(1));
  });

  it("snaps the delta to a whole frame once and keeps the trim sum exact", () => {
    // 5s source, 1s trimStart, 2s shown, 2s trimEnd. Drag 0.1s: not a frame multiple.
    const base = member("a", 0, 2, {
      sourceDuration: sec(5),
      trimStart: sec(1),
      trimEnd: sec(2),
    });
    const result = computeGroupResize({
      members: [base],
      side: "right",
      deltaTime: sec(0.1),
      fps,
    });
    expect(result.deltaTime % frame).toBe(0);
    const { patch } = result.updates[0];
    // Nothing is lost or gained: trimStart + duration + trimEnd stays equal to the source.
    expect(patch.trimStart + patch.duration + patch.trimEnd).toBe(sec(5));
  });

  it("converts the clip delta to source time for a sped-up clip", () => {
    // At 2x, 1s of timeline is 2s of source: growing the right edge by 1s uses 2s of trimEnd.
    const result = computeGroupResize({
      members: [
        member("a", 0, 2, {
          sourceDuration: sec(10),
          trimStart: sec(0),
          trimEnd: sec(6),
          retime: { rate: 2 },
        }),
      ],
      side: "right",
      deltaTime: sec(1),
      fps,
    });
    expect(result.deltaTime).toBe(sec(1));
    expect(result.updates[0].patch.duration).toBe(sec(3));
    expect(result.updates[0].patch.trimEnd).toBe(sec(4));
  });

  it("limits a sped-up clip's right edge by the source it has left", () => {
    // 10s source at 2x, 8s of it unused: at most 4s more timeline.
    const result = computeGroupResize({
      members: [
        member("a", 0, 1, {
          sourceDuration: sec(10),
          trimStart: sec(0),
          trimEnd: sec(8),
          retime: { rate: 2 },
        }),
      ],
      side: "right",
      deltaTime: sec(20),
      fps,
    });
    expect(result.deltaTime).toBe(sec(4));
    expect(result.updates[0].patch.trimEnd).toBe(sec(0));
  });
});
