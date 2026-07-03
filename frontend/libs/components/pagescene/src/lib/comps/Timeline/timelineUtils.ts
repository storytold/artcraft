// Shared helpers for the timeline UI.

// Seconds → "m:ss" (e.g. 10 → "0:10", 65 → "1:05").
export const formatTimecode = (seconds: number): string => {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Position (0..1) of a time within [0, duration].
export const timeToFraction = (time: number, duration: number): number =>
  duration <= 0 ? 0 : Math.max(0, Math.min(1, time / duration));

// Convert a pointer x within a track lane element to a time in [0, duration].
export const fractionToTime = (fraction: number, duration: number): number =>
  Math.max(0, Math.min(1, fraction)) * duration;
