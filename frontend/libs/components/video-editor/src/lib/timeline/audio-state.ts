import { hasKeyframesForPath } from "../animation/keyframe-query";
import { resolveNumberAtTime } from "../animation/values";
import { VOLUME_DB_MAX, VOLUME_DB_MIN } from "./audio-constants";
import type { TimelineElement } from "./types";
import { TICKS_PER_SECOND } from "../wasm";

// Audio gain resolution: walks volume keyframes + mute flags to compute
// the effective per-frame gain for an audio-capable element. Used by
// the playback engine (live audio) and the waveform renderer (visual
// gain bars match what you'll hear).

const DEFAULT_STEP_SECONDS = 1 / 60;

export type AudioCapableElement = Extract<
  TimelineElement,
  { type: "audio" | "video" }
>;

export function clampDb(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(VOLUME_DB_MAX, Math.max(VOLUME_DB_MIN, value));
}

export function dBToLinear(db: number): number {
  return 10 ** (clampDb(db) / 20);
}

export function getElementVolume({
  element,
}: {
  element: AudioCapableElement;
}): number {
  const value = element.params.volume;
  return typeof value === "number" ? value : 0;
}

export function isElementMuted({
  element,
}: {
  element: AudioCapableElement;
}): boolean {
  return element.params.muted === true;
}

export function hasAnimatedVolume({
  element,
}: {
  element: AudioCapableElement;
}): boolean {
  return hasKeyframesForPath({
    animations: element.animations,
    propertyPath: "volume",
  });
}

export function resolveEffectiveAudioGain({
  element,
  trackMuted = false,
  localTime,
}: {
  element: AudioCapableElement;
  trackMuted?: boolean;
  localTime: number;
}): number {
  if (trackMuted || isElementMuted({ element })) {
    return 0;
  }

  const resolvedDb = resolveNumberAtTime({
    baseValue: getElementVolume({ element }),
    animations: element.animations,
    propertyPath: "volume",
    localTime: Math.round(localTime * TICKS_PER_SECOND),
  });

  return dBToLinear(resolvedDb);
}

export function buildWaveformGainSamples({
  element,
  count,
}: {
  element: AudioCapableElement;
  count: number;
}): number[] {
  const durationSeconds = element.duration / TICKS_PER_SECOND;
  return Array.from({ length: count }, (_, i) => {
    const localTime = ((i + 0.5) / count) * durationSeconds;
    return resolveEffectiveAudioGain({ element, localTime });
  });
}

export function buildAudioGainAutomation({
  element,
  trackMuted = false,
  fromLocalTime,
  toLocalTime,
  stepSeconds = DEFAULT_STEP_SECONDS,
}: {
  element: AudioCapableElement;
  trackMuted?: boolean;
  fromLocalTime: number;
  toLocalTime: number;
  stepSeconds?: number;
}): Array<{ localTime: number; gain: number }> {
  const startTime = Math.max(0, fromLocalTime);
  const endTime = Math.max(startTime, toLocalTime);
  const safeStep =
    Number.isFinite(stepSeconds) && stepSeconds > 0
      ? stepSeconds
      : DEFAULT_STEP_SECONDS;
  const points: Array<{ localTime: number; gain: number }> = [];

  for (let localTime = startTime; localTime < endTime; localTime += safeStep) {
    points.push({
      localTime,
      gain: resolveEffectiveAudioGain({
        element,
        trackMuted,
        localTime,
      }),
    });
  }

  points.push({
    localTime: endTime,
    gain: resolveEffectiveAudioGain({
      element,
      trackMuted,
      localTime: endTime,
    }),
  });

  return points;
}
