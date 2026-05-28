import type { TrackType } from "./types";

// Default user-visible names for each track type. Shown in the
// properties panel header and used when creating a new track without
// an explicit name (drag-and-drop, paste-element, etc.).
export const DEFAULT_TRACK_NAMES: Record<TrackType, string> = {
  video: "Video track",
  text: "Text track",
  audio: "Audio track",
  graphic: "Graphic track",
  effect: "Effect track",
} as const;
