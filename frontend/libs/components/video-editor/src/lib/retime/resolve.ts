import type { RetimeConfig } from "../timeline/types";
import { clampRetimeRate } from "./rate";

// Maps between "clip time" (timeline position within the clip) and
// "source time" (position within the original media buffer). At
// rate=2.0 a clip-time second corresponds to 2 source-time seconds.
//
// getEffectiveRateAt takes a `clipTime` arg in the signature for
// forward-compat with variable-rate retime, but today returns the
// constant rate regardless.

function getSafeRate({ rate }: { rate: number }): number {
  return clampRetimeRate({ rate });
}

export function getSourceTimeAtClipTime({
  clipTime,
  retime,
}: {
  clipTime: number;
  retime?: RetimeConfig;
}): number {
  return clipTime * getSafeRate({ rate: retime?.rate ?? 1 });
}

export function getClipTimeAtSourceTime({
  sourceTime,
  retime,
}: {
  sourceTime: number;
  retime?: RetimeConfig;
}): number {
  return sourceTime / getSafeRate({ rate: retime?.rate ?? 1 });
}

export function getEffectiveRateAt({
  retime,
}: {
  clipTime?: number;
  retime?: RetimeConfig;
}): number {
  return getSafeRate({ rate: retime?.rate ?? 1 });
}

export function getTimelineDurationForSourceSpan({
  sourceSpan,
  retime,
}: {
  sourceSpan: number;
  retime?: RetimeConfig;
}): number {
  if (sourceSpan <= 0) {
    return 0;
  }
  return sourceSpan / getSafeRate({ rate: retime?.rate ?? 1 });
}
