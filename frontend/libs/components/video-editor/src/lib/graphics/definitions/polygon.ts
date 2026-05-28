import type { ParamDefinition } from "../../params";
import { applyAlignedStroke } from "../stroke";
import { STROKE_ALIGN_PARAM, type GraphicStrokeAlign } from "./shared";
import type { GraphicDefinition } from "../types";

interface Point {
  x: number;
  y: number;
}

interface PolygonParams {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeAlign: GraphicStrokeAlign;
  sides: number;
  cornerRadius: number;
}

const POLYGON_PARAMS: ParamDefinition<keyof PolygonParams & string>[] = [
  {
    key: "fill",
    label: "Fill",
    type: "color",
    default: "#ffffff",
  },
  {
    key: "stroke",
    label: "Color",
    type: "color",
    default: "#000000",
    group: "stroke",
  },
  {
    key: "strokeWidth",
    label: "Width",
    type: "number",
    default: 0,
    min: 0,
    max: 64,
    step: 1,
    shortLabel: "W",
    group: "stroke",
  },
  STROKE_ALIGN_PARAM,
  {
    key: "sides",
    label: "Sides",
    type: "number",
    default: 5,
    min: 3,
    max: 12,
    step: 1,
    shortLabel: "S",
  },
  {
    key: "cornerRadius",
    label: "Corner radius",
    type: "number",
    default: 0,
    min: 0,
    max: 50,
    step: 1,
    shortLabel: "R",
  },
];

function buildPolygonVertices({
  centerX,
  centerY,
  radius,
  sides,
}: {
  centerX: number;
  centerY: number;
  radius: number;
  sides: number;
}): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

function distance({ a, b }: { a: Point; b: Point }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y) || 1;
  return {
    x: point.x / length,
    y: point.y / length,
  };
}

function traceRoundedPolygonPath({
  path,
  vertices,
  radius,
}: {
  path: Path2D;
  vertices: Point[];
  radius: number;
}): void {
  if (vertices.length < 3) {
    return;
  }

  if (radius <= 0) {
    path.moveTo(vertices[0].x, vertices[0].y);
    for (let index = 1; index < vertices.length; index++) {
      path.lineTo(vertices[index].x, vertices[index].y);
    }
    path.closePath();
    return;
  }

  for (let index = 0; index < vertices.length; index++) {
    const previous = vertices[(index - 1 + vertices.length) % vertices.length];
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    const toPrevious = normalize({
      x: previous.x - current.x,
      y: previous.y - current.y,
    });
    const toNext = normalize({
      x: next.x - current.x,
      y: next.y - current.y,
    });
    const angle = Math.acos(
      Math.max(-1, Math.min(1, toPrevious.x * toNext.x + toPrevious.y * toNext.y)),
    );
    const maxOffset =
      Math.min(distance({ a: previous, b: current }), distance({ a: current, b: next })) / 2;
    const tangentOffset = Math.min(radius / Math.tan(angle / 2), maxOffset);
    const start = {
      x: current.x + toPrevious.x * tangentOffset,
      y: current.y + toPrevious.y * tangentOffset,
    };
    const end = {
      x: current.x + toNext.x * tangentOffset,
      y: current.y + toNext.y * tangentOffset,
    };

    if (index === 0) {
      path.moveTo(start.x, start.y);
    } else {
      path.lineTo(start.x, start.y);
    }

    path.arcTo(
      current.x,
      current.y,
      end.x,
      end.y,
      Math.min(radius, maxOffset),
    );
  }

  path.closePath();
}

export const polygonGraphicDefinition: GraphicDefinition = {
  id: "polygon",
  name: "Polygon",
  keywords: ["polygon", "triangle", "pentagon", "hexagon", "diamond"],
  params: POLYGON_PARAMS,
  render({ ctx, params, width, height }) {
    const fill = String(params.fill ?? "#ffffff");
    const stroke = String(params.stroke ?? "#000000");
    const strokeWidth = Math.max(0, Number(params.strokeWidth ?? 0));
    const strokeAlign = (params.strokeAlign ?? "center") as GraphicStrokeAlign;
    const sides = Math.max(3, Math.min(12, Math.round(Number(params.sides ?? 5))));
    const inset = strokeAlign === "center" ? strokeWidth / 2 : 0;
    const radius = Math.max(1, Math.min(width, height) / 2 - inset);
    const maxCornerRadius = radius * Math.sin(Math.PI / sides);
    const cornerRadiusPercent = Math.max(0, Number(params.cornerRadius ?? 0));
    const cornerRadius =
      maxCornerRadius * Math.min(cornerRadiusPercent, 50) / 50;
    const vertices = buildPolygonVertices({
      centerX: width / 2,
      centerY: height / 2,
      radius,
      sides,
    });

    ctx.clearRect(0, 0, width, height);
    const path = new Path2D();
    traceRoundedPolygonPath({
      path,
      vertices,
      radius: cornerRadius,
    });
    ctx.fillStyle = fill;
    ctx.fill(path);

    if (strokeWidth > 0) {
      applyAlignedStroke({
        ctx,
        path,
        strokeWidth,
        strokeAlign,
        strokeColor: stroke,
      });
    }
  },
};
