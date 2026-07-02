// Static image model overlay, assembled from the per-feature lookup
// functions in `../loader/imageModelFeatures.ts`. At runtime the backend
// omni listing drives membership + capabilities (`buildModelsFromListing.ts`);
// these instances only contribute frontend-only data (presentation, page
// flags, providers) and capability fallbacks.

import { ImageModel } from "../classes/ImageModel.js";
import {
  KNOWN_IMAGE_TAURI_IDS,
  imageAspectRatios,
  imageCanEditAngles,
  imageCanEditImages,
  imageCanTextToImage,
  imageCanUseImagePrompt,
  imageCreator,
  imageDefaultAspectRatio,
  imageDefaultGenerationCount,
  imageDefaultQuality,
  imageDefaultResolution,
  imageEditingIsInpainting,
  imageFullName,
  imageLegacyId,
  imageMaxGenerationCount,
  imageMaxImagePromptCount,
  imageMaxPromptLength,
  imagePredefinedGenerationCounts,
  imageProgressBarTime,
  imageProviders,
  imageQualityOptions,
  imageResolutions,
  imageSelectorBadges,
  imageSelectorDescription,
  imageSelectorName,
  imageTags,
  imageUsesInpaintingMask,
} from "../loader/imageModelFeatures.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";

const buildStaticImageModel = (tauriId: string): ImageModel =>
  new ImageModel({
    // Identity.
    id: imageLegacyId(tauriId) ?? tauriId,
    tauriId,
    fullName: imageFullName(tauriId) ?? tauriId,
    category: "image",
    creator: imageCreator(tauriId) ?? ModelCreator.ArtCraft,

    // Presentation.
    selectorName:
      imageSelectorName(tauriId) ?? imageFullName(tauriId) ?? tauriId,
    selectorDescription: imageSelectorDescription(tauriId) ?? "",
    selectorBadges: imageSelectorBadges(tauriId) ?? [],
    tags: imageTags(tauriId),
    progressBarTime: imageProgressBarTime(tauriId),

    // Desktop-native provider knowledge.
    providers: imageProviders(tauriId),

    // Page-subsetting flags.
    canTextToImage: imageCanTextToImage(tauriId),
    canEditImages: imageCanEditImages(tauriId),
    usesInpaintingMask: imageUsesInpaintingMask(tauriId),
    editingIsInpainting: imageEditingIsInpainting(tauriId),
    canEditAngles: imageCanEditAngles(tauriId),

    // Capability fallbacks (the API overrides these when it knows better).
    maxPromptLength: imageMaxPromptLength(tauriId),
    maxGenerationCount: imageMaxGenerationCount(tauriId) ?? 4,
    defaultGenerationCount: imageDefaultGenerationCount(tauriId) ?? 1,
    predefinedGenerationCounts: imagePredefinedGenerationCounts(tauriId),
    canUseImagePrompt: imageCanUseImagePrompt(tauriId),
    maxImagePromptCount: imageMaxImagePromptCount(tauriId),
    // Every current overlay entry enables aspect ratio switching.
    canChangeAspectRatio: true,
    aspectRatios: imageAspectRatios(tauriId),
    defaultAspectRatio: imageDefaultAspectRatio(tauriId),
    canChangeResolution: imageResolutions(tauriId) !== undefined,
    resolutions: imageResolutions(tauriId),
    defaultResolution: imageDefaultResolution(tauriId),
    qualityOptions: imageQualityOptions(tauriId),
    defaultQuality: imageDefaultQuality(tauriId),
  });

export const IMAGE_MODELS: ImageModel[] = KNOWN_IMAGE_TAURI_IDS.map(
  buildStaticImageModel,
);

export const IMAGE_MODELS_BY_ID: Map<string, ImageModel> = new Map(
  IMAGE_MODELS.map((model) => [model.id, model]),
);

if (IMAGE_MODELS_BY_ID.size !== IMAGE_MODELS.length) {
  throw new Error("All image models must have unique IDs");
}
