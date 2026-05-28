// TODO: Full guide registry depends on @hugeicons/* and shadcn NumberField
// which haven't been ported yet. For now we register only the empty set; the
// preview store still type-checks GuideId as a string union of registered ids,
// and consumers can pass through `null` to disable the active guide.
//
// To finish porting:
//   - Port `src/guides/definitions/grid.tsx`
//   - Port `src/guides/definitions/platforms.tsx`
//   - Port `src/guides/preview-overlay.tsx`
//   - Add `@hugeicons/core-free-icons` + `@hugeicons/react` to package.json
//   - Restore the original `GUIDE_REGISTRY` array
import type { GuideDefinition } from "./types";

export type { GuideDefinition, GuideRenderProps } from "./types";

export const GUIDE_REGISTRY: readonly GuideDefinition[] = [];

export type GuideId = string;

export function isGuideId(value: string): value is GuideId {
  return GUIDE_REGISTRY.some((guide) => guide.id === value);
}
