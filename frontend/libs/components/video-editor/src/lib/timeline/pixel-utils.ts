import { BASE_TIMELINE_PIXELS_PER_SECOND } from "./scale";
import { TICKS_PER_SECOND } from "../wasm";

export const TIMELINE_INDICATOR_LINE_WIDTH_PX = 2;

function getDevicePixelRatio({
  devicePixelRatio,
}: {
  devicePixelRatio?: number;
}): number {
  if (
    typeof devicePixelRatio === "number" &&
    Number.isFinite(devicePixelRatio) &&
    devicePixelRatio > 0
  ) {
    return devicePixelRatio;
  }

  if (typeof window === "undefined") {
    return 1;
  }

  if (Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0) {
    return window.devicePixelRatio;
  }

  return 1;
}

export function getTimelinePixelsPerSecond({
  zoomLevel,
}: {
  zoomLevel: number;
}): number {
  return BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel;
}

export function timelineTimeToPixels({
  time,
  zoomLevel,
}: {
  time: number;
  zoomLevel: number;
}): number {
  return (time / TICKS_PER_SECOND) * getTimelinePixelsPerSecond({ zoomLevel });
}

export function snapPixelToDeviceGrid({
  pixel,
  devicePixelRatio,
}: {
  pixel: number;
  devicePixelRatio?: number;
}): number {
  const safeDevicePixelRatio = getDevicePixelRatio({ devicePixelRatio });
  return Math.round(pixel * safeDevicePixelRatio) / safeDevicePixelRatio;
}

export function timelineTimeToSnappedPixels({
  time,
  zoomLevel,
  devicePixelRatio,
}: {
  time: number;
  zoomLevel: number;
  devicePixelRatio?: number;
}): number {
  const rawPixel = timelineTimeToPixels({ time, zoomLevel });
  return snapPixelToDeviceGrid({ pixel: rawPixel, devicePixelRatio });
}

export function getCenteredLineLeft({
  centerPixel,
  lineWidthPx = TIMELINE_INDICATOR_LINE_WIDTH_PX,
}: {
  centerPixel: number;
  lineWidthPx?: number;
}): number {
  return centerPixel - lineWidthPx / 2;
}
