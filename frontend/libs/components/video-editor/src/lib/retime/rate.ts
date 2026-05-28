export const DEFAULT_RETIME_RATE = 1;
export const MIN_RETIME_RATE = 0.01;
export const MAX_RETIME_RATE = 5;

// "Rate" is the playback-speed multiplier — 2.0 = play 2x as fast,
// 0.5 = play at half speed. clampRetimeRate guards against NaN, 0, and
// out-of-bounds values: invalid input → DEFAULT_RETIME_RATE (no retime).
export function clampRetimeRate({ rate }: { rate: number }): number {
  if (!Number.isFinite(rate) || rate <= 0) {
    return DEFAULT_RETIME_RATE;
  }

  return Math.min(Math.max(rate, MIN_RETIME_RATE), MAX_RETIME_RATE);
}

export function canMaintainPitch({ rate }: { rate: number }): boolean {
  return Number.isFinite(rate) && rate > 0;
}

export function shouldMaintainPitch({
  rate,
  maintainPitch,
}: {
  rate: number;
  maintainPitch?: boolean;
}): boolean {
  return maintainPitch === true && canMaintainPitch({ rate });
}
