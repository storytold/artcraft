import type { RetimeConfig } from "../timeline/types";
import { clampRetimeRate } from "./rate";

// Constant-rate retime — the only kind today. Future preset variants
// (ease-in/out, custom curves) would live here.
export function buildConstantRetime({
  rate,
  maintainPitch = false,
}: {
  rate: number;
  maintainPitch?: boolean;
}): RetimeConfig {
  return { rate: clampRetimeRate({ rate }), maintainPitch };
}
