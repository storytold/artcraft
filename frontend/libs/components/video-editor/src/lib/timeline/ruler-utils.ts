import type { FrameRate } from "opencut-wasm";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "./scale";
import { frameRateToFloat } from "../fps/utils";

// Ruler tick + label interval calculations. Labels and ticks scale
// independently because labels need wide spacing (~120px) to stay
// readable while ticks can be much denser (~18px) to show finer
// subdivisions. The frame intervals start at 2 so labels always have
// at least one intermediate tick between them, even at maximum zoom.

// Frame intervals for labels — pattern matches CapCut (2, 3, 5, 10, 15).
const LABEL_FRAME_INTERVALS = [2, 3, 5, 10, 15] as const;

// Frame intervals for ticks — denser than labels, can go down to 1.
const TICK_FRAME_INTERVALS = [1, 2, 3, 5, 10, 15] as const;

// Second multipliers used when zoomed out past frame-level detail.
const SECOND_MULTIPLIERS = [
  1, 2, 3, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
] as const;

const MIN_LABEL_SPACING_PX = 120;
const MIN_TICK_SPACING_PX = 18;

export interface RulerConfig {
  // Time interval in seconds between each label.
  labelIntervalSeconds: number;
  // Time interval in seconds between each tick.
  tickIntervalSeconds: number;
}

// Picks tick + label intervals based on zoom level and project FPS.
// Labels and ticks scale independently because they have different
// minimum-spacing budgets. After choosing each, ensureTickDividesLabel
// reconciles them so labels always land on tick positions.
export function getRulerConfig({
  zoomLevel,
  fps,
}: {
  zoomLevel: number;
  fps: FrameRate;
}): RulerConfig {
  const fpsFloat = frameRateToFloat(fps);
  const pixelsPerSecond = BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel;
  const pixelsPerFrame = pixelsPerSecond / fpsFloat;

  const labelIntervalSeconds = findOptimalInterval({
    pixelsPerFrame,
    pixelsPerSecond,
    fps: fpsFloat,
    minSpacingPx: MIN_LABEL_SPACING_PX,
    frameIntervals: LABEL_FRAME_INTERVALS,
  });

  const rawTickIntervalSeconds = findOptimalInterval({
    pixelsPerFrame,
    pixelsPerSecond,
    fps: fpsFloat,
    minSpacingPx: MIN_TICK_SPACING_PX,
    frameIntervals: TICK_FRAME_INTERVALS,
  });

  const tickIntervalSeconds = ensureTickDividesLabel({
    tickIntervalSeconds: rawTickIntervalSeconds,
    labelIntervalSeconds,
    pixelsPerFrame,
    pixelsPerSecond,
    fps: fpsFloat,
  });

  return { labelIntervalSeconds, tickIntervalSeconds };
}

// Adjusts tick interval so it divides evenly into the label interval —
// guarantees labels always land on tick positions.
function ensureTickDividesLabel({
  tickIntervalSeconds,
  labelIntervalSeconds,
  pixelsPerFrame,
  pixelsPerSecond,
  fps,
}: {
  tickIntervalSeconds: number;
  labelIntervalSeconds: number;
  pixelsPerFrame: number;
  pixelsPerSecond: number;
  fps: number;
}): number {
  const labelFrames = Math.round(labelIntervalSeconds * fps);
  const tickFrames = Math.round(tickIntervalSeconds * fps);

  if (labelFrames % tickFrames === 0) {
    return tickIntervalSeconds;
  }

  for (const candidateFrames of TICK_FRAME_INTERVALS) {
    if (labelFrames % candidateFrames === 0) {
      const candidateSpacing = pixelsPerFrame * candidateFrames;
      if (candidateSpacing >= MIN_TICK_SPACING_PX) {
        return candidateFrames / fps;
      }
    }
  }

  for (const candidateSeconds of SECOND_MULTIPLIERS) {
    const ratio = labelIntervalSeconds / candidateSeconds;
    const isDivisor = Math.abs(ratio - Math.round(ratio)) < 0.0001;
    if (isDivisor) {
      const candidateSpacing = pixelsPerSecond * candidateSeconds;
      if (candidateSpacing >= MIN_TICK_SPACING_PX) {
        return candidateSeconds;
      }
    }
  }

  return labelIntervalSeconds;
}

function findOptimalInterval({
  pixelsPerFrame,
  pixelsPerSecond,
  fps,
  minSpacingPx,
  frameIntervals,
}: {
  pixelsPerFrame: number;
  pixelsPerSecond: number;
  fps: number;
  minSpacingPx: number;
  frameIntervals: readonly number[];
}): number {
  for (const frameInterval of frameIntervals) {
    const pixelSpacing = pixelsPerFrame * frameInterval;
    if (pixelSpacing >= minSpacingPx) {
      return frameInterval / fps;
    }
  }

  for (const secondMultiplier of SECOND_MULTIPLIERS) {
    const pixelSpacing = pixelsPerSecond * secondMultiplier;
    if (pixelSpacing >= minSpacingPx) {
      return secondMultiplier;
    }
  }

  return 60;
}

export function shouldShowLabel({
  time,
  labelIntervalSeconds,
}: {
  time: number;
  labelIntervalSeconds: number;
}): boolean {
  const epsilon = 0.0001;
  const remainder = time % labelIntervalSeconds;
  return remainder < epsilon || remainder > labelIntervalSeconds - epsilon;
}

// Formats a ruler tick label:
//   - on second boundaries: "MM:SS" (or "H:MM:SS" past 1 hour)
//   - between seconds:     "Xf"    (frames within the current second)
export function formatRulerLabel({
  timeInSeconds,
  fps,
}: {
  timeInSeconds: number;
  fps: FrameRate;
}): string {
  if (isSecondBoundary({ timeInSeconds })) {
    return formatTimestamp({ timeInSeconds });
  }

  const frameWithinSecond = getFrameWithinSecond({ timeInSeconds, fps: frameRateToFloat(fps) });
  return `${frameWithinSecond}f`;
}

function isSecondBoundary({
  timeInSeconds,
}: {
  timeInSeconds: number;
}): boolean {
  const epsilon = 0.0001;
  const remainder = timeInSeconds % 1;
  return remainder < epsilon || remainder > 1 - epsilon;
}

function getFrameWithinSecond({
  timeInSeconds,
  fps,
}: {
  timeInSeconds: number;
  fps: number;
}): number {
  const fractionalPart = timeInSeconds % 1;
  return Math.round(fractionalPart * fps);
}

function formatTimestamp({ timeInSeconds }: { timeInSeconds: number }): string {
  const totalSeconds = Math.round(timeInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}
