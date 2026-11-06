import { useMemo } from "react";
import { Layer, Shape } from "react-konva";
import { isRightToLeft, safeZoneGeometry } from "@storyteller/common";
import { useCanvasSafeZones } from "../hooks/useCanvasSafeZones";

// Light yellow over what the platform's interface covers (Tailwind yellow-200),
// with a stronger yellow outline so the safe area still shows on a white canvas.
const COVERED_FILL = "rgba(254, 240, 138, 0.4)";
const OUTLINE_STROKE = "rgba(250, 204, 21, 0.95)";
const OUTLINE_WIDTH_PX = 2;

/**
 * Draws the shown safe zone over the canvas. Display only: it is a layer of its
 * own, and generation reads the base image, the draw layer and the mask layer
 * by id, so the overlay never reaches a model.
 */
export const SafeZoneLayer = () => {
  const { width, height, shown } = useCanvasSafeZones();
  const geometry = useMemo(
    () =>
      shown
        ? safeZoneGeometry(
            shown,
            width,
            height,
            isRightToLeft(systemLanguage()),
          )
        : null,
    [shown, width, height],
  );

  if (!geometry) {
    return null;
  }
  return (
    <Layer listening={false}>
      {/* One path for every covered rectangle, so the shade has no seams. */}
      <Shape
        listening={false}
        fill={COVERED_FILL}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          for (const rect of geometry.covered) {
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
          }
          ctx.fillStrokeShape(shape);
        }}
      />
      <Shape
        listening={false}
        stroke={OUTLINE_STROKE}
        strokeWidth={OUTLINE_WIDTH_PX}
        strokeScaleEnabled={false}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          for (const edge of geometry.outline) {
            ctx.moveTo(edge.x1, edge.y1);
            ctx.lineTo(edge.x2, edge.y2);
          }
          ctx.fillStrokeShape(shape);
        }}
      />
    </Layer>
  );
};

// ArtCraft has no language setting of its own, so the system's first
// preferred language decides whether TikTok's mirrored layout applies.
function systemLanguage(): string {
  if (typeof navigator === "undefined") {
    return "";
  }
  return navigator.languages?.[0] ?? navigator.language ?? "";
}
