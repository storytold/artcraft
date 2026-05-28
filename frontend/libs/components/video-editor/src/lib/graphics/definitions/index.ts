import { graphicsRegistry } from "../registry";
import { ellipseGraphicDefinition } from "./ellipse";
import { polygonGraphicDefinition } from "./polygon";
import { rectangleGraphicDefinition } from "./rectangle";
import { starGraphicDefinition } from "./star";

const defaultGraphicDefinitions = [
  rectangleGraphicDefinition,
  ellipseGraphicDefinition,
  polygonGraphicDefinition,
  starGraphicDefinition,
];

// Idempotent self-registration. Called from EditorCore and from
// getGraphicDefinition (the lazy lookup) so adding a new graphic only
// requires editing this file.
export function registerDefaultGraphics(): void {
  for (const definition of defaultGraphicDefinitions) {
    if (graphicsRegistry.has(definition.id)) {
      continue;
    }
    graphicsRegistry.register({
      key: definition.id,
      definition,
    });
  }
}

export {
  ellipseGraphicDefinition,
  polygonGraphicDefinition,
  rectangleGraphicDefinition,
  starGraphicDefinition,
};
export { STROKE_ALIGN_PARAM } from "./shared";
