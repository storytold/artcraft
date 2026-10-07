import { GenerationProvider } from "@storyteller/api-enums";
import { ImageModel } from "./ImageModel.js";

// Seedream input image limits on BytePlus ModelArk.
const BYTEPLUS_SEEDREAM_MAX_IMAGE_PROMPTS: Record<string, number> = {
  seedream_4: 14,
  seedream_4p5: 14,
  seedream_5_lite: 14,
  seedream_5p0_pro: 10,
};

/** Capabilities of the user's own provider account (Midjourney, BytePlus),
 * independent of the ArtCraft backend's capabilities for the same models. */
export function imageModelForProvider(
  model: ImageModel | undefined,
  provider: GenerationProvider | undefined,
): ImageModel | undefined {
  if (model && provider === GenerationProvider.Byteplus) {
    return byteplusImageModel(model);
  }
  if (!model || provider !== GenerationProvider.Midjourney) return model;
  if (!["midjourney", "midjourney_7", "midjourney_7_niji", "midjourney_8"].includes(model.tauriId)) return model;
  return new ImageModel({
    ...model,
    providers: model.getProviders(),
    defaultGenerationCount: 4,
    maxGenerationCount: 4,
    predefinedGenerationCounts: [4],
    canUseImagePrompt: false,
    canEditImages: false,
    maxImagePromptCount: 0,
    canChangeResolution: false,
    resolutions: [],
    qualityOptions: [],
    defaultResolution: undefined,
    defaultQuality: undefined,
  });
}

function byteplusImageModel(model: ImageModel): ImageModel {
  const maxImagePromptCount = BYTEPLUS_SEEDREAM_MAX_IMAGE_PROMPTS[model.tauriId];
  if (maxImagePromptCount === undefined) return model;
  return new ImageModel({
    ...model,
    providers: model.getProviders(),
    // Seedream makes one image per request; ArtCraft sends up to four in parallel.
    maxGenerationCount: 4,
    predefinedGenerationCounts: undefined,
    canUseImagePrompt: true,
    canEditImages: true,
    maxImagePromptCount,
  });
}
