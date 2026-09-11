import { getGuideById, type GuideId } from "./index";
import {
  EMPTY_PREVIEW_OVERLAY_SOURCE_RESULT,
  type PreviewOverlaySourceResult,
} from "../preview/overlays";

export function getGuidePreviewOverlaySource({
  guideId,
}: {
  guideId: GuideId | null;
}): PreviewOverlaySourceResult {
  const guide = getGuideById(guideId);
  if (!guide) {
    return EMPTY_PREVIEW_OVERLAY_SOURCE_RESULT;
  }

  return {
    definitions: [],
    instances: [
      {
        id: `guide-${guide.id}`,
        mount: { kind: "scene" },
        plane: "under-interaction",
        pointerEvents: "none",
        render: ({ sceneHeight, sceneWidth }) =>
          guide.renderOverlay({
            width: sceneWidth,
            height: sceneHeight,
          }),
      },
    ],
  };
}
