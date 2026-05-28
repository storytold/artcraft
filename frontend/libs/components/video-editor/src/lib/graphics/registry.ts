import { DefinitionRegistry } from "../params/registry";
import type { GraphicDefinition } from "./types";

// Singleton registry for the lib's built-in graphic shapes
// (rectangle, ellipse, polygon, star) plus any host-extended graphics.
// Looked up by definitionId at render time and from the properties
// panel.
export class GraphicsRegistry extends DefinitionRegistry<string, GraphicDefinition> {
  constructor() {
    super("graphic");
  }
}

export const graphicsRegistry = new GraphicsRegistry();
