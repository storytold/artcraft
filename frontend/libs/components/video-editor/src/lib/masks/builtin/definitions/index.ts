import {
  masksRegistry,
  type MaskDefinitionForRegistration,
  type MaskIconProps,
} from "../../registry";
import { cinematicBarsMaskDefinition } from "./cinematic-bars";
import { diamondMaskDefinition } from "./diamond";
import { ellipseMaskDefinition } from "./ellipse";
import { freeformMaskDefinition } from "../../freeform/definition";
import { heartMaskDefinition } from "./heart";
import { rectangleMaskDefinition } from "./rectangle";
import { splitMaskDefinition } from "./split";
import { starMaskDefinition } from "./star";
import { textMaskDefinition } from "./text";

// All 9 built-in mask definitions are registered: split / cinematic-bars,
// 6 closed-shape masks (rectangle, ellipse, heart, diamond, star, text),
// and the freeform pen-tool mask. Host code passes whatever icon
// component it likes via the loose MaskIconProps contract.

function registerDefaultMask({
  definition,
  icon,
}: {
  definition: MaskDefinitionForRegistration;
  icon: MaskIconProps;
}) {
  if (masksRegistry.has(definition.type)) {
    return;
  }

  masksRegistry.registerMask({ definition, icon });
}

// Idempotent — safe to call multiple times (per-definition has() check).
// Icon values are `unknown` placeholders; the host substitutes its own
// icon components when wiring the panel.
export function registerDefaultMasks(): void {
  registerDefaultMask({
    definition: splitMaskDefinition,
    icon: { icon: null, strokeWidth: 1 },
  });
  registerDefaultMask({
    definition: cinematicBarsMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: rectangleMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: ellipseMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: heartMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: diamondMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: starMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: textMaskDefinition,
    icon: { icon: null },
  });
  registerDefaultMask({
    definition: freeformMaskDefinition,
    icon: { icon: null },
  });
}

export {
  cinematicBarsMaskDefinition,
  diamondMaskDefinition,
  ellipseMaskDefinition,
  freeformMaskDefinition,
  heartMaskDefinition,
  rectangleMaskDefinition,
  splitMaskDefinition,
  starMaskDefinition,
  textMaskDefinition,
};
