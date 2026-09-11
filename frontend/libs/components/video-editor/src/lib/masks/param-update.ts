import { FEATHER_HANDLE_SCALE, MAX_FEATHER } from "./feather";

// Feather handle drag math. Projects the pointer delta onto the
// outward-pointing normal at the handle's anchor, scales by
// FEATHER_HANDLE_SCALE (so handle motion is comfortably proportional
// to feather change), and clamps to [0, MAX_FEATHER].
export function computeFeatherUpdate({
  startFeather,
  deltaX,
  deltaY,
  directionX,
  directionY,
}: {
  startFeather: number;
  deltaX: number;
  deltaY: number;
  directionX: number;
  directionY: number;
}): { feather: number } {
  const projection = deltaX * directionX + deltaY * directionY;
  return {
    feather: Math.max(
      0,
      Math.min(
        MAX_FEATHER,
        Math.round(startFeather + projection / FEATHER_HANDLE_SCALE),
      ),
    ),
  };
}
