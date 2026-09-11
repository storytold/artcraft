import type { SceneTracks, TimelineTrack } from "../timeline/types";
import { rippleShiftElements } from "./shift";

// One adjustment per (track, time, amount) tuple. The diff layer
// computes these; apply layer materializes them into a fresh
// SceneTracks. Multi-adjustment tracks apply in reverse-time order so
// later shifts don't re-shift elements that earlier shifts already
// moved.
export interface RippleAdjustment {
  trackId: string;
  afterTime: number;
  shiftAmount: number;
}

export function applyRippleAdjustments({
  tracks,
  adjustments,
}: {
  tracks: SceneTracks;
  adjustments: RippleAdjustment[];
}): SceneTracks {
  if (adjustments.length === 0) {
    return tracks;
  }

  const adjustmentsByTrack = new Map<string, RippleAdjustment[]>();
  for (const adjustment of adjustments) {
    const trackAdjustments = adjustmentsByTrack.get(adjustment.trackId) ?? [];
    trackAdjustments.push(adjustment);
    adjustmentsByTrack.set(adjustment.trackId, trackAdjustments);
  }

  return {
    overlay: tracks.overlay.map((track) =>
      applyTrackRippleAdjustments({
        track,
        adjustments: adjustmentsByTrack.get(track.id) ?? [],
      }),
    ),
    main: applyTrackRippleAdjustments({
      track: tracks.main,
      adjustments: adjustmentsByTrack.get(tracks.main.id) ?? [],
    }),
    audio: tracks.audio.map((track) =>
      applyTrackRippleAdjustments({
        track,
        adjustments: adjustmentsByTrack.get(track.id) ?? [],
      }),
    ),
  };
}

function applyTrackRippleAdjustments<
  TElement extends TimelineTrack["elements"][number],
  TTrack extends TimelineTrack & { elements: TElement[] },
>({
  track,
  adjustments,
}: {
  track: TTrack;
  adjustments: RippleAdjustment[];
}): TTrack {
  if (adjustments.length === 0) {
    return track;
  }

  const sortedAdjustments = [...adjustments].sort(
    (firstAdjustment, secondAdjustment) =>
      secondAdjustment.afterTime - firstAdjustment.afterTime,
  );

  let elements: TElement[] = track.elements;
  for (const adjustment of sortedAdjustments) {
    elements = rippleShiftElements({
      elements,
      afterTime: adjustment.afterTime,
      shiftAmount: adjustment.shiftAmount,
    });
  }

  return { ...track, elements };
}
