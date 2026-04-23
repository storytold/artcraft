import { Vec2 } from "../../PageMoodboard/types";
import { Viewport } from "../../PageMoodboard/layout/geometry";

// Converts a DOM pointer event's client coords to world (stage) coords for the
// HTML moodboard. Mirrors the role of `stagePointerPos` in the Konva page but
// uses DOM rects and the viewport in the store instead of Konva's stage state.
export const worldPointFromClient = (
  containerEl: HTMLElement | null,
  clientX: number,
  clientY: number,
  viewport: Viewport,
): Vec2 | null => {
  if (!containerEl) return null;
  const rect = containerEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.pan.x) / viewport.zoom,
    y: (clientY - rect.top - viewport.pan.y) / viewport.zoom,
  };
};

// Returns the center of the visible viewport in world coords. Used as a
// fallback drop point when no cursor position is available.
export const worldViewportCenter = (
  canvasWidth: number,
  canvasHeight: number,
  viewport: Viewport,
): Vec2 => ({
  x: (canvasWidth / 2 - viewport.pan.x) / viewport.zoom,
  y: (canvasHeight / 2 - viewport.pan.y) / viewport.zoom,
});
