import type { MediaAsset, MediaType } from "./types";

// Lightweight type predicates and File → MediaType inference. The
// upload flow uses getMediaTypeFromFile to dispatch import logic per
// kind; mediaSupportsAudio gates UI affordances like volume sliders.

export const SUPPORTS_AUDIO: readonly MediaType[] = ["audio", "video"];

export function mediaSupportsAudio({
  media,
}: {
  media: MediaAsset | null | undefined;
}): boolean {
  if (!media) return false;
  return SUPPORTS_AUDIO.includes(media.type);
}

export const getMediaTypeFromFile = ({
  file,
}: {
  file: File;
}): MediaType | null => {
  const { type } = file;

  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }

  return null;
};
