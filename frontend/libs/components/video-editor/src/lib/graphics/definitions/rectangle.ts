import type { ParamDefinition } from "../../params";
import { applyAlignedStroke } from "../stroke";
import { STROKE_ALIGN_PARAM, type GraphicStrokeAlign } from "./shared";
import type { GraphicDefinition } from "../types";

interface RectangleParams {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeAlign: GraphicStrokeAlign;
  cornerRadius: number;
}

const RECTANGLE_PARAMS: ParamDefinition<keyof RectangleParams & string>[] = [
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

export const rectangleGraphicDefinition: GraphicDefinition = {
  id: "rectangle",
  name: "Rectangle",
  keywords: ["rectangle", "square", "box"],
  params: RECTANGLE_PARAMS,
  render({ ctx, params, width, height }) {
    const fill = String(params.fill ?? "#ffffff");
    const stroke = String(params.stroke ?? "#000000");
    const strokeWidth = Math.max(0, Number(params.strokeWidth ?? 0));
    const strokeAlign = (params.strokeAlign ?? "center") as GraphicStrokeAlign;
    const inset = strokeAlign === "center" ? strokeWidth / 2 : 0;
    const drawWidth = Math.max(1, width - inset * 2);
    const drawHeight = Math.max(1, height - inset * 2);
    const radiusPercent = Math.max(0, Number(params.cornerRadius ?? 0));
    const radius =
      (Math.min(drawWidth, drawHeight) / 2) * Math.min(radiusPercent, 50) / 50;

    ctx.clearRect(0, 0, width, height);
    const path = new Path2D();
    path.roundRect(inset, inset, drawWidth, drawHeight, radius);
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
