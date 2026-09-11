import { clampDb } from "./audio-state";
import { VOLUME_DB_MAX, VOLUME_DB_MIN } from "./audio-constants";

const SLIDER_CURVE_EXPONENT = 2;
const MIN_DISPLAY_DB = -40;
const WAVEFORM_BAR_EXPONENT = 1.5;
const MIN_LINEAR_GAIN = 10 ** (VOLUME_DB_MIN / 20);
const MAX_LINEAR_GAIN = 10 ** (VOLUME_DB_MAX / 20);
const LINEAR_GAIN_RANGE = MAX_LINEAR_GAIN - MIN_LINEAR_GAIN;

function getNormalizedGainFromDb({ db }: { db: number }): number {
  const clampedDb = clampDb(db);
  const linearGain = 10 ** (clampedDb / 20);
  return (linearGain - MIN_LINEAR_GAIN) / LINEAR_GAIN_RANGE;
}

/**
 * Maps the clip's volume setting to the line position. The curve is defined in
 * linear gain space so dragging near 0 dB is precise while mute compresses into
 * the bottom of the clip.
 */
export function getLinePosFromDb({ db }: { db: number }): number {
  const normalizedGain = Math.max(
    0,
    Math.min(1, getNormalizedGainFromDb({ db })),
  );
  const progress = normalizedGain ** (1 / SLIDER_CURVE_EXPONENT);
  return (1 - progress) * 100;
}

/**
 * Inverse of getLinePosFromDb. Converts a drag position back into the clip's
 * volume setting without depending on the underlying audio content.
 */
export function getDbFromLinePos({ percent }: { percent: number }): number {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const progress = 1 - clampedPercent / 100;
  const normalizedGain = progress ** SLIDER_CURVE_EXPONENT;
  const linearGain = MIN_LINEAR_GAIN + normalizedGain * LINEAR_GAIN_RANGE;
  return clampDb(20 * Math.log10(linearGain));
}

/**
 * Maps an output amplitude (raw sample amplitude × gain) to a visible waveform
 * height fraction using a dB scale. Agnostic to whether the input is peak or
 * RMS — the caller decides which measure feeds this function; the mapping
 * curve is the same either way.
 *
 * The log scale keeps quiet content visible while reserving the top of the
 * element for amplitudes that approach 0 dBFS.
 */
export function getBarFractionFromOutputAmplitude({
  outputAmplitude,
}: {
  outputAmplitude: number;
}): number {
  if (outputAmplitude <= 0) return 0;
  const db = 20 * Math.log10(outputAmplitude);
  if (db <= MIN_DISPLAY_DB) return 0;
  return Math.min(
    1,
    ((db - MIN_DISPLAY_DB) / -MIN_DISPLAY_DB) ** WAVEFORM_BAR_EXPONENT,
  );
}
