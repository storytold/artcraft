import type { FreeformPathPoint } from "../types";

// Stub for the freeform path helpers. The full implementation (835 lines
// in opencut-classic/apps/web/src/masks/freeform/path.ts) has not been
// ported yet. The DeleteFreeformPathMaskPointsCommand and the
// InsertFreeformPathMaskPointCommand depend on these symbols, so the
// stubs exist to satisfy the bundler. They throw at runtime so callers
// see a clear error if they reach this code path before the port lands.

export function removeFreeformPathPoints(_: {
  points: FreeformPathPoint[];
  pointIds: string[];
}): FreeformPathPoint[] {
  throw new Error("removeFreeformPathPoints is not yet ported");
}

export function getFreeformPathClosedStateAfterPointRemoval(_: {
  wasClosed: boolean;
  remainingPointCount: number;
}): boolean {
  throw new Error(
    "getFreeformPathClosedStateAfterPointRemoval is not yet ported",
  );
}
