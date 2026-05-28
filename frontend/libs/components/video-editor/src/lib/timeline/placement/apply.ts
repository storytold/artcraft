import type {
  AudioTrack,
  EffectTrack,
  GraphicTrack,
  OverlayTrack,
  SceneTracks,
  TextTrack,
  TimelineElement,
  VideoTrack,
} from "../types";
import { generateUUID } from "../../utils/id";
import { buildEmptyTrack } from "./track-factory";
import type { PlacementResult } from "./types";
import { updateTrackInSceneTracks } from "../track-element-update";

// Materializes a PlacementResult into an updated SceneTracks. For
// existingTrack we append to that track's elements; for newTrack we
// create the empty track via buildEmptyTrack and insert it at the
// computed index. The audio insert-index is in the linearized
// [...overlay, main, ...audio] coord space, so audio tracks need an
// extra translation step to get the local index inside `tracks.audio`.

export function applyPlacement({
  tracks,
  placementResult,
  elements,
  newTrackInsertIndexOverride,
}: {
  tracks: SceneTracks;
  placementResult: PlacementResult;
  elements: TimelineElement[];
  newTrackInsertIndexOverride?: number;
}): { updatedTracks: SceneTracks; targetTrackId: string } | null {
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];
  if (placementResult.kind === "existingTrack") {
    const targetTrack = orderedTracks[placementResult.trackIndex];
    if (!targetTrack) {
      return null;
    }

    const updatedTracks = updateTrackInSceneTracks({
      tracks,
      trackId: targetTrack.id,
      update: (track) => ({
        ...track,
        elements: [...track.elements, ...elements],
      }),
    });

    return { updatedTracks, targetTrackId: targetTrack.id };
  }

  const newTrackId = generateUUID();
  const insertIndex =
    newTrackInsertIndexOverride ?? placementResult.insertIndex;
  const updatedTracks =
    placementResult.trackType === "audio"
      ? {
          ...tracks,
          audio: insertIntoAudioTracks({
            tracks,
            insertIndex,
            track: buildPlacedAudioTrack({
              id: newTrackId,
              elements,
            }),
          }),
        }
      : {
          ...tracks,
          overlay: insertIntoOverlayTracks({
            tracks,
            insertIndex,
            track: buildPlacedOverlayTrack({
              id: newTrackId,
              type: placementResult.trackType,
              elements,
            }),
          }),
        };
  return { updatedTracks, targetTrackId: newTrackId };
}

function insertIntoOverlayTracks({
  tracks,
  insertIndex,
  track,
}: {
  tracks: SceneTracks;
  insertIndex: number;
  track: OverlayTrack;
}): OverlayTrack[] {
  const normalizedInsertIndex = Math.max(
    0,
    Math.min(insertIndex, tracks.overlay.length),
  );
  const nextTracks = [...tracks.overlay];
  nextTracks.splice(normalizedInsertIndex, 0, track);
  return nextTracks;
}

function insertIntoAudioTracks({
  tracks,
  insertIndex,
  track,
}: {
  tracks: SceneTracks;
  insertIndex: number;
  track: AudioTrack;
}): AudioTrack[] {
  const audioInsertIndex = Math.max(
    0,
    Math.min(insertIndex - tracks.overlay.length - 1, tracks.audio.length),
  );
  const nextTracks = [...tracks.audio];
  nextTracks.splice(audioInsertIndex, 0, track);
  return nextTracks;
}

function buildPlacedAudioTrack({
  id,
  elements,
}: {
  id: string;
  elements: TimelineElement[];
}): AudioTrack {
  return {
    ...buildEmptyTrack({ id, type: "audio" }),
    elements: elements as AudioTrack["elements"],
  };
}

function buildPlacedOverlayTrack({
  id,
  type,
  elements,
}: {
  id: string;
  type: Exclude<OverlayTrack["type"], "audio">;
  elements: TimelineElement[];
}): OverlayTrack {
  switch (type) {
    case "video":
      return {
        ...buildEmptyTrack({ id, type: "video" }),
        elements: elements as VideoTrack["elements"],
      };
    case "text":
      return {
        ...buildEmptyTrack({ id, type: "text" }),
        elements: elements as TextTrack["elements"],
      };
    case "graphic":
      return {
        ...buildEmptyTrack({ id, type: "graphic" }),
        elements: elements as GraphicTrack["elements"],
      };
    case "effect":
      return {
        ...buildEmptyTrack({ id, type: "effect" }),
        elements: elements as EffectTrack["elements"],
      };
  }
}
