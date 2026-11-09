import { GenerationProvider } from "@storyteller/api-enums";
import { ImageModel } from "./ImageModel.js";
import { CommonAspectRatio } from "./properties/CommonAspectRatio.js";
import { CommonResolution } from "./properties/CommonResolution.js";
import { CommonQuality } from "./properties/CommonQuality.js";
import { WAVESPEED_IMAGE_MODELS } from "./waveSpeedImageModels.js";

/** Capabilities of the user's own Midjourney session, independent of the
 * ArtCraft backend's capabilities for the same models. */
export function imageModelForProvider(
  model: ImageModel | undefined,
  provider: GenerationProvider | undefined,
  reservedImageReferences = 0,
): ImageModel | undefined {
  const capabilities = model && provider === GenerationProvider.WaveSpeed ? WAVESPEED_IMAGE_MODELS[model.tauriId] : undefined;
  if (model && capabilities) {
    const maxReferences = Math.max(0, capabilities.maxReferences - reservedImageReferences);
    return new ImageModel({
      ...model,
      providers: model.getProviders(),
      maxGenerationCount: capabilities.maxImages,
      defaultGenerationCount: Math.min(model.defaultGenerationCount, capabilities.maxImages),
      predefinedGenerationCounts: Array.from({ length: capabilities.maxImages }, (_, index) => index + 1),
      canUseImagePrompt: maxReferences > 0,
      maxImagePromptCount: maxReferences,
      canChangeAspectRatio: true,
      aspectRatios: capabilities.aspectRatios,
      defaultAspectRatio: CommonAspectRatio.Square,
      canChangeResolution: capabilities.resolutions.length > 0,
      resolutions: capabilities.resolutions,
      qualityOptions: capabilities.qualityOptions,
      defaultResolution: capabilities.resolutions.includes(CommonResolution.OneK) ? CommonResolution.OneK : capabilities.resolutions[0],
      defaultQuality: capabilities.qualityOptions.length ? CommonQuality.Medium : undefined,
    });
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
