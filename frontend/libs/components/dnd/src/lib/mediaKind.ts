import { MediaKind } from "./types";

// Resolves a `MediaKind` from the three ways media enters a drag:
//   1. an OS File's MIME type,
//   2. a file name / OS path extension (generalizes the old
//      `getModalTypeForFileName` in GlobalFileDropHandler),
//   3. a gallery item's `mediaClass`.
// One place to map all of them keeps media-type-safety consistent everywhere.

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif", "heic", "heif"]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "mkv", "avi", "m4v"]);
const AUDIO_EXT = new Set(["mp3", "wav", "m4a", "ogg", "oga", "aac", "flac"]);
const MODEL_EXT = new Set(["glb", "gltf", "fbx"]);
const SPLAT_EXT = new Set(["spz", "splat", "ply"]);

export function mediaKindFromFileName(name: string): MediaKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (MODEL_EXT.has(ext)) return "model3d";
  if (SPLAT_EXT.has(ext)) return "splat";
  return null;
}

export function mediaKindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export function mediaKindFromFile(file: File): MediaKind | null {
  // MIME is often empty for 3D/splat files — fall back to the extension.
  return mediaKindFromMime(file.type) ?? mediaKindFromFileName(file.name);
}

export function mediaKindFromMediaClass(mediaClass?: string): MediaKind | null {
  switch (mediaClass) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "dimensional":
      return "model3d";
    default:
      return null;
  }
}
