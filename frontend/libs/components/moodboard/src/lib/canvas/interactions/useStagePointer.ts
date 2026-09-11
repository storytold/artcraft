import Konva from "konva";
import { Vec2 } from "../types";

// Converts a raw KonvaEventObject pointer position to stage-local coordinates,
// accounting for stage offset and scale. Phase 1 has no zoom/pan so this is a
// thin wrapper, but encapsulating it keeps interaction hooks consistent.
export const stagePointerPos = (
  stage: Konva.Stage | null,
): Vec2 | null => {
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  return {
    x: (pointer.x - stage.x()) / stage.scaleX(),
    y: (pointer.y - stage.y()) / stage.scaleY(),
  };
};
