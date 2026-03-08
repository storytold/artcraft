import { PIXELS_PER_SECOND } from "../../constants/timeline";

interface TickMark {
  time: number;
  x: number;
  isMajor: boolean;
  label?: string;
}

export function generateRulerTicks(
  visibleStartTime: number,
  visibleEndTime: number,
  zoomLevel: number,
): TickMark[] {
  const pps = PIXELS_PER_SECOND * zoomLevel;
  // Determine tick interval based on zoom
  let interval: number;
  if (pps >= 200) interval = 0.5;
  else if (pps >= 100) interval = 1;
  else if (pps >= 50) interval = 2;
  else if (pps >= 20) interval = 5;
  else if (pps >= 10) interval = 10;
  else interval = 30;

  const majorEvery = interval >= 1 ? Math.max(1, Math.round(5 * interval) / interval) : 2;
  const startTick = Math.floor(visibleStartTime / interval) * interval;
  const ticks: TickMark[] = [];

  for (let time = startTick; time <= visibleEndTime + interval; time += interval) {
    const roundedTime = Math.round(time * 1000) / 1000;
    const tickIndex = Math.round(roundedTime / interval);
    const isMajor = tickIndex % majorEvery === 0;
    ticks.push({
      time: roundedTime,
      x: roundedTime * pps,
      isMajor,
      label: isMajor ? formatRulerTime(roundedTime) : undefined,
    });
  }

  return ticks;
}

export function formatRulerTime(seconds: number): string {
  if (seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frac = Math.round((seconds % 1) * 10);
  if (frac > 0 && seconds < 60) {
    return `${secs}.${frac}s`;
  }
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}
