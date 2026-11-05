import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds, TICKS_PER_SECOND } from "../wasm";
import type { SceneTracks, TimelineElement, TimelineTrack } from "../timeline/types";
import { applyRippleAdjustments } from "./apply";
import { computeRippleAdjustments } from "./diff";

// Spec for ripple editing: the diff that finds the gaps a command left behind
// and the shift that closes them. Times are written in seconds.

const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

// A clip with just the fields ripple reads.
function clip(id: string, start: number, duration: number): TimelineElement {
  return { id, startTime: sec(start), duration: sec(duration) } as unknown as TimelineElement;
}

// An overlay track holding the given clips.
function track(id: string, elements: TimelineElement[]): TimelineTrack {
  return { id, type: "video", elements } as unknown as TimelineTrack;
}

// Scene with the given overlay tracks and an empty main track.
function scene(...overlay: TimelineTrack[]): SceneTracks {
  return { overlay, main: track("main", []), audio: [] } as unknown as SceneTracks;
}

// Seconds [start, end] of each clip on the first overlay track, by clip id.
function spansOf(tracks: SceneTracks, trackId = "t1"): Record<string, [number, number]> {
  const found = tracks.overlay.find((candidate) => candidate.id === trackId);
  const out: Record<string, [number, number]> = {};
  for (const element of found?.elements ?? []) {
    out[element.id] = [
      element.startTime / TICKS_PER_SECOND,
      (element.startTime + element.duration) / TICKS_PER_SECOND,
    ];
  }
  return out;
}

// True when any two clips of the first overlay track overlap.
function hasOverlap(tracks: SceneTracks, trackId = "t1"): boolean {
  const spans = Object.values(spansOf(tracks, trackId)).sort((a, b) => a[0] - b[0]);
  return spans.some((span, index) => index > 0 && span[0] < spans[index - 1][1]);
}

// Runs the diff and the shift the way CommandManager does.
function ripple(before: SceneTracks, after: SceneTracks): SceneTracks {
  return applyRippleAdjustments({
    tracks: after,
    adjustments: computeRippleAdjustments({ beforeTracks: before, afterTracks: after }),
  });
}

describe("computeRippleAdjustments", () => {
  it("returns nothing when nothing changed", () => {
    const tracks = scene(track("t1", [clip("a", 0, 2), clip("b", 3, 2)]));
    expect(computeRippleAdjustments({ beforeTracks: tracks, afterTracks: tracks })).toEqual([]);
  });

  it("closes the gap of a deleted clip", () => {
    const before = scene(track("t1", [clip("a", 2, 2), clip("b", 5, 1)]));
    const after = scene(track("t1", [clip("b", 5, 1)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([
      { trackId: "t1", afterTime: sec(4), shiftAmount: sec(2) },
    ]);
  });

  it("closes the tail a clip lost when it was shortened from the right", () => {
    const before = scene(track("t1", [clip("a", 0, 10), clip("b", 10, 2)]));
    const after = scene(track("t1", [clip("a", 0, 6), clip("b", 10, 2)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([
      { trackId: "t1", afterTime: sec(10), shiftAmount: sec(4) },
    ]);
  });

  it("does not ripple a clip that only moved to another track", () => {
    const before = scene(track("t1", [clip("a", 0, 2), clip("b", 3, 1)]), track("t2", []));
    const after = scene(track("t1", [clip("b", 3, 1)]), track("t2", [clip("a", 0, 2)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([]);
  });

  it("does not treat the second half of a split clip as free space", () => {
    const before = scene(track("t1", [clip("a", 0, 10)]));
    const after = scene(track("t1", [clip("a", 0, 6), clip("a2", 6, 4)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([]);
  });

  it("reports nothing for a clip moved to a later time", () => {
    const before = scene(track("t1", [clip("a", 0, 2), clip("b", 9, 1)]));
    const after = scene(track("t1", [clip("a", 4, 2), clip("b", 9, 1)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([]);
  });

  it("closes the part of its old slot a clip left when it moved left by less than its length", () => {
    const before = scene(track("t1", [clip("a", 5, 2)]));
    const after = scene(track("t1", [clip("a", 3, 2)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([
      { trackId: "t1", afterTime: sec(7), shiftAmount: sec(2) },
    ]);
  });

  it("closes only the old slot of a clip that jumped left by more than its length", () => {
    // a sat on 6-8 and now sits on 0-2. The slot it freed is 6-8, 2s long. The empty
    // 2-6 was empty before the move and is not part of what a gave up.
    const before = scene(track("t1", [clip("a", 6, 2)]));
    const after = scene(track("t1", [clip("a", 0, 2)]));
    expect(computeRippleAdjustments({ beforeTracks: before, afterTracks: after })).toEqual([
      { trackId: "t1", afterTime: sec(8), shiftAmount: sec(2) },
    ]);
  });
});

describe("ripple of whole commands", () => {
  it("closes both gaps when two clips are deleted and keeps the clips between them in order", () => {
    // a 2-4 and c 6-8 deleted; b 4.5-5.5 sits between them, d 10-12 after.
    const before = scene(
      track("t1", [clip("a", 2, 2), clip("b", 4.5, 1), clip("c", 6, 2), clip("d", 10, 2)]),
    );
    const after = scene(track("t1", [clip("b", 4.5, 1), clip("d", 10, 2)]));
    const result = ripple(before, after);
    expect(spansOf(result)).toEqual({ b: [2.5, 3.5], d: [6, 8] });
  });

  it("shifts the clips after a shortened clip and leaves the earlier ones alone", () => {
    const before = scene(track("t1", [clip("x", 0, 1), clip("a", 2, 6), clip("b", 8, 2)]));
    const after = scene(track("t1", [clip("x", 0, 1), clip("a", 2, 3), clip("b", 8, 2)]));
    expect(spansOf(ripple(before, after))).toEqual({ x: [0, 1], a: [2, 5], b: [5, 7] });
  });

  it("does not push later clips onto a clip that a moved clip jumped over", () => {
    // f 3-5, e 6-8, g 9-10. e is dragged left over f onto the free slot 0-2.
    // Only e's old slot (2s) is closed, so g moves 2s: 7-8. It must not land on f.
    const before = scene(track("t1", [clip("f", 3, 2), clip("e", 6, 2), clip("g", 9, 1)]));
    const after = scene(track("t1", [clip("e", 0, 2), clip("f", 3, 2), clip("g", 9, 1)]));
    const result = ripple(before, after);
    expect(hasOverlap(result)).toBe(false);
    expect(spansOf(result)).toEqual({ e: [0, 2], f: [3, 5], g: [7, 8] });
  });

  it("shifts later clips by the length of the old slot when a lone clip jumps left", () => {
    const before = scene(track("t1", [clip("e", 6, 2), clip("g", 9, 1)]));
    const after = scene(track("t1", [clip("e", 0, 2), clip("g", 9, 1)]));
    expect(spansOf(ripple(before, after))).toEqual({ e: [0, 2], g: [7, 8] });
  });
});
