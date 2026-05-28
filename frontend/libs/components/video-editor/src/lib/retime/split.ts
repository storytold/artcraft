import type { RetimeConfig } from "../timeline/types";
import { getSourceTimeAtClipTime } from "./resolve";

// Split + trim helpers. For constant-rate retime, splitting a clip
// passes the retime config to both halves unchanged. Variable-rate
// retime (when added) would need to split the rate curve here.

export function getSourceSpanAtClipTime({
  clipTime,
  retime,
}: {
  clipTime: number;
  retime?: RetimeConfig;
}): number {
  return Math.max(0, getSourceTimeAtClipTime({ clipTime, retime }));
}

export function splitRetimeAtClipTime({
  retime,
}: {
  retime?: RetimeConfig;
  splitClipTime: number;
}): {
  left: RetimeConfig | undefined;
  right: RetimeConfig | undefined;
} {
  return { left: retime, right: retime };
}

export function adjustRetimeForTrimChange({
  retime,
}: {
  retime?: RetimeConfig;
  clipTrimTime: number;
  side: "start" | "end";
}): RetimeConfig | undefined {
  return retime;
}
