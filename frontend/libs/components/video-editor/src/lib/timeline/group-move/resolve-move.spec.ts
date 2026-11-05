import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds } from "../../wasm";
import type { SceneTracks, TimelineElement, TimelineTrack } from "../types";
import { buildMoveGroup } from "./build-group";
import { resolveGroupMove } from "./resolve-move";

// Spec for the group-move solver: where a multi-clip drag lands. Elements only
// need the fields the solver reads (id, type, startTime, duration), so the
// fixtures are cast instead of filled in with every optional field.

// Seconds -> the branded MediaTime the solver works in.
const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

// A timeline element at `start` seconds lasting `duration` seconds.
function element(
  id: string,
  type: TimelineElement["type"],
  start: number,
  duration: number,
): TimelineElement {
  return {
    id,
    name: id,
    type,
    startTime: sec(start),
    duration: sec(duration),
    trimStart: sec(0),
    trimEnd: sec(0),
    params: {},
  } as unknown as TimelineElement;
}

// A track of the given type holding the given elements.
function track(
  id: string,
  type: TimelineTrack["type"],
  elements: TimelineElement[] = [],
): TimelineTrack {
  return { id, name: id, type, elements, muted: false, hidden: false } as unknown as TimelineTrack;
}

// The three timeline sections, built from track fixtures.
function scene({
  overlay = [],
  main = track("main", "video"),
  audio = [],
}: {
  overlay?: TimelineTrack[];
  main?: TimelineTrack;
  audio?: TimelineTrack[];
}): SceneTracks {
  return { overlay, main, audio } as unknown as SceneTracks;
}

// Builds the MoveGroup the controller would build: the anchor plus every selected clip.
function groupOf(
  tracks: SceneTracks,
  anchor: { trackId: string; elementId: string },
  selected: Array<{ trackId: string; elementId: string }> = [anchor],
) {
  const group = buildMoveGroup({ anchorRef: anchor, selectedElements: selected, tracks });
  if (!group) throw new Error("fixture produced no group");
  return group;
}

describe("resolveGroupMove: existing track", () => {
  it("moves one clip to another track of the same type", () => {
    const tracks = scene({
      overlay: [track("o1", "text", [element("a", "text", 0, 2)]), track("o2", "text")],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }),
      tracks,
      anchorStartTime: sec(4),
      target: { kind: "existingTrack", anchorTargetTrackId: "o2" },
    });
    expect(result?.moves).toEqual([
      { sourceTrackId: "o1", targetTrackId: "o2", elementId: "a", newStartTime: sec(4) },
    ]);
    expect(result?.createTracks).toEqual([]);
    expect(result?.targetSelection).toEqual([{ trackId: "o2", elementId: "a" }]);
  });

  it("returns null when the target track does not exist", () => {
    const tracks = scene({ overlay: [track("o1", "text", [element("a", "text", 0, 2)])] });
    expect(
      resolveGroupMove({
        group: groupOf(tracks, { trackId: "o1", elementId: "a" }),
        tracks,
        anchorStartTime: sec(1),
        target: { kind: "existingTrack", anchorTargetTrackId: "ghost" },
      }),
    ).toBeNull();
  });

  it("keeps every member at or after time zero", () => {
    // b starts 2s before the anchor a, so the anchor cannot go earlier than 2s.
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 3, 1)]),
        track("o2", "text", [element("b", "text", 1, 1)]),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o2", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(0),
      target: { kind: "existingTrack", anchorTargetTrackId: "o1" },
    });
    const starts = Object.fromEntries(result!.moves.map((m) => [m.elementId, m.newStartTime]));
    expect(starts).toEqual({ a: sec(2), b: sec(0) });
  });

  it("keeps the members on different tracks one track apart", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 1)]),
        track("o2", "text", [element("b", "text", 0, 1)]),
        track("o3", "text"),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o2", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(0),
      target: { kind: "existingTrack", anchorTargetTrackId: "o2" },
    });
    const targets = Object.fromEntries(result!.moves.map((m) => [m.elementId, m.targetTrackId]));
    expect(targets).toEqual({ a: "o2", b: "o3" });
  });

  it("rejects a drop that overlaps a clip already on the target track", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 2)]),
        track("o2", "text", [element("x", "text", 2, 2)]),
      ],
    });
    const group = groupOf(tracks, { trackId: "o1", elementId: "a" });
    const drop = (start: number) =>
      resolveGroupMove({
        group,
        tracks,
        anchorStartTime: sec(start),
        target: { kind: "existingTrack", anchorTargetTrackId: "o2" },
      });
    expect(drop(3)).toBeNull();
    // Touching edges are fine: a ends at 2s exactly where x starts, and x ends at 4s.
    expect(drop(0)).not.toBeNull();
    expect(drop(4)).not.toBeNull();
  });

  it("snaps a clip that would become the first main-track clip to time zero", () => {
    const tracks = scene({
      overlay: [track("o1", "video", [element("a", "video", 6, 2)])],
      main: track("main", "video", [element("m", "video", 10, 5)]),
    });
    const group = groupOf(tracks, { trackId: "o1", elementId: "a" });
    const drop = (start: number) =>
      resolveGroupMove({
        group,
        tracks,
        anchorStartTime: sec(start),
        target: { kind: "existingTrack", anchorTargetTrackId: "main" },
      });
    // Lands before the stationary clip at 10s, so it becomes the first clip: time zero.
    expect(drop(4)?.moves[0].newStartTime).toBe(sec(0));
    // Lands after the stationary clip: left where it was dropped.
    expect(drop(16)?.moves[0].newStartTime).toBe(sec(16));
  });
});

describe("resolveGroupMove: clips that share a track", () => {
  it("keeps two clips from one text track together on that track", () => {
    // Select both text clips on o1 and drag them sideways, staying on o1.
    const tracks = scene({
      overlay: [track("o1", "text", [element("a", "text", 0, 2), element("b", "text", 3, 2)])],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o1", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(1),
      target: { kind: "existingTrack", anchorTargetTrackId: "o1" },
    });
    expect(result).not.toBeNull();
    expect(result!.moves).toEqual([
      { sourceTrackId: "o1", targetTrackId: "o1", elementId: "a", newStartTime: sec(1) },
      { sourceTrackId: "o1", targetTrackId: "o1", elementId: "b", newStartTime: sec(4) },
    ]);
    expect(result!.createTracks).toEqual([]);
  });

  it("does not move the second clip onto the main track", () => {
    // o1 and main are both video tracks; a free main track must not pull b away from o1.
    const tracks = scene({
      overlay: [track("o1", "video", [element("a", "video", 0, 2), element("b", "video", 3, 2)])],
      main: track("main", "video", [element("m", "video", 0, 1)]),
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o1", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(10),
      target: { kind: "existingTrack", anchorTargetTrackId: "o1" },
    });
    const targets = Object.fromEntries(result!.moves.map((m) => [m.elementId, m.targetTrackId]));
    expect(targets).toEqual({ a: "o1", b: "o1" });
  });

  it("moves two clips from one track together onto another empty track", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 2), element("b", "text", 3, 2)]),
        track("o2", "text"),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o1", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(4),
      target: { kind: "existingTrack", anchorTargetTrackId: "o2" },
    });
    expect(result!.moves).toEqual([
      { sourceTrackId: "o1", targetTrackId: "o2", elementId: "a", newStartTime: sec(4) },
      { sourceTrackId: "o1", targetTrackId: "o2", elementId: "b", newStartTime: sec(7) },
    ]);
  });

  it("snaps the earliest of several main-track clips to time zero, not the one grabbed", () => {
    // a (grabbed) and b are both on main, b 6s before a. m stays at 4s.
    // Dropping a at 8s puts b at 2s: before m, so b becomes the first clip and
    // must go to 0, which moves a to 6s. a alone (8s) is after m, so a is not the test.
    const tracks = scene({
      main: track("main", "video", [
        element("m", "video", 4, 1),
        element("a", "video", 12, 1),
        element("b", "video", 6, 1),
      ]),
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "main", elementId: "a" }, [
        { trackId: "main", elementId: "a" },
        { trackId: "main", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(8),
      target: { kind: "existingTrack", anchorTargetTrackId: "main" },
    });
    const starts = Object.fromEntries(result!.moves.map((m) => [m.elementId, m.newStartTime]));
    expect(starts).toEqual({ a: sec(6), b: sec(0) });
  });

  it("refuses the whole move when one of two same-track clips would hit a clip on the target", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 2), element("b", "text", 3, 2)]),
        track("o2", "text", [element("x", "text", 6, 2)]),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o1", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(4),
      target: { kind: "existingTrack", anchorTargetTrackId: "o2" },
    });
    // b would land at 7s, inside x (6s-8s): the whole move is refused.
    expect(result).toBeNull();
  });
});

describe("resolveGroupMove: new tracks", () => {
  it("gives every member its own new track, in display order", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 1)]),
        track("o2", "text", [element("b", "text", 0, 1)]),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o2", elementId: "b" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o2", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(2),
      target: { kind: "newTracks", anchorInsertIndex: 1, newTrackIds: ["n1", "n2"] },
    });
    // b is the second member and is dropped at index 1, so the block starts at 0.
    expect(result!.createTracks).toEqual([
      { id: "n1", type: "text", index: 0 },
      { id: "n2", type: "text", index: 1 },
    ]);
    expect(result!.moves.map((m) => [m.elementId, m.targetTrackId])).toEqual([
      ["a", "n1"],
      ["b", "n2"],
    ]);
  });

  it("refuses a block of fewer new track ids than members", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 0, 1)]),
        track("o2", "text", [element("b", "text", 0, 1)]),
      ],
    });
    expect(
      resolveGroupMove({
        group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
          { trackId: "o1", elementId: "a" },
          { trackId: "o2", elementId: "b" },
        ]),
        tracks,
        anchorStartTime: sec(0),
        target: { kind: "newTracks", anchorInsertIndex: 0, newTrackIds: ["n1"] },
      }),
    ).toBeNull();
  });

  it("refuses a mix of audio and visual members", () => {
    const tracks = scene({
      overlay: [track("o1", "text", [element("a", "text", 0, 1)])],
      audio: [track("au1", "audio", [element("s", "audio", 0, 1)])],
    });
    expect(
      resolveGroupMove({
        group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
          { trackId: "o1", elementId: "a" },
          { trackId: "au1", elementId: "s" },
        ]),
        tracks,
        anchorStartTime: sec(0),
        target: { kind: "newTracks", anchorInsertIndex: 0, newTrackIds: ["n1", "n2"] },
      }),
    ).toBeNull();
  });

  it("keeps new visual tracks above the main track and new audio tracks below it", () => {
    const tracks = scene({
      overlay: [track("o1", "text", [element("a", "text", 0, 1)])],
      audio: [track("au1", "audio", [element("s", "audio", 0, 1)])],
    });
    const visual = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }),
      tracks,
      anchorStartTime: sec(0),
      target: { kind: "newTracks", anchorInsertIndex: 99, newTrackIds: ["n1"] },
    });
    // One overlay track exists, so the furthest a visual track can go is index 1 (just above main).
    expect(visual!.createTracks[0].index).toBe(1);

    const audio = resolveGroupMove({
      group: groupOf(tracks, { trackId: "au1", elementId: "s" }),
      tracks,
      anchorStartTime: sec(0),
      target: { kind: "newTracks", anchorInsertIndex: 0, newTrackIds: ["n1"] },
    });
    // Display order is [o1, main, au1]; an audio track can never go above index 2 (right under main).
    expect(audio!.createTracks[0].index).toBe(2);
  });

  it("does not shift an element earlier than time zero", () => {
    const tracks = scene({
      overlay: [
        track("o1", "text", [element("a", "text", 3, 1)]),
        track("o2", "text", [element("b", "text", 1, 1)]),
      ],
    });
    const result = resolveGroupMove({
      group: groupOf(tracks, { trackId: "o1", elementId: "a" }, [
        { trackId: "o1", elementId: "a" },
        { trackId: "o2", elementId: "b" },
      ]),
      tracks,
      anchorStartTime: sec(0),
      target: { kind: "newTracks", anchorInsertIndex: 0, newTrackIds: ["n1", "n2"] },
    });
    const starts = Object.fromEntries(result!.moves.map((m) => [m.elementId, m.newStartTime]));
    expect(starts).toEqual({ a: sec(2), b: sec(0) });
  });
});
