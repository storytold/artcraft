import type { ParamDefinition } from "../../params";
import { applyAlignedStroke } from "../stroke";
import { STROKE_ALIGN_PARAM, type GraphicStrokeAlign } from "./shared";
import type { GraphicDefinition } from "../types";

interface StarParams {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeAlign: GraphicStrokeAlign;
  points: number;
  depth: number;
}

const STAR_PARAMS: ParamDefinition<keyof StarParams & string>[] = [
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
    key: "points",
    label: "Points",
    type: "number",
    default: 5,
    min: 3,
    max: 12,
    step: 1,
    shortLabel: "P",
  },
  {
    key: "depth",
    label: "Depth",
    type: "number",
    default: 45,
    min: 1,
    max: 99,
    step: 1,
    shortLabel: "D",
  },
];

export const starGraphicDefinition: GraphicDefinition = {
  id: "star",
  name: "Star",
  keywords: ["star", "sparkle", "burst"],
  params: STAR_PARAMS,
  render({ ctx, params, width, height }) {
    const fill = String(params.fill ?? "#ffffff");
    const stroke = String(params.stroke ?? "#000000");
    const strokeWidth = Math.max(0, Number(params.strokeWidth ?? 0));
    const strokeAlign = (params.strokeAlign ?? "center") as GraphicStrokeAlign;
    const points = Math.max(3, Math.min(12, Math.round(Number(params.points ?? 5))));
    const depth = Math.max(1, Math.min(99, Number(params.depth ?? 45))) / 100;
    const inset = strokeAlign === "center" ? strokeWidth / 2 : 0;
    const outerRadius = Math.max(1, Math.min(width, height) / 2 - inset);
    const innerRadius = outerRadius * depth;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    const path = new Path2D();
    for (let index = 0; index < points * 2; index++) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (index * Math.PI) / points;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (index === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.closePath();
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
