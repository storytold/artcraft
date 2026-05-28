import { GUIDE_REGISTRY } from "./registry";
import type { GuideDefinition } from "./types";

export { GUIDE_REGISTRY, isGuideId } from "./registry";
export type { GuideDefinition, GuideId, GuideRenderProps } from "./registry";
export { getGuidePreviewOverlaySource } from "./preview-overlay";

export function getGuideById(guideId: string | null): GuideDefinition | null {
  if (!guideId) {
    return null;
  }

  return GUIDE_REGISTRY.find((guide) => guide.id === guideId) ?? null;
}
