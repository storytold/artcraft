// iOS Safari has no system audio library, so a bare `accept="audio/*"` makes
// the file input fall back to the Photos picker (photos and videos only) —
// on a phone the only thing users could "attach as audio" was a video.
// Listing concrete audio MIME types and extensions instead makes iOS open the
// Files picker filtered to audio; desktop browsers filter identically.
export const AUDIO_FILE_ACCEPT = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
  "audio/flac",
  "audio/webm",
  "audio/aiff",
  "audio/x-aiff",
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".oga",
  ".opus",
  ".flac",
  ".weba",
  ".aiff",
  ".aif",
].join(",");

export const AUDIO_FILE_TYPE_ERROR =
  "Please choose an audio file (MP3, WAV, M4A, FLAC…)";

const AUDIO_FILE_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "oga",
  "opus",
  "flac",
  "weba",
  "aiff",
  "aif",
]);

// Guards the audio-ref paths against non-audio picks (Android "any file"
// pickers, drag-and-drop, older iOS). Checks the extension as well as the
// MIME type because some platforms report .m4a as `video/mp4`.
export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_FILE_EXTENSIONS.has(extension);
}
