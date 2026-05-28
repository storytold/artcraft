import type { TrackType } from "../types";
import {
  KEYFRAME_LANE_HEIGHT_PX,
  TIMELINE_TRACK_GAP_PX,
  TIMELINE_TRACK_HEIGHTS_PX,
} from "./layout";

export function getTrackHeight({ type }: { type: TrackType }): number {
  return TIMELINE_TRACK_HEIGHTS_PX[type];
}

export function getExpandedTrackHeight({
  type,
  expandedLaneCount,
}: {
  type: TrackType;
  expandedLaneCount: number;
}): number {
  return (
    TIMELINE_TRACK_HEIGHTS_PX[type] +
    expandedLaneCount * KEYFRAME_LANE_HEIGHT_PX
  );
}

export function getCumulativeHeightBefore({
  tracks,
  trackIndex,
  getExtraHeight,
}: {
  tracks: Array<{ type: TrackType }>;
  trackIndex: number;
  getExtraHeight?: (trackIndex: number) => number;
}): number {
  return tracks
    .slice(0, trackIndex)
    .reduce(
      (sum, track, i) =>
        sum +
        getTrackHeight({ type: track.type }) +
        (getExtraHeight?.(i) ?? 0) +
        TIMELINE_TRACK_GAP_PX,
      0,
    );
}

export function getTotalTracksHeight({
  tracks,
  getExtraHeight,
}: {
  tracks: Array<{ type: TrackType }>;
  getExtraHeight?: (trackIndex: number) => number;
}): number {
  const tracksHeight = tracks.reduce(
    (sum, track, i) =>
      sum + getTrackHeight({ type: track.type }) + (getExtraHeight?.(i) ?? 0),
    0,
  );
  const gapsHeight = Math.max(0, tracks.length - 1) * TIMELINE_TRACK_GAP_PX;
  return tracksHeight + gapsHeight;
}
