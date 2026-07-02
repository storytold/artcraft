// Static video model overlay, assembled from the per-feature lookup
// functions in `../loader/videoModelFeatures.ts`. At runtime the backend
// omni listing drives membership + capabilities (`buildModelsFromListing.ts`);
// these instances only contribute frontend-only data (presentation, page
// flags, providers) and capability fallbacks.

import { VideoModel } from "../classes/VideoModel.js";
import {
  KNOWN_VIDEO_TAURI_IDS,
  videoCreator,
  videoDefaultDuration,
  videoDefaultResolution,
  videoDurationOptions,
  videoEndFrame,
  videoFullName,
  videoGenerateWithSound,
  videoLegacyId,
  videoMaxAudioRefDuration,
  videoMaxPromptLength,
  videoMaxReferenceAudios,
  videoMaxReferenceImages,
  videoMaxReferenceVideos,
  videoMaxVideoRefDuration,
  videoProgressBarTime,
  videoProviders,
  videoRequiresImage,
  videoResolutionOptions,
  videoSelectorBadges,
  videoSelectorDescription,
  videoSelectorName,
  videoSizeOptions,
  videoStartFrame,
  videoSupportsCommonAspectRatio,
  videoSupportsReferenceMode,
  videoSupportsSystemPrompt,
  videoTags,
  videoTextToVideoSupported,
} from "../loader/videoModelFeatures.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";

const buildStaticVideoModel = (tauriId: string): VideoModel =>
  new VideoModel({
    // Identity.
    id: videoLegacyId(tauriId) ?? tauriId,
    tauriId,
    fullName: videoFullName(tauriId) ?? tauriId,
    category: "video",
    creator: videoCreator(tauriId) ?? ModelCreator.ArtCraft,

    // Presentation.
    selectorName:
      videoSelectorName(tauriId) ?? videoFullName(tauriId) ?? tauriId,
    selectorDescription: videoSelectorDescription(tauriId) ?? "",
    selectorBadges: videoSelectorBadges(tauriId) ?? [],
    tags: videoTags(tauriId),
    progressBarTime: videoProgressBarTime(tauriId),

    // Desktop-native provider knowledge.
    providers: videoProviders(tauriId),

    // Prompting.
    maxPromptLength: videoMaxPromptLength(tauriId),
    supportsSystemPrompt: videoSupportsSystemPrompt(tauriId),
    textToVideoSupported: videoTextToVideoSupported(tauriId),
    generateWithSound: videoGenerateWithSound(tauriId),

    // Keyframes / input images.
    startFrame: videoStartFrame(tauriId) ?? false,
    endFrame: videoEndFrame(tauriId) ?? false,
    requiresImage: videoRequiresImage(tauriId) ?? false,

    // Size / aspect ratio.
    sizeOptions: videoSizeOptions(tauriId),
    supportsCommonAspectRatio: videoSupportsCommonAspectRatio(tauriId),

    // Duration / resolution.
    durationOptions: videoDurationOptions(tauriId),
    defaultDuration: videoDefaultDuration(tauriId),
    resolutionOptions: videoResolutionOptions(tauriId),
    defaultResolution: videoDefaultResolution(tauriId),

    // Reference mode.
    supportsReferenceMode: videoSupportsReferenceMode(tauriId),
    maxReferenceImages: videoMaxReferenceImages(tauriId),
    maxReferenceVideos: videoMaxReferenceVideos(tauriId),
    maxVideoRefDuration: videoMaxVideoRefDuration(tauriId),
    maxReferenceAudios: videoMaxReferenceAudios(tauriId),
    maxAudioRefDuration: videoMaxAudioRefDuration(tauriId),
  });

export const VIDEO_MODELS: VideoModel[] = KNOWN_VIDEO_TAURI_IDS.map(
  buildStaticVideoModel,
);

export const VIDEO_MODELS_BY_ID: Map<string, VideoModel> = new Map(
  VIDEO_MODELS.map((model) => [model.id, model]),
);

if (VIDEO_MODELS_BY_ID.size !== VIDEO_MODELS.length) {
  throw new Error("All video models must have unique IDs");
}
