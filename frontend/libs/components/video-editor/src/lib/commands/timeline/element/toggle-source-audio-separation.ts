import { EditorCore } from "../../../core";
import { Command, type CommandResult } from "../../base-command";
import {
  buildSeparatedAudioElement,
  canExtractSourceAudio,
  isSourceAudioSeparated,
} from "../../../timeline/audio-separation";
import {
  applyPlacement,
  resolveTrackPlacement,
} from "../../../timeline/placement";
import { updateElementInSceneTracks } from "../../../timeline/track-element-update";
import type {
  SceneTracks,
  TimelineElement,
  VideoElement,
} from "../../../timeline/types";
import { generateUUID } from "../../../utils/id";

export class ToggleSourceAudioSeparationCommand extends Command {
  private savedState: SceneTracks | null = null;

  constructor(
    private readonly params: {
      trackId: string;
      elementId: string;
    },
  ) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedState = editor.scenes.getActiveScene().tracks;

    const sourceTrack = [
      ...this.savedState.overlay,
      this.savedState.main,
      ...this.savedState.audio,
    ].find((track) => track.id === this.params.trackId);
    if (!sourceTrack) {
      return;
    }
    const sourceElement = sourceTrack.elements.find(
      (element) => element.id === this.params.elementId,
    ) as TimelineElement | undefined;
    if (!sourceElement || sourceElement.type !== "video") {
      return;
    }
    const videoElement: VideoElement = sourceElement;

    if (isSourceAudioSeparated({ element: videoElement })) {
      editor.timeline.updateTracks(
        updateSourceAudioEnabled({
          tracks: this.savedState,
          trackId: this.params.trackId,
          elementId: this.params.elementId,
          isSourceAudioEnabled: true,
        }),
      );
      return;
    }

    const mediaAsset = editor.media
      .getAssets()
      .find((asset) => asset.id === videoElement.mediaId);
    if (!canExtractSourceAudio(videoElement, mediaAsset)) {
      return;
    }
    if (videoElement.duration <= 0) {
      return;
    }

    const separatedAudioElement = {
      ...buildSeparatedAudioElement({
        sourceElement: videoElement,
      }),
      id: generateUUID(),
    };
    const placementResult = resolveTrackPlacement({
      tracks: this.savedState,
      trackType: "audio",
      timeSpans: [
        {
          startTime: separatedAudioElement.startTime,
          duration: separatedAudioElement.duration,
        },
      ],
      strategy: { type: "firstAvailable" },
    });
    if (!placementResult) {
      return;
    }
    const appliedPlacement = applyPlacement({
      tracks: this.savedState,
      placementResult,
      elements: [separatedAudioElement],
    });
    if (!appliedPlacement) {
      return;
    }

    editor.timeline.updateTracks(
      updateSourceAudioEnabled({
        tracks: appliedPlacement.updatedTracks,
        trackId: this.params.trackId,
        elementId: this.params.elementId,
        isSourceAudioEnabled: false,
      }),
    );
  }

  undo(): void {
    if (!this.savedState) {
      return;
    }

    const editor = EditorCore.getInstance();
    editor.timeline.updateTracks(this.savedState);
  }
}

function updateSourceAudioEnabled({
  tracks,
  trackId,
  elementId,
  isSourceAudioEnabled,
}: {
  tracks: SceneTracks;
  trackId: string;
  elementId: string;
  isSourceAudioEnabled: boolean;
}): SceneTracks {
  return updateElementInSceneTracks({
    tracks,
    trackId,
    elementId,
    elementPredicate: (element): element is VideoElement =>
      element.type === "video",
    update: (element) => ({
      ...element,
      isSourceAudioEnabled,
    }),
  });
}
