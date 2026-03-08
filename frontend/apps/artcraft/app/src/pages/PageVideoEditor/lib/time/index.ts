export function formatTimeCode(seconds: number): string {
  if (seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${tenths}`;
}

export function getLastFrameTime(duration: number, fps: number): number {
  return Math.max(0, duration - 1 / fps);
}
