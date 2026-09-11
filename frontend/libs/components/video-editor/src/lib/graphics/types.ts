import type { ParamDefinition, ParamValues } from "../params";

// Reference resolution for thumbnail/preview rendering. The actual
// element on the timeline is resized via its scale transform; the
// definition only needs to know how to fill a canvas of this size.
export const DEFAULT_GRAPHIC_SOURCE_SIZE = 512;

export interface GraphicRenderContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  params: ParamValues;
  width: number;
  height: number;
}

export interface GraphicDefinition {
  id: string;
  name: string;
  keywords: string[];
  params: ParamDefinition[];
  render(context: GraphicRenderContext): void;
}

// Stored shape on the timeline element. The renderer looks up the
// definition by id and feeds it the params.
export interface GraphicInstance {
  definitionId: string;
  params: ParamValues;
}
