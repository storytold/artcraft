import { PIXELS_PER_SECOND } from "../../constants/timeline";

export function timeToPixels(time: number, zoomLevel: number): number {
  return time * PIXELS_PER_SECOND * zoomLevel;
}

export function pixelsToTime(px: number, zoomLevel: number): number {
  return px / (PIXELS_PER_SECOND * zoomLevel);
}

export function getPixelsPerSecond(zoomLevel: number): number {
  return PIXELS_PER_SECOND * zoomLevel;
}
