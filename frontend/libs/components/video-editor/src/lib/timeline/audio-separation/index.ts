import { cloneAnimations } from "../../animation";
import type { ElementAnimations } from "../../animation/types";
import type { MediaAsset } from "../../media/types";
import { DEFAULTS } from "../defaults";
import type {
  CreateUploadAudioElement,
  TimelineElement,
  AudioElement,
  VideoElement,
} from "../types";

// "Source audio separation" — extracts a video clip's audio track into
// its own AudioElement on a sibling track, so the user can mute,
// volume-curve, or move it independently. Recovery toggles back. Both
// operations only flip the VideoElement's `isSourceAudioEnabled` flag
// and (un)conjure a paired AudioElement — they don't physically split
// the source file.

type MediaAudioState = Pick<MediaAsset, "hasAudio">;

export function isSourceAudioEnabled({
  element,
}: {
  element: VideoElement;
}): boolean {
  return element.isSourceAudioEnabled !== false;
}

export function isSourceAudioSeparated({
  element,
}: {
  element: VideoElement;
}): boolean {
  return !isSourceAudioEnabled({ element });
}

export function canExtractSourceAudio(
  element: TimelineElement,
  mediaAsset: MediaAudioState | null | undefined,
): element is VideoElement {
  return (
    element.type === "video" &&
    isSourceAudioEnabled({ element }) &&
    !!mediaAsset &&
    mediaAsset.hasAudio !== false
  );
}

export function canRecoverSourceAudio(
  element: TimelineElement,
): element is VideoElement {
  return element.type === "video" && isSourceAudioSeparated({ element });
}

export function canToggleSourceAudio(
  element: TimelineElement,
  mediaAsset: MediaAudioState | null | undefined,
): element is VideoElement {
  return (
    canRecoverSourceAudio(element) || canExtractSourceAudio(element, mediaAsset)
  );
}

export function doesElementHaveEnabledAudio({
  element,
  mediaAsset,
}: {
  element: AudioElement | VideoElement;
  mediaAsset?: MediaAudioState | null;
}): boolean {
  if (element.type === "audio") {
    return true;
  }

  return (
    !!mediaAsset &&
    mediaAsset.hasAudio !== false &&
    isSourceAudioEnabled({ element })
  );
}

export function buildSeparatedAudioElement({
  sourceElement,
}: {
  sourceElement: VideoElement;
}): CreateUploadAudioElement {
  return {
    type: "audio",
    sourceType: "upload",
    mediaId: sourceElement.mediaId,
    name: sourceElement.name,
    duration: sourceElement.duration,
    startTime: sourceElement.startTime,
    trimStart: sourceElement.trimStart,
    trimEnd: sourceElement.trimEnd,
    sourceDuration: sourceElement.sourceDuration,
    params: {
      volume:
        typeof sourceElement.params.volume === "number"
          ? sourceElement.params.volume
          : DEFAULTS.element.volume,
      muted: sourceElement.params.muted === true,
    },
    retime: sourceElement.retime
      ? {
          rate: sourceElement.retime.rate,
          maintainPitch: sourceElement.retime.maintainPitch,
        }
      : undefined,
    // Clone volume keyframes onto the new element with fresh ids so
    // undo can independently retime each side.
    animations: cloneVolumeAnimations({
      animations: sourceElement.animations,
    }),
  };
}

export function getSourceAudioActionLabel({
  element,
}: {
  element: VideoElement;
}): "Extract audio" | "Recover audio" {
  return isSourceAudioSeparated({ element })
    ? "Recover audio"
    : "Extract audio";
}

function cloneVolumeAnimations({
  animations,
}: {
  animations: ElementAnimations | undefined;
}): ElementAnimations | undefined {
  const volumeData = animations?.volume;
  if (!volumeData) {
    return undefined;
  }

  return cloneAnimations({
    animations: { volume: volumeData },
    shouldRegenerateKeyframeIds: true,
  });
}
