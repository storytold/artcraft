import { GenerationProvider } from "@storyteller/api-enums";
import { ImageModel } from "./ImageModel.js";

/** Capabilities of the user's own Midjourney session, independent of the
 * ArtCraft backend's capabilities for the same models. */
export function imageModelForProvider(
  model: ImageModel | undefined,
  provider: GenerationProvider | undefined,
): ImageModel | undefined {
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
