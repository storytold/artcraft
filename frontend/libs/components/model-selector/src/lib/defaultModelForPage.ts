import {
  IMAGE_MODELS_BY_ID,
  Model,
  SPLAT_MODELS_BY_ID,
  VIDEO_MODELS_BY_ID,
} from "@storyteller/model-list";
import { ModelPage } from "./model-pages";

const DEFAULT_MODEL_ID_FOR_PAGE: Partial<Record<ModelPage, string>> = {
  [ModelPage.TextToImage]: "nano_banana_pro",
  [ModelPage.ImageToVideo]: "seedance_2p0",
  [ModelPage.Canvas2D]: "gpt_image_1p5",
  [ModelPage.Stage3D]: "gpt_image_1p5",
  [ModelPage.ImageEditor]: "nano_banana_pro",
  [ModelPage.ImageTo3DWorld]: "marble_0p1_mini",
  [ModelPage.Angles]: "flux_2_lora_angles",
};

export const defaultModelForPage = (
  models: Model[],
  page: ModelPage,
): Model => {
  const defaultId = DEFAULT_MODEL_ID_FOR_PAGE[page];

  if (defaultId) {
    // Prefer the instance from the caller's (backend-hydrated) list — the
    // static map instances are presentation-only fallbacks without the API's
    // capability data.
    const fromList = models.find(
      (m) => m.id === defaultId || m.tauriId === defaultId,
    );
    if (fromList) return fromList;

    const fromStaticMaps =
      IMAGE_MODELS_BY_ID.get(defaultId) ??
      VIDEO_MODELS_BY_ID.get(defaultId) ??
      SPLAT_MODELS_BY_ID.get(defaultId);
    if (fromStaticMaps) return fromStaticMaps;
  }

  return models[0];
};
