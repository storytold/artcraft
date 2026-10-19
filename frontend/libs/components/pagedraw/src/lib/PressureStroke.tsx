import React from "react";
import { Shape } from "react-konva";
import type Konva from "konva";
import { pressureToWidthFactor } from "@storyteller/common";

export type PressureStrokeProps = {
  /** Konva node identifier (selection, exports). */
  id?: string;
  /** Flat coordinate pairs, same layout as Konva `Line` points. */
  points: number[];
  /** Per-vertex pressure in 0..1; must have one sample per point pair. */
  pressures?: number[];
  /** Configured brush width; pressure scales the radius below this. */
  baseWidth: number;
  stroke: string;
  opacity?: number;
  globalCompositeOperation?: string;
  listening?: boolean;
  /** Container transform passthrough, mirroring Konva `Line`. */
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseEnter?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  draggable?: boolean;

  /**
   * Live-preview support: draw-time getters preferred over the static props,
   * so stroke updates only need a `batchDraw()` and never a React re-render.
   */
  pointsGetter?: () => number[];
  pressuresGetter?: () => number[] | undefined;
};

/**
 * Stroke that tapers with per-vertex pen pressure: consecutive samples are
 * joined with circular-arc capsules whose thickness follows the interpolated
 * pressure. Falls back to a plain polyline when no meaningful pressure data
 * is present, so it can also serve the live preview of uniform strokes.
 */
export const PressureStroke = React.forwardRef<Konva.Shape, PressureStrokeProps>(
  (
    {
      points,
      pressures,
      baseWidth,
      stroke,
      opacity = 1,
      globalCompositeOperation = "source-over",
      listening = false,
      pointsGetter,
      pressuresGetter,
      ...passthrough
    },
    ref,
  ) => {
    return (
      <Shape
        ref={ref}
        opacity={opacity}
        listening={listening}
        draggable={false}
        {...passthrough}
        // @ts-expect-error: composite ops are valid canvas values, Konva types
        // only enumerate the common ones.
        globalCompositeOperation={globalCompositeOperation}
        sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
          const pts = pointsGetter ? pointsGetter() : points;
          const maybePressures = pressuresGetter ? pressuresGetter() : pressures;

          if (pts.length < 4) {
            return;
          }

          context.strokeStyle = stroke;
          context.fillStyle = stroke;
          context.lineCap = "round";
          context.lineJoin = "round";

          const count = pts.length / 2;
          const hasPressure =
            Array.isArray(maybePressures) &&
            maybePressures.length > 1 &&
            maybePressures.length >= count;

          if (!hasPressure) {
            context.lineWidth = baseWidth;
            context.beginPath();
            context.moveTo(pts[0], pts[1]);
            for (let i = 1; i < count; i++) {
              context.lineTo(pts[i * 2], pts[i * 2 + 1]);
            }
            context.stroke();
            return;
          }

          const radii = new Array<number>(count);
          for (let i = 0; i < count; i++) {
            radii[i] = (baseWidth / 2) * pressureToWidthFactor(maybePressures[i]);
          }

          // Accumulate every capsule and end cap into a single path so the
          // fill stays visually seamless at overlapping joints.
          context.beginPath();
          for (let segment = 1; segment < count; segment++) {
            const x0 = pts[(segment - 1) * 2];
            const y0 = pts[(segment - 1) * 2 + 1];
            const x1 = pts[segment * 2];
            const y1 = pts[segment * 2 + 1];
            const r0 = radii[segment - 1];
            const r1 = radii[segment];

            const dx = x1 - x0;
            const dy = y1 - y0;
            const length = Math.hypot(dx, dy);
            if (length < 1e-6) {
              continue;
            }

            const nx = (-dy / length) * r0;
            const ny = (dx / length) * r0;
            const mx = (-dy / length) * r1;
            const my = (dx / length) * r1;

            context.moveTo(x0 + nx, y0 + ny);
            context.lineTo(x1 + mx, y1 + my);
            context.lineTo(x1 - mx, y1 - my);
            context.lineTo(x0 - nx, y0 - ny);
            context.closePath();
          }

          // Round caps at every vertex: overlapping circles with the same
          // fill make each joint seamless.
          for (let vertex = 0; vertex < count; vertex++) {
            const vx = pts[vertex * 2];
            const vy = pts[vertex * 2 + 1];
            context.moveTo(vx + radii[vertex], vy);
            context.arc(vx, vy, radii[vertex], 0, Math.PI * 2);
          }

          context.fill();
        }}
      />
    );
  },
);

PressureStroke.displayName = "PressureStroke";
