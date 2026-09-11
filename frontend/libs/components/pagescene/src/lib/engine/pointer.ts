import * as THREE from "three";

// Pure helpers for translating browser pointer events into the
// normalized device coordinates the renderer expects. No DOM access
// beyond the rect we get handed; no listener attachment.

// Convert a clientX/clientY to NDC (normalized device coords:
// [-1, 1] in both axes, origin at center, y up).
export const ndcFromClient = (
  rect: DOMRect,
  clientX: number,
  clientY: number,
): { x: number; y: number } => ({
  x: ((clientX - rect.left) / rect.width) * 2 - 1,
  y: -((clientY - rect.top) / rect.height) * 2 + 1,
});

// Apply NDC to a Three.js Vector2 (the engine stores its current
// pointer as one). Mutates in place so the engine's existing
// references don't need to change.
export const applyNdcToVector2 = (
  vec: THREE.Vector2,
  rect: DOMRect,
  clientX: number,
  clientY: number,
): void => {
  const { x, y } = ndcFromClient(rect, clientX, clientY);
  vec.x = x;
  vec.y = y;
};
