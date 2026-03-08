import type { TrackType, Transform } from "../types";

export const PIXELS_PER_SECOND = 50;
export const DEFAULT_ELEMENT_DURATION = 5;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 100;
export const ZOOM_BUTTON_FACTOR = 1.7;
export const SNAP_THRESHOLD_PX = 10;
export const DRAG_THRESHOLD_PX = 5;
export const TRACK_GAP = 2;

export const DEFAULT_TRANSFORM: Transform = {
  scale: 1,
  position: { x: 0, y: 0 },
  rotate: 0,
};

export const DEFAULT_OPACITY = 1;
export const DEFAULT_VOLUME = 1;

export const TRACK_CONFIG: Record<
  TrackType,
  { height: number; defaultName: string; color: string; icon: string }
> = {
  video: {
    height: 60,
    defaultName: "Video",
    color: "bg-blue-500/20",
    icon: "faFilm",
  },
  audio: {
    height: 50,
    defaultName: "Audio",
    color: "bg-purple-500/20",
    icon: "faVolumeHigh",
  },
  text: {
    height: 30,
    defaultName: "Text",
    color: "bg-emerald-500/20",
    icon: "faFont",
  },
};
