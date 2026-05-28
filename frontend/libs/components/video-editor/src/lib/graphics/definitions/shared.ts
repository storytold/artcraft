import type { ParamDefinition } from "../../params";

// Shared "stroke alignment" param used by every built-in graphic.
// Stroke alignment determines whether the stroke draws inside, on the
// path, or outside it. Lives here (rather than per-definition) so
// every shape has identical option ordering + labels in the panel.

export type GraphicStrokeAlign = "inside" | "center" | "outside";

export const STROKE_ALIGN_PARAM: ParamDefinition<"strokeAlign"> = {
  key: "strokeAlign",
  label: "Stroke align",
  type: "select",
  default: "center",
  group: "stroke",
  options: [
    { value: "inside", label: "Inside" },
    { value: "center", label: "Center" },
    { value: "outside", label: "Outside" },
  ],
};
