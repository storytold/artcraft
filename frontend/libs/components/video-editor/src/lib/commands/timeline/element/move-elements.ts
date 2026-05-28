import {
  Command,
  createElementSelectionResult,
  type CommandResult,
} from "../../base-command";
import { EditorCore } from "../../../core";
import type { SceneTracks, TimelineElement, TimelineTrack } from "../../../timeline/types";
import {
  buildEmptyTrack,
  validateElementTrackCompatibility,
} from "../../../timeline/placement";
import type {
  PlannedElementMove,
  PlannedTrackCreation,
} from "../../../timeline/group-move";
import { findTrackInSceneTracks } from "../../../timeline/track-element-update";

export class MoveElementCommand extends Command {
  private savedState: SceneTracks | null = null;

  constructor({
    moves,
    createTracks = [],
  }: {
    moves: PlannedElementMove[];
    createTracks?: PlannedTrackCreation[];
  }) {
    super();
    this.moves = moves;
    this.createTracks = createTracks;
  }

  private readonly moves: PlannedElementMove[];
  private readonly createTracks: PlannedTrackCreation[];

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    let tracksToUpdate = this.savedState;
    for (const createTrack of [...this.createTracks].sort(
      (firstTrack, secondTrack) => firstTrack.index - secondTrack.index,
    )) {
      tracksToUpdate = insertTrackAtDisplayIndex({
        tracks: tracksToUpdate,
        track: buildEmptyTrack({
          id: createTrack.id,
          type: createTrack.type,
        }),
        insertIndex: createTrack.index,
      });
    }

    const movedElementsById = new Map<string, TimelineElement>();
    for (const move of this.moves) {
      const sourceTrack = findTrackInSceneTracks({
        tracks: this.savedState,
        trackId: move.sourceTrackId,
      });
      const sourceElement = sourceTrack?.elements.find(
        (trackElement) => trackElement.id === move.elementId,
      );
      if (!sourceTrack || !sourceElement) {
        throw new Error("Source track or element not found");
      }

      const targetTrack = findTrackInSceneTracks({
        tracks: tracksToUpdate,
        trackId: move.targetTrackId,
      });
      if (!targetTrack) {
        throw new Error("Target track not found");
      }

      const validation = validateElementTrackCompatibility({
        element: sourceElement,
        track: targetTrack,
      });
      if (!validation.isValid) {
        throw new Error(validation.errorMessage);
      }

      movedElementsById.set(move.elementId, {
        ...sourceElement,
        startTime: move.newStartTime,
      });
    }

    const movedElementIds = new Set(this.moves.map((move) => move.elementId));
    const movedElementsByTargetTrackId = new Map<string, TimelineElement[]>();
    for (const move of this.moves) {
      const movedElement = movedElementsById.get(move.elementId);
      if (!movedElement) {
        continue;
      }

      const nextTargetElements =
        movedElementsByTargetTrackId.get(move.targetTrackId) ?? [];
      nextTargetElements.push(movedElement);
      movedElementsByTargetTrackId.set(move.targetTrackId, nextTargetElements);
    }

    const updatedTracks = mapSceneTracks({
      tracks: tracksToUpdate,
      update: (track) => ({
        ...track,
        elements: [
          ...track.elements.filter(
            (element) => !movedElementIds.has(element.id),
          ),
          ...(movedElementsByTargetTrackId.get(track.id) ?? []),
        ],
      }),
    });

    editor.timeline.updateTracks(updatedTracks);
    return createElementSelectionResult(
      this.moves.map(({ elementId, targetTrackId }) => ({
        trackId: targetTrackId,
        elementId,
      })),
    );
  }

  undo(): void {
    if (this.savedState) {
      const editor = EditorCore.getInstance();
      editor.timeline.updateTracks(this.savedState);
    }
  }
}

function mapSceneTracks({
  tracks,
  update,
}: {
  tracks: SceneTracks;
  update: <TTrack extends TimelineTrack>(track: TTrack) => TTrack;
}): SceneTracks {
  return {
    overlay: tracks.overlay.map((track) => update(track)),
    main: update(tracks.main),
    audio: tracks.audio.map((track) => update(track)),
  };
}

function insertTrackAtDisplayIndex({
  tracks,
  track,
  insertIndex,
}: {
  tracks: SceneTracks;
  track: TimelineTrack;
  insertIndex: number;
}): SceneTracks {
  if (track.type === "audio") {
    const audioInsertIndex = Math.max(
      0,
      Math.min(insertIndex - tracks.overlay.length - 1, tracks.audio.length),
    );
    return {
      ...tracks,
      audio: [
        ...tracks.audio.slice(0, audioInsertIndex),
        track,
        ...tracks.audio.slice(audioInsertIndex),
      ],
    };
  }

  const overlayInsertIndex = Math.max(
    0,
    Math.min(insertIndex, tracks.overlay.length),
  );
  return {
    ...tracks,
    overlay: [
      ...tracks.overlay.slice(0, overlayInsertIndex),
      track,
      ...tracks.overlay.slice(overlayInsertIndex),
    ],
  };
}
