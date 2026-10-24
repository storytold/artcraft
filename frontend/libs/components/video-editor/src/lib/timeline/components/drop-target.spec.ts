import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds } from "../../wasm";
import type { SceneTracks, TimelineTrack } from "../types";
import { computeDropTarget } from "./drop-target";
import { TIMELINE_TRACK_GAP_PX } from "./layout";
import { getTrackHeight } from "./track-layout";

// Spec for computeDropTarget: which track a drag lands on. The assets panel and
// external file drops call it without a vertical drag direction, so a pointer
// resting in the small gap between two tracks must still pick a neighbour.

const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

// An empty track of the given type.
function track(id: string, type: TimelineTrack["type"]): TimelineTrack {
  return { id, name: id, type, elements: [], muted: false, hidden: false } as unknown as TimelineTrack;
}

// Two empty text overlay tracks above an empty main track.
function twoTextTracks(): SceneTracks {
  return {
    overlay: [track("o1", "text"), track("o2", "text")],
    main: track("main", "video"),
    audio: [],
  } as unknown as SceneTracks;
}

// Drops a 2 s text clip at `mouseY` with no vertical drag direction (the
// assets-panel / external-file-drop call shape).
function dropAt(mouseY: number) {
  return computeDropTarget({
    elementType: "text",
    mouseX: 100,
    mouseY,
    tracks: twoTextTracks(),
    playheadTime: sec(0),
    isExternalDrop: false,
    elementDuration: sec(2),
    pixelsPerSecond: 50,
    zoomLevel: 1,
  });
}

describe("computeDropTarget: gap between tracks, no drag direction", () => {
  const gapTop = getTrackHeight({ type: "text" });
  const gapBottom = gapTop + TIMELINE_TRACK_GAP_PX;

  it("snaps a pointer in the upper half of the gap to the track above", () => {
    const target = dropAt(gapTop + 1);

    expect(target.isNewTrack).toBe(false);
    expect(target.trackIndex).toBe(0);
  });

  it("snaps a pointer in the lower half of the gap to the track below", () => {
    const target = dropAt(gapBottom - 1);

    expect(target.isNewTrack).toBe(false);
    expect(target.trackIndex).toBe(1);
  });
});
