// Shared helpers for the timeline UI.

// DataTransfer MIME for dragging an animation clip from the Animations drawer
// onto a character's lane in the timeline. Payload is JSON: { media_id, name }.
export const ANIMATION_CLIP_MIME = "application/x-artcraft-animation-clip";

// Seconds → "m:ss" (e.g. 10 → "0:10", 65 → "1:05").
export const formatTimecode = (seconds: number): string => {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Seconds → "m:ss:ff" frame timecode (e.g. 3.6667s @ 30fps → "0:03:20").
// Used for the transport readout so the scrub position reads in frames.
export const formatTimecodeFrames = (seconds: number, fps: number): string => {
  const totalFrames = Math.round(Math.max(0, seconds) * fps);
  const totalSeconds = Math.floor(totalFrames / fps);
  const frames = totalFrames % fps;
  return `${formatTimecode(totalSeconds)}:${frames
    .toString()
    .padStart(2, "0")}`;
};

// Quantize a scrubbed/dragged time to the timeline's frame grid so the
// playhead and keyframes land on frame boundaries, not arbitrary floats.
export const quantizeToFrame = (seconds: number, fps: number): number =>
  Math.round(seconds * fps) / fps;

// Position (0..1) of a time within [0, duration].
export const timeToFraction = (time: number, duration: number): number =>
  duration <= 0 ? 0 : Math.max(0, Math.min(1, time / duration));

// Convert a pointer x within a track lane element to a time in [0, duration].
export const fractionToTime = (fraction: number, duration: number): number =>
  Math.max(0, Math.min(1, fraction)) * duration;
