import type { Mask, MaskDefaultContext, MaskType } from "./types";
import { masksRegistry } from "./registry";
import { generateUUID } from "../utils/id";

export { masksRegistry } from "./registry";
export { registerDefaultMasks } from "./builtin/definitions";

// Mask union → mask-without-id mapped type. The discriminated-union
// `withMaskId` switch is more verbose than needed but lets TypeScript
// narrow each branch so the resulting Mask is concretely typed.

type MaskWithoutId = Mask extends infer TMask
  ? TMask extends Mask
    ? Omit<TMask, "id">
    : never
  : never;

function withMaskId({ mask, id }: { mask: MaskWithoutId; id: string }): Mask {
  switch (mask.type) {
    case "split":
      return { ...mask, id };
    case "cinematic-bars":
      return { ...mask, id };
    case "rectangle":
      return { ...mask, id };
    case "ellipse":
      return { ...mask, id };
    case "heart":
      return { ...mask, id };
    case "diamond":
      return { ...mask, id };
    case "star":
      return { ...mask, id };
    case "text":
      return { ...mask, id };
    case "freeform":
      return { ...mask, id };
  }
}

export function getMaskDefinition(maskType: MaskType) {
  return masksRegistry.get(maskType);
}

export function getMaskDefinitionsForMenu() {
  return masksRegistry.getAll();
}

export function buildDefaultMaskInstance({
  maskType,
  elementSize,
}: {
  maskType: MaskType;
  elementSize?: { width: number; height: number };
}): Mask {
  const definition = masksRegistry.get(maskType);
  const context: MaskDefaultContext = { elementSize };
  return withMaskId({
    mask: definition.buildDefault(context),
    id: generateUUID(),
  });
}
