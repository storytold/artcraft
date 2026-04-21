import { Shape } from "react-konva";
import Konva from "konva";
import { Rect } from "./types";

interface Props {
  // Visible region in stage (document) coordinates. Driven by pan/zoom.
  viewport: Rect;
  spacing: number;
  dotColor?: string;
  dotRadius?: number;
}

// Vector dotted grid that follows the visible viewport. Dots stay anchored
// at fixed stage coords (multiples of `spacing`); panning reveals more,
// zooming in spaces them apart on screen.
export const MoodboardBackground = ({
  viewport,
  spacing,
  dotColor = "rgba(255,255,255,0.18)",
  dotRadius = 1.2,
}: Props) => {
  return (
    <Shape
      x={0}
      y={0}
      listening={false}
      sceneFunc={(ctx: Konva.Context, shape) => {
        const startX = Math.floor(viewport.x / spacing) * spacing;
        const startY = Math.floor(viewport.y / spacing) * spacing;
        const endX = viewport.x + viewport.width;
        const endY = viewport.y + viewport.height;
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += spacing) {
          for (let y = startY; y <= endY; y += spacing) {
            ctx.moveTo(x + dotRadius, y);
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
};
