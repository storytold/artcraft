import { describe, expect, it } from "vitest";
import { resolveTrackPlacement } from "./resolve";
import { enforceMainTrackStart } from "./main-track";
import { getDefaultInsertIndexForTrack, getHighestInsertIndexForTrack, resolvePreferredNewTrackPlacement } from "./insert-index";
import { canPlaceTimeSpansOnTrack } from "./overlap";

// Times are plain numbers here; the placement code only adds and compares them.
const t = (n: number) => n as never;

function track(id: string, type: string, spans: Array<[number, number]> = []) {
  return {
    id,
    type,
    name: id,
    muted: false,
    hidden: false,
    elements: spans.map(([startTime, duration], i) => ({ id: `${id}-e${i}`, startTime, duration })),
  } as never;
}

function scene(overlay: unknown[], main: unknown, audio: unknown[]) {
  return { overlay, main, audio } as never;
}

const EMPTY_MAIN = track("main", "video");

describe("overlap", () => {
  const busy = { elements: [{ id: "x", startTime: 10, duration: 5 }] } as never;

  it("accepts spans that only touch an existing element", () => {
    expect(canPlaceTimeSpansOnTrack({ track: busy, timeSpans: [{ startTime: t(15), duration: t(5) }] })).toBe(true);
    expect(canPlaceTimeSpansOnTrack({ track: busy, timeSpans: [{ startTime: t(5), duration: t(5) }] })).toBe(true);
  });

  it("rejects spans that overlap, and ignores the excluded element", () => {
    expect(canPlaceTimeSpansOnTrack({ track: busy, timeSpans: [{ startTime: t(12), duration: t(2) }] })).toBe(false);
    expect(
      canPlaceTimeSpansOnTrack({ track: busy, timeSpans: [{ startTime: t(12), duration: t(2), excludeElementId: "x" }] }),
    ).toBe(true);
  });

  it("needs every span to fit", () => {
    expect(
      canPlaceTimeSpansOnTrack({
        track: busy,
        timeSpans: [
          { startTime: t(0), duration: t(5) },
          { startTime: t(11), duration: t(1) },
        ],
      }),
    ).toBe(false);
  });
});

describe("main track start", () => {
  it("snaps to zero when placing at or before the earliest element", () => {
    const tracks = scene([], track("main", "video", [[5, 3]]), []);
    expect(enforceMainTrackStart({ tracks, targetTrackId: "main", requestedStartTime: t(2) })).toBe(0);
    expect(enforceMainTrackStart({ tracks, targetTrackId: "main", requestedStartTime: t(5) })).toBe(0);
  });

  it("keeps a later start and never touches other tracks", () => {
    const tracks = scene([track("o1", "video")], track("main", "video", [[5, 3]]), []);
    expect(enforceMainTrackStart({ tracks, targetTrackId: "main", requestedStartTime: t(9) })).toBe(9);
    expect(enforceMainTrackStart({ tracks, targetTrackId: "o1", requestedStartTime: t(1) })).toBe(1);
  });

  it("starts an empty main track at zero", () => {
    const tracks = scene([], EMPTY_MAIN, []);
    expect(enforceMainTrackStart({ tracks, targetTrackId: "main", requestedStartTime: t(7) })).toBe(0);
  });
});

describe("insert index", () => {
  const tracks = scene([track("o1", "video"), track("o2", "text")], EMPTY_MAIN, [track("a1", "audio")]);

  it("puts audio below everything, effects on top and other overlays under the overlay group", () => {
    expect(getDefaultInsertIndexForTrack({ tracks, trackType: "audio" })).toBe(4);
    expect(getDefaultInsertIndexForTrack({ tracks, trackType: "effect" })).toBe(0);
    expect(getDefaultInsertIndexForTrack({ tracks, trackType: "video" })).toBe(2);
  });

  it("puts the highest audio slot right under the main track", () => {
    expect(getHighestInsertIndexForTrack({ tracks, trackType: "audio" })).toBe(3);
    expect(getHighestInsertIndexForTrack({ tracks, trackType: "video" })).toBe(0);
  });

  it("never lets a non-audio track land below the main track", () => {
    const result = resolvePreferredNewTrackPlacement({ tracks, trackType: "video", preferredIndex: 2, direction: "below" });
    expect(result.insertIndex).toBe(2);
    expect(result.insertPosition).toBe("above");
  });

  it("sends a new audio track under the main track when the hover is above it", () => {
    const result = resolvePreferredNewTrackPlacement({ tracks, trackType: "audio", preferredIndex: 0, direction: "above" });
    expect(result).toEqual({ insertIndex: 3, insertPosition: "below" });
  });
});

describe("resolveTrackPlacement", () => {
  const tracks = scene([track("o1", "video", [[0, 10]])], EMPTY_MAIN, []);
  const span = (startTime: number, duration: number) => [{ startTime: t(startTime), duration: t(duration) }];

  it("rejects an explicit track of the wrong type or an unknown id", () => {
    expect(
      resolveTrackPlacement({ tracks, elementType: "audio", timeSpans: span(0, 1), strategy: { type: "explicit", trackId: "o1" } }),
    ).toBeNull();
    expect(
      resolveTrackPlacement({ tracks, elementType: "video", timeSpans: span(0, 1), strategy: { type: "explicit", trackId: "nope" } }),
    ).toBeNull();
  });

  it("uses the first compatible track with room and otherwise makes a new top track", () => {
    const free = resolveTrackPlacement({ tracks, elementType: "video", timeSpans: span(20, 5), strategy: { type: "firstAvailable" } });
    expect(free).toMatchObject({ kind: "existingTrack", trackId: "o1" });

    const blocked = resolveTrackPlacement({ tracks, elementType: "text", timeSpans: span(0, 5), strategy: { type: "firstAvailable" } });
    expect(blocked).toMatchObject({ kind: "newTrack", trackType: "text", insertIndex: 0 });
  });

  it("falls back to a new track at the hover index when the preferred track is busy", () => {
    const result = resolveTrackPlacement({
      tracks,
      elementType: "video",
      timeSpans: span(2, 3),
      strategy: { type: "preferIndex", trackIndex: 0, hoverDirection: "below" },
    });
    expect(result).toMatchObject({ kind: "newTrack", insertIndex: 1, insertPosition: "below" });
  });

  it("honours the vertical drag direction only when the preferred track is the wrong type", () => {
    const result = resolveTrackPlacement({
      tracks,
      elementType: "audio",
      timeSpans: span(0, 1),
      strategy: { type: "preferIndex", trackIndex: 0, hoverDirection: "above", verticalDragDirection: "down" },
    });
    expect(result).toMatchObject({ kind: "newTrack", trackType: "audio" });
  });

  it("alwaysNew skips existing tracks", () => {
    const result = resolveTrackPlacement({
      tracks,
      elementType: "video",
      timeSpans: span(20, 1),
      strategy: { type: "alwaysNew", position: "default" },
    });
    expect(result).toMatchObject({ kind: "newTrack", insertIndex: 1, insertPosition: null });
  });

  it("aboveSource prefers the track directly above and otherwise any free one", () => {
    const two = scene([track("o1", "video"), track("o2", "video")], EMPTY_MAIN, []);
    const above = resolveTrackPlacement({
      tracks: two,
      elementType: "video",
      timeSpans: span(0, 1),
      strategy: { type: "aboveSource", sourceTrackIndex: 1 },
    });
    expect(above).toMatchObject({ kind: "existingTrack", trackId: "o1" });

    const top = resolveTrackPlacement({
      tracks: two,
      elementType: "video",
      timeSpans: span(0, 1),
      strategy: { type: "aboveSource", sourceTrackIndex: 0 },
    });
    expect(top).toMatchObject({ kind: "existingTrack", trackId: "o1" });
  });
});
