import { ZOOM_MIN, ZOOM_MAX, ZOOM_BUTTON_FACTOR } from "../../constants/timeline";

export function clampZoom(zoom: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

export function zoomIn(currentZoom: number): number {
  return clampZoom(currentZoom * ZOOM_BUTTON_FACTOR);
}

export function zoomOut(currentZoom: number): number {
  return clampZoom(currentZoom / ZOOM_BUTTON_FACTOR);
}
