import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds, TICKS_PER_SECOND } from "../../wasm";
import { computeGroupResize } from "../group-resize";
import type { SceneTracks, TimelineElement, TimelineTrack } from "../types";
import { buildResizeMembers } from "./resize-controller";

// Spec for buildResizeMembers: the per-clip neighbour limits a group resize
// works with, and what a resize of several selected clips on one track does.

const fps = { numerator: 30, denominator: 1 };
const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

// A video clip at `start` seconds lasting `duration` seconds.
function clip(id: string, start: number, duration: number): TimelineElement {
  return {
    id,
    name: id,
    type: "video",
    startTime: sec(start),
    duration: sec(duration),
    trimStart: sec(0),
    trimEnd: sec(0),
    params: {},
  } as unknown as TimelineElement;
}

// A video track holding the given clips.
function videoTrack(id: string, elements: TimelineElement[]): TimelineTrack {
  return { id, name: id, type: "video", elements, muted: false, hidden: false } as unknown as TimelineTrack;
}

// Scene with the given overlay tracks and an empty main track.
function scene(overlay: TimelineTrack[]): SceneTracks {
  return { overlay, main: videoTrack("main", []), audio: [] } as unknown as SceneTracks;
}

// Selection refs for clips on one track.
const refs = (trackId: string, ...ids: string[]) =>
  ids.map((elementId) => ({ trackId, elementId }));

// Applies a resize result to a track's clips and returns [start, end] seconds per clip id.
function spans(
  track: TimelineTrack,
  result: ReturnType<typeof computeGroupResize>,
): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const element of track.elements) {
    const patch = result.updates.find((u) => u.elementId === element.id)?.patch;
    const start = patch?.startTime ?? element.startTime;
    const duration = patch?.duration ?? element.duration;
    out[element.id] = [start / TICKS_PER_SECOND, (start + duration) / TICKS_PER_SECOND];
  }
  return out;
}

describe("buildResizeMembers", () => {
  it("limits a clip by the unselected clips beside it", () => {
    const tracks = scene([
      videoTrack("t1", [clip("x", 0, 1), clip("a", 2, 1), clip("y", 5, 1)]),
    ]);
    const [member] = buildResizeMembers({ tracks, selectedElements: refs("t1", "a") });
    expect(member.leftNeighborBound).toBe(sec(1));
    expect(member.rightNeighborBound).toBe(sec(5));
  });

  it("gives clips on different tracks no limit from each other", () => {
    const tracks = scene([
      videoTrack("t1", [clip("a", 0, 2)]),
      videoTrack("t2", [clip("b", 2, 2)]),
    ]);
    const members = buildResizeMembers({
      tracks,
      selectedElements: [...refs("t1", "a"), ...refs("t2", "b")],
    });
    expect(members.map((m) => [m.leftNeighborBound, m.rightNeighborBound])).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("treats a selected clip on the same track as a limit on the edge that faces it", () => {
    // Dragging an outer edge moves only that edge of every selected clip, so the
    // edge of a that faces b, and the edge of b that faces a, stay where they are.
    const tracks = scene([videoTrack("t1", [clip("a", 0, 2), clip("b", 3, 2)])]);
    const members = buildResizeMembers({
      tracks,
      selectedElements: refs("t1", "a", "b"),
    });
    const a = members.find((m) => m.elementId === "a")!;
    const b = members.find((m) => m.elementId === "b")!;
    expect(a.rightNeighborBound).toBe(sec(3));
    expect(b.leftNeighborBound).toBe(sec(2));
  });
});

describe("a group resize of clips that share a track", () => {
  it("does not make the right edges run into a selected clip", () => {
    const track = videoTrack("t1", [clip("a", 0, 2), clip("b", 3, 2)]);
    const members = buildResizeMembers({
      tracks: scene([track]),
      selectedElements: refs("t1", "a", "b"),
    });
    const result = computeGroupResize({ members, side: "right", deltaTime: sec(4), fps });
    // a can grow by the 1s gap and no more; b keeps the same delta.
    expect(result.deltaTime).toBe(sec(1));
    const after = spans(track, result);
    expect(after.a).toEqual([0, 3]);
    expect(after.b).toEqual([3, 6]);
  });

  it("does not make the left edges run into a selected clip", () => {
    const track = videoTrack("t1", [clip("a", 2, 2), clip("b", 4, 2)]);
    const members = buildResizeMembers({
      tracks: scene([track]),
      selectedElements: refs("t1", "a", "b"),
    });
    const result = computeGroupResize({ members, side: "left", deltaTime: sec(-2), fps });
    // b touches a, so b's left edge cannot move left at all.
    expect(result.deltaTime).toBe(sec(0));
    const after = spans(track, result);
    expect(after.a).toEqual([2, 4]);
    expect(after.b).toEqual([4, 6]);
  });

  it("still resizes both clips freely while the gap between them is large enough", () => {
    const track = videoTrack("t1", [clip("a", 0, 2), clip("b", 6, 2)]);
    const members = buildResizeMembers({
      tracks: scene([track]),
      selectedElements: refs("t1", "a", "b"),
    });
    const result = computeGroupResize({ members, side: "right", deltaTime: sec(1), fps });
    expect(result.deltaTime).toBe(sec(1));
    const after = spans(track, result);
    expect(after.a).toEqual([0, 3]);
    expect(after.b).toEqual([6, 9]);
  });

  it("lets selected touching clips shrink from the inside edge side", () => {
    // Shrinking is never blocked by a neighbour: the left edges move right.
    const track = videoTrack("t1", [clip("a", 0, 2), clip("b", 2, 2)]);
    const members = buildResizeMembers({
      tracks: scene([track]),
      selectedElements: refs("t1", "a", "b"),
    });
    const result = computeGroupResize({ members, side: "left", deltaTime: sec(1), fps });
    expect(result.deltaTime).toBe(sec(1));
    const after = spans(track, result);
    expect(after.a).toEqual([1, 2]);
    expect(after.b).toEqual([3, 4]);
  });
});
