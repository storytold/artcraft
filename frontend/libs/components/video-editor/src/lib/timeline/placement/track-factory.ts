import { DEFAULT_TRACK_NAMES } from "../tracks";
import type {
  AudioTrack,
  EffectTrack,
  GraphicTrack,
  TextTrack,
  TrackType,
  TimelineTrack,
  VideoTrack,
} from "../types";

// Overload-heavy buildEmptyTrack so callers get the specific track
// shape (VideoTrack, TextTrack, etc.) when they pass a literal type
// string. The fall-through implementation handles all five variants
// and slots default flags (hidden/muted) appropriately.

export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: "video";
  name?: string;
}): VideoTrack;
export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: "text";
  name?: string;
}): TextTrack;
export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: "audio";
  name?: string;
}): AudioTrack;
export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: "graphic";
  name?: string;
}): GraphicTrack;
export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: "effect";
  name?: string;
}): EffectTrack;

export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: TrackType;
  name?: string;
}): TimelineTrack;
export function buildEmptyTrack({
  id,
  type,
  name,
}: {
  id: string;
  type: TrackType;
  name?: string;
}): TimelineTrack {
  const trackName = name ?? DEFAULT_TRACK_NAMES[type];

  switch (type) {
    case "video":
      return {
        id,
        name: trackName,
        type: "video",
        elements: [],
        hidden: false,
        muted: false,
      };
    case "text":
      return {
        id,
        name: trackName,
        type: "text",
        elements: [],
        hidden: false,
      };
    case "graphic":
      return {
        id,
        name: trackName,
        type: "graphic",
        elements: [],
        hidden: false,
      };
    case "audio":
      return {
        id,
        name: trackName,
        type: "audio",
        elements: [],
        muted: false,
      };
    case "effect":
      return {
        id,
        name: trackName,
        type: "effect",
        elements: [],
        hidden: false,
      };
    default:
      throw new Error(`Unsupported track type: ${type}`);
  }
}
