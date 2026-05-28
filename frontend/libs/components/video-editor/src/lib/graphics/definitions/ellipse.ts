import type { ParamDefinition } from "../../params";
import { applyAlignedStroke } from "../stroke";
import { STROKE_ALIGN_PARAM, type GraphicStrokeAlign } from "./shared";
import type { GraphicDefinition } from "../types";

interface EllipseParams {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeAlign: GraphicStrokeAlign;
}

const ELLIPSE_PARAMS: ParamDefinition<keyof EllipseParams & string>[] = [
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
];

export const ellipseGraphicDefinition: GraphicDefinition = {
  id: "ellipse",
  name: "Ellipse",
  keywords: ["ellipse", "circle", "oval"],
  params: ELLIPSE_PARAMS,
  render({ ctx, params, width, height }) {
    const fill = String(params.fill ?? "#ffffff");
    const stroke = String(params.stroke ?? "#000000");
    const strokeWidth = Math.max(0, Number(params.strokeWidth ?? 0));
    const strokeAlign = (params.strokeAlign ?? "center") as GraphicStrokeAlign;
    const inset = strokeAlign === "center" ? strokeWidth / 2 : 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.max(1, width / 2 - inset);
    const radiusY = Math.max(1, height / 2 - inset);

    ctx.clearRect(0, 0, width, height);
    const path = new Path2D();
    path.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
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
