import { BASE_TIMELINE_PIXELS_PER_SECOND } from "./scale";
import { mediaTime, type MediaTime, TICKS_PER_SECOND } from "../wasm";

export function getMouseTimeFromClientX({
  clientX,
  containerRect,
  zoomLevel,
  scrollLeft,
}: {
  clientX: number;
  containerRect: DOMRect;
  zoomLevel: number;
  scrollLeft: number;
}): MediaTime {
  const mouseX = clientX - containerRect.left + scrollLeft;
  const seconds = Math.max(
    0,
    mouseX / (BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel),
  );
  return mediaTime({
    ticks: Math.round(seconds * TICKS_PER_SECOND),
  });
}
