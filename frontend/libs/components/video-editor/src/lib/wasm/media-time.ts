import {
  lastFrameTime as _lastFrameTime,
  parseTimecode as _parseTimecode,
  roundToFrame as _roundToFrame,
  snappedSeekTime as _snappedSeekTime,
  TICKS_PER_SECOND as _TICKS_PER_SECOND,
  mediaTimeFromSeconds as _mediaTimeFromSeconds,
  mediaTimeToSeconds as _mediaTimeToSeconds,
  type FrameRate,
  type TimeCodeFormat,
} from "opencut-wasm";

// Integer-tick time. Mirrors MediaTime(i64) in rust/crates/time/src/media_time.rs.
// opencut-wasm exposes MediaTime as a bare number because tsify collapses tuple
// structs; the brand here is the TS-side discipline that recovers the invariant.
// Reading a MediaTime as a number is free; writing requires going through the
// constructors below (round/from-seconds/etc.) which check for integer ticks.
export type MediaTime = number & { readonly __mediaTime: unique symbol };

export const TICKS_PER_SECOND = _TICKS_PER_SECOND();

function isMediaTime(value: number): value is MediaTime {
  return Number.isInteger(value);
}

function requireMediaTime({
  value,
  context,
}: {
  value: number;
  context: string;
}): MediaTime {
  if (!isMediaTime(value)) {
    throw new Error(`${context}: expected an integer tick count, got ${value}`);
  }
  return value;
}

export const ZERO_MEDIA_TIME = requireMediaTime({
  value: 0,
  context: "ZERO_MEDIA_TIME",
});

export function mediaTime({ ticks }: { ticks: number }): MediaTime {
  return requireMediaTime({
    value: ticks,
    context: "mediaTime()",
  });
}

// Round half away from zero — matches Rust's .round() and avoids the
// Math.round(-0.5) === -0 quirk that would propagate -0 into stored data.
export function roundMediaTime({ time }: { time: number }): MediaTime {
  const roundedMagnitude = Math.round(Math.abs(time));
  if (roundedMagnitude === 0) {
    return ZERO_MEDIA_TIME;
  }
  return requireMediaTime({
    value: time < 0 ? -roundedMagnitude : roundedMagnitude,
    context: "roundMediaTime()",
  });
}

export function mediaTimeFromSeconds({
  seconds,
}: {
  seconds: number;
}): MediaTime {
  const result = _mediaTimeFromSeconds({ seconds });
  if (result === undefined) {
    throw new Error(
      `mediaTimeFromSeconds: rust returned undefined for seconds=${seconds}`,
    );
  }
  return requireMediaTime({
    value: result,
    context: "mediaTimeFromSeconds()",
  });
}

export function mediaTimeToSeconds({ time }: { time: MediaTime }): number {
  return _mediaTimeToSeconds({ time });
}

export function addMediaTime({
  a,
  b,
}: {
  a: MediaTime;
  b: MediaTime;
}): MediaTime {
  return requireMediaTime({
    value: a + b,
    context: "addMediaTime()",
  });
}

export function subMediaTime({
  a,
  b,
}: {
  a: MediaTime;
  b: MediaTime;
}): MediaTime {
  return requireMediaTime({
    value: a - b,
    context: "subMediaTime()",
  });
}

export function maxMediaTime({
  a,
  b,
}: {
  a: MediaTime;
  b: MediaTime;
}): MediaTime {
  return a > b ? a : b;
}

export function minMediaTime({
  a,
  b,
}: {
  a: MediaTime;
  b: MediaTime;
}): MediaTime {
  return a < b ? a : b;
}

export function clampMediaTime({
  time,
  min,
  max,
}: {
  time: MediaTime;
  min: MediaTime;
  max: MediaTime;
}): MediaTime {
  if (time < min) return min;
  if (time > max) return max;
  return time;
}

export function roundFrameTime({
  time,
  fps,
}: {
  time: MediaTime;
  fps: FrameRate;
}): MediaTime {
  return requireMediaTime({
    value: _roundToFrame({ time, rate: fps }) ?? time,
    context: "roundFrameTime()",
  });
}

export function roundFrameTicks({
  ticks,
  fps,
}: {
  ticks: number;
  fps: FrameRate;
}): number {
  return _roundToFrame({ time: ticks, rate: fps }) ?? ticks;
}

export function snapSeekMediaTime({
  time,
  duration,
  fps,
}: {
  time: MediaTime;
  duration: MediaTime;
  fps: FrameRate;
}): MediaTime {
  return requireMediaTime({
    value: _snappedSeekTime({ time, duration, rate: fps }) ?? time,
    context: "snapSeekMediaTime()",
  });
}

export function lastFrameMediaTime({
  duration,
  fps,
}: {
  duration: MediaTime;
  fps: FrameRate;
}): MediaTime {
  return requireMediaTime({
    value: _lastFrameTime({ duration, rate: fps }) ?? duration,
    context: "lastFrameMediaTime()",
  });
}

export function parseMediaTimecode({
  timeCode,
  format,
  fps,
}: {
  timeCode: string;
  format: TimeCodeFormat;
  fps: FrameRate;
}): MediaTime | null {
  const parsedTime = _parseTimecode({ timeCode, format, rate: fps });
  if (parsedTime == null) {
    return null;
  }
  return requireMediaTime({
    value: parsedTime,
    context: "parseMediaTimecode()",
  });
}
