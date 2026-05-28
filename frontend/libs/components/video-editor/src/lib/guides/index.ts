import { GUIDE_REGISTRY } from "./registry";
import type { GuideDefinition } from "./types";

export { GUIDE_REGISTRY, isGuideId } from "./registry";
export type { GuideDefinition, GuideId, GuideRenderProps } from "./registry";
// TODO: getGuidePreviewOverlaySource is provided by ./preview-overlay in
// opencut-classic and isn't ported yet. Hosts that need overlay sources
// from guides should provide their own implementation until the guides
// definitions land.

export function getGuideById(guideId: string | null): GuideDefinition | null {
  if (!guideId) {
    return null;
  }

  return GUIDE_REGISTRY.find((guide) => guide.id === guideId) ?? null;
}
