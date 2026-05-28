import type {
  TimelineTrack,
  VideoTrack,
  AudioTrack,
  GraphicTrack,
  TextTrack,
  EffectTrack,
} from "./types";

// Track-type predicates used by chrome that conditionally renders mute/
// hide controls. Each is a typed user-guard so callers narrow inside the
// branch.

export function canTrackHaveAudio(
  track: TimelineTrack,
): track is VideoTrack | AudioTrack {
  return track.type === "audio" || track.type === "video";
}

export function canTrackBeHidden(
  track: TimelineTrack,
): track is VideoTrack | TextTrack | GraphicTrack | EffectTrack {
  return track.type !== "audio";
}
