import type { ElementWithBounds } from "./element-bounds";
import type { ElementRef } from "../timeline/types";

// Point-in-rotated-rect test for preview-canvas click resolution. Walks
// the visible-elements list in reverse so the topmost rendered element
// wins when multiple elements stack at the click point.
//
// resolvePreferredHit prioritizes already-selected elements among the
// hits — re-clicking inside an existing selection keeps it sticky even
// when an element behind it is geometrically on top.

function pointInRotatedRect({
  px,
  py,
  cx,
  cy,
  width,
  height,
  rotation,
}: {
  px: number;
  py: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation: number;
}): boolean {
  const angleRad = (rotation * Math.PI) / 180;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const dx = px - cx;
  const dy = py - cy;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const halfW = Math.abs(width) / 2;
  const halfH = Math.abs(height) / 2;
  return (
    localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH
  );
}

export function getHitElements({
  canvasX,
  canvasY,
  elementsWithBounds,
}: {
  canvasX: number;
  canvasY: number;
  elementsWithBounds: ElementWithBounds[];
}): ElementWithBounds[] {
  const hits: ElementWithBounds[] = [];

  for (let i = elementsWithBounds.length - 1; i >= 0; i--) {
    const { bounds } = elementsWithBounds[i];
    if (
      pointInRotatedRect({
        px: canvasX,
        py: canvasY,
        cx: bounds.cx,
        cy: bounds.cy,
        width: bounds.width,
        height: bounds.height,
        rotation: bounds.rotation,
      })
    ) {
      hits.push(elementsWithBounds[i]);
    }
  }

  return hits;
}

export function hitTest({
  canvasX,
  canvasY,
  elementsWithBounds,
}: {
  canvasX: number;
  canvasY: number;
  elementsWithBounds: ElementWithBounds[];
}): ElementWithBounds | null {
  return (
    getHitElements({
      canvasX,
      canvasY,
      elementsWithBounds,
    })[0] ?? null
  );
}

export function resolvePreferredHit({
  hits,
  preferredElements,
}: {
  hits: ElementWithBounds[];
  preferredElements: ElementRef[];
}): ElementWithBounds | null {
  if (preferredElements.length === 0) return null;

  return (
    hits.find((hit) =>
      preferredElements.some(
        (preferredElement) =>
          preferredElement.trackId === hit.trackId &&
          preferredElement.elementId === hit.elementId,
      ),
    ) ?? null
  );
}
