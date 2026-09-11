import {
  BASE_TIMELINE_PIXELS_PER_SECOND,
  TIMELINE_ZOOM_MAX,
} from "./scale";
import { TICKS_PER_SECOND } from "../wasm";

const PADDING_MAX_RATIO = 0.75;
const PADDING_MIN_RATIO = 0.15;
const PADDING_MIN_AT_ZOOM_PERCENT = 0.2;

export function getTimelineZoomMin({
  duration,
  containerWidth,
}: {
  duration: number;
  containerWidth: number | null | undefined;
}): number {
  const safeDurationSeconds = Math.max(duration / TICKS_PER_SECOND, 1);
  const safeContainerWidth = containerWidth ?? 1000;
  const contentRatioAtMinZoom = 1 - PADDING_MAX_RATIO;
  const availableWidth = safeContainerWidth * contentRatioAtMinZoom;
  const zoomToFit =
    availableWidth / (safeDurationSeconds * BASE_TIMELINE_PIXELS_PER_SECOND);

  return Math.min(TIMELINE_ZOOM_MAX, zoomToFit);
}

export function getTimelinePaddingPx({
  containerWidth,
  zoomLevel,
  minZoom,
}: {
  containerWidth: number;
  zoomLevel: number;
  minZoom: number;
}): number {
  const zoomPercent = getZoomPercent({ zoomLevel, minZoom });
  const paddingTransitionPercent = Math.min(
    zoomPercent / PADDING_MIN_AT_ZOOM_PERCENT,
    1,
  );
  const paddingRatio =
    PADDING_MAX_RATIO -
    (PADDING_MAX_RATIO - PADDING_MIN_RATIO) * paddingTransitionPercent;

  return containerWidth * paddingRatio;
}

export function getZoomPercent({
  zoomLevel,
  minZoom,
}: {
  zoomLevel: number;
  minZoom: number;
}): number {
  return (zoomLevel - minZoom) / (TIMELINE_ZOOM_MAX - minZoom);
}

// Convert a 0-1 linear slider position to exponential zoom level. At low
// slider values, zoom changes are small; at high values, changes are large.
export function sliderToZoom({
  sliderPosition,
  minZoom,
  maxZoom = TIMELINE_ZOOM_MAX,
}: {
  sliderPosition: number;
  minZoom: number;
  maxZoom?: number;
}): number {
  const clampedPosition = Math.max(0, Math.min(1, sliderPosition));
  return minZoom * (maxZoom / minZoom) ** clampedPosition;
}

// Convert exponential zoom level back to 0-1 linear slider position.
export function zoomToSlider({
  zoomLevel,
  minZoom,
  maxZoom = TIMELINE_ZOOM_MAX,
}: {
  zoomLevel: number;
  minZoom: number;
  maxZoom?: number;
}): number {
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
  return Math.log(clampedZoom / minZoom) / Math.log(maxZoom / minZoom);
}
