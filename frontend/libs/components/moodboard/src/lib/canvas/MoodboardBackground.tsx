import { memo } from "react";
import { Shape } from "react-konva";
import Konva from "konva";
import { Rect } from "./types";

interface Props {
  // Visible region in stage (document) coordinates. Driven by pan/zoom.
  viewport: Rect;
  spacing: number;
  zoom: number;
  dotColor?: string;
  // On-screen radius in CSS pixels. Converted to stage units so dots stay
  // the same visual size regardless of zoom.
  dotRadiusPx?: number;
}

// Minimum on-screen gap between dots before we drop to a coarser grid.
// At zoom 1× with spacing 32, dots are 32px apart; as you zoom out, the
// LOD step doubles `spacing` so density never drops below this bound.
const MIN_SCREEN_SPACING = 16;

// Vector dotted grid that follows the visible viewport. Dots stay anchored
// at fixed stage coords (multiples of the effective spacing); zooming out
// coarsens the grid in powers of 2 so we never draw tens of thousands of
// arcs per frame.
const MoodboardBackgroundInner = ({
  viewport,
  spacing,
  zoom,
  dotColor = "rgba(255,255,255,0.18)",
  dotRadiusPx = 1.2,
}: Props) => {
  const baseOnScreen = spacing * zoom;
  const lodStep =
    baseOnScreen >= MIN_SCREEN_SPACING
      ? 0
      : Math.ceil(Math.log2(MIN_SCREEN_SPACING / Math.max(baseOnScreen, 1e-6)));
  const effectiveSpacing = spacing * Math.pow(2, lodStep);
  const radius = dotRadiusPx / Math.max(zoom, 1e-6);

  return (
    <Shape
      x={0}
      y={0}
      listening={false}
      sceneFunc={(ctx: Konva.Context, shape) => {
        const startX = Math.floor(viewport.x / effectiveSpacing) * effectiveSpacing;
        const startY = Math.floor(viewport.y / effectiveSpacing) * effectiveSpacing;
        const endX = viewport.x + viewport.width;
        const endY = viewport.y + viewport.height;
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += effectiveSpacing) {
          for (let y = startY; y <= endY; y += effectiveSpacing) {
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
};

export const MoodboardBackground = memo(MoodboardBackgroundInner);
