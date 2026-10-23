import { GenerationProvider } from "@storyteller/api-enums";
import { ImageModel } from "./ImageModel.js";

// How many reference images OpenRouter's version of each model takes
// (artcraft_router's `providers/openrouter/models.rs`).
export const OPENROUTER_MAX_REFERENCES: Readonly<Record<string, number>> = {
  nano_banana: 3,
  nano_banana_2: 14,
  nano_banana_pro: 14,
  gpt_image_1: 16,
  gpt_image_2: 16,
  gpt_image_2p5_flare: 16,
  gpt_image_2p5_sunburst: 16,
  seedream_4p5: 14,
  seedream_5_lite: 14,
};

/** Capabilities of the model on the user's own account (Midjourney session,
 * OpenRouter key), independent of the ArtCraft backend's capabilities for the
 * same models. */
export function imageModelForProvider(
  model: ImageModel | undefined,
  provider: GenerationProvider | undefined,
): ImageModel | undefined {
  if (model && provider === GenerationProvider.OpenRouter) {
    const maxReferences = OPENROUTER_MAX_REFERENCES[model.tauriId];
    if (maxReferences === undefined || model.maxImagePromptCount <= maxReferences) return model;
    return new ImageModel({
      ...model,
      providers: model.getProviders(),
      maxImagePromptCount: maxReferences,
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
