import type { ElementBounds } from "../../preview/element-bounds";
import type { FreeformPathMaskParams } from "../types";

// Stub for the freeform mask definition. The full implementation (638
// lines in opencut-classic/apps/web/src/masks/freeform/definition.ts)
// has not been ported yet. The InsertFreeformPathMaskPointCommand
// depends on `insertPointOnFreeformSegment`, so the stub exists to
// satisfy the bundler. It throws at runtime so callers see a clear
// error if they reach this code path before the port lands.

export function insertPointOnFreeformSegment(_: {
  params: FreeformPathMaskParams;
  segmentIndex: number;
  canvasPoint: { x: number; y: number };
  bounds: ElementBounds;
  pointId?: string;
}): { params: FreeformPathMaskParams; pointId: string } | null {
  throw new Error("insertPointOnFreeformSegment is not yet ported");
}
