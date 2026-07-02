// Builds the picker model lists FROM the backend omni listing (the Tauri
// command response). Membership + order come from the backend, and every
// capability the API expresses is mapped 1:1 — the static overlay lists
// (`IMAGE_MODELS` / `VIDEO_MODELS`) only contribute what the API does not
// return:
//   - presentation (selectorName/Description/Badges, tags, progressBarTime)
//   - page-subsetting flags (canTextToImage, canEditImages, canEditAngles, …)
//   - desktop-native provider knowledge (`providers`)
//   - models the backend registry doesn't know (switch_x, inpaint models, …)
//
// API capability fields ALWAYS win over the overlay's copies, so the overlay's
// capability data is dead at runtime for backend-known models and can be
// deleted from the lists.
//
// Pure module (no tauri-api import). The store in `@storyteller/tauri-api`
// feeds it the command payload's `models[]`; the DTO is accepted structurally.

import { ImageModel } from "../classes/ImageModel.js";
import { VideoModel } from "../classes/VideoModel.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";
import { SizeIconOption, SizeOption } from "../classes/metadata/SizeOption.js";
import { CommonAspectRatio } from "../classes/properties/CommonAspectRatio.js";
import { CommonResolution } from "../classes/properties/CommonResolution.js";
import { CommonQuality } from "../classes/properties/CommonQuality.js";
import { imageSelectorName } from "./imageModelFeatures.js";
import { videoSelectorName } from "./videoModelFeatures.js";
import {
  BACKEND_TO_TAURI_IMAGE_ID,
  BACKEND_TO_TAURI_VIDEO_ID,
  modelCreatorFromBackend,
} from "./modelReconciliation.js";

// ── Structural shapes of the backend listing (subset we read) ──────────────

export interface ListingModelBase {
  model: string;
  model_creator?: string | null;
  full_name?: string | null;
  text_prompt_supported?: boolean | null;
  text_prompt_max_length?: number | null;
  batch_size_max?: number | null;
  batch_size_default?: number | null;
  batch_size_options?: number[] | null;
  aspect_ratio_options?: string[] | null;
  aspect_ratio_default?: string | null;
  resolution_options?: string[] | null;
  resolution_default?: string | null;
  quality_options?: string[] | null;
  default_quality?: string | null;
  is_disabled?: boolean | null;
}

export interface ListingImageModel extends ListingModelBase {
  image_refs_supported?: boolean | null;
  image_refs_max?: number | null;
}

export interface ListingVideoModel extends ListingModelBase {
  extra_info?: string | null;
  extra_info_short?: string | null;
  text_to_video_supported?: boolean | null;
  starting_keyframe_supported?: boolean | null;
  starting_keyframe_required?: boolean | null;
  ending_keyframe_supported?: boolean | null;
  image_references_supported?: boolean | null;
  image_references_max?: number | null;
  video_references_max?: number | null;
  video_references_max_total_duration_seconds?: number | null;
  audio_references_max?: number | null;
  audio_references_max_total_duration_seconds?: number | null;
  show_generate_with_sound_toggle?: boolean | null;
  duration_seconds_options?: number[] | null;
  duration_seconds_default?: number | null;
}

// ── Public builders ────────────────────────────────────────────────────────

export const buildImageModelsFromListing = (
  overlay: ImageModel[],
  listing: ListingImageModel[],
  offeredModelIds: string[] = [],
): ImageModel[] =>
  build(overlay, listing, offeredModelIds, BACKEND_TO_TAURI_IMAGE_ID, mergedImageModel);

export const buildVideoModelsFromListing = (
  overlay: VideoModel[],
  listing: ListingVideoModel[],
  offeredModelIds: string[] = [],
): VideoModel[] =>
  build(overlay, listing, offeredModelIds, BACKEND_TO_TAURI_VIDEO_ID, mergedVideoModel);

// ── Core assembly ──────────────────────────────────────────────────────────

// Membership: a model appears in the picker when it is
//   1. OFFERED by a provider in the response's `providers[]` (the backend's
//      publish switch — `models[]` details also contain disabled entries and
//      internal variants that must NOT surface), or
//   2. an ENABLED `models[]` detail that the frontend knows (overlay entry) —
//      covers desktop-native models like grok video that no backend provider
//      offers yet, or
//   3. a frontend-only overlay model the backend has never heard of
//      (switch_x, inpaint models, …).
// `models[]` details are the capability source either way (the enabled entry
// wins when a model is detailed twice).
const build = <T extends { tauriId: string }, L extends ListingModelBase>(
  overlay: T[],
  listing: L[],
  offeredModelIds: string[],
  alias: Record<string, string>,
  merge: (m: L, tauriId: string, overlayEntry: T | undefined) => T,
): T[] => {
  const toTauriId = (backendId: string) => alias[backendId] ?? backendId;
  const overlayByTauriId = new Map(overlay.map((m) => [m.tauriId, m]));
  const knownTauriIds = new Set(listing.map((m) => toTauriId(m.model)));
  const offeredTauriIds = new Set(offeredModelIds.map(toTauriId));

  // Capability lookup — prefer the enabled detail entry when duplicated.
  const detailsByTauriId = new Map<string, L>();
  for (const m of listing) {
    const tauriId = toTauriId(m.model);
    const existing = detailsByTauriId.get(tauriId);
    if (existing === undefined || existing.is_disabled === true) {
      detailsByTauriId.set(tauriId, m);
    }
  }

  const result: T[] = [];
  const seenTauriIds = new Set<string>();
  // Backend details order drives ordering.
  for (const m of listing) {
    const tauriId = toTauriId(m.model);
    if (seenTauriIds.has(tauriId)) continue;

    const overlayEntry = overlayByTauriId.get(tauriId);
    const detail = detailsByTauriId.get(tauriId) ?? m;
    const enabled = detail.is_disabled !== true;
    const show =
      offeredTauriIds.has(tauriId) || (enabled && overlayEntry !== undefined);
    if (!show) continue;

    seenTauriIds.add(tauriId);
    result.push(merge(detail, tauriId, overlayEntry));
  }
  // Offered models with no detail entry at all (unusual, but the publish
  // switch wins): surface minimally.
  for (const backendId of offeredModelIds) {
    const tauriId = toTauriId(backendId);
    if (seenTauriIds.has(tauriId)) continue;
    seenTauriIds.add(tauriId);
    result.push(
      merge({ model: backendId } as L, tauriId, overlayByTauriId.get(tauriId)),
    );
  }
  // Append frontend-only models the backend has never heard of.
  for (const m of overlay) {
    if (!knownTauriIds.has(m.tauriId) && !seenTauriIds.has(m.tauriId)) {
      result.push(m);
    }
  }
  return result;
};

// ── 1:1 merge constructors (API capability > overlay; presentation ← overlay)

const mergedImageModel = (
  m: ListingImageModel,
  tauriId: string,
  o: ImageModel | undefined,
): ImageModel => {
  const aspectRatios = knownValues(m.aspect_ratio_options, COMMON_ASPECT_RATIO_VALUES);
  const resolutions = knownValues(m.resolution_options, COMMON_RESOLUTION_VALUES);
  const qualityOptions = knownValues(m.quality_options, COMMON_QUALITY_VALUES);
  const fullName = m.full_name ?? o?.fullName ?? m.model;

  return new ImageModel({
    // Identity. Keep the overlay's `id` (BY_ID lookups / history) when known.
    id: o?.id ?? tauriId,
    tauriId,
    fullName,
    category: "image",
    creator: creatorFor(m.model_creator, m.model, o?.creator),

    // Presentation — the omni image API has no display fields yet.
    selectorName: imageSelectorName(tauriId) ?? fullName,
    selectorDescription: o?.selectorDescription ?? "",
    selectorBadges: o?.selectorBadges ?? [],
    tags: o?.tags ?? [],
    progressBarTime: o?.progressBarTime,

    // Page-subsetting flags — frontend-owned concepts.
    canTextToImage: o ? o.canTextToImage : m.text_prompt_supported !== false,
    canEditImages: o?.canEditImages ?? false,
    usesInpaintingMask: o?.usesInpaintingMask ?? false,
    editingIsInpainting: o?.editingIsInpainting ?? false,
    canEditAngles: o?.canEditAngles ?? false,

    // Desktop-native provider knowledge.
    providers: o?.getProviders(),

    // Capabilities — served by the API, overlay only as a transitional
    // fallback where the backend config leaves a field unset.
    maxPromptLength: m.text_prompt_max_length ?? o?.maxPromptLength,
    maxGenerationCount: m.batch_size_max ?? o?.maxGenerationCount ?? 4,
    defaultGenerationCount: m.batch_size_default ?? o?.defaultGenerationCount ?? 1,
    predefinedGenerationCounts: m.batch_size_options ?? o?.predefinedGenerationCounts,
    canUseImagePrompt: m.image_refs_supported ?? o?.canUseImagePrompt ?? false,
    maxImagePromptCount: m.image_refs_max ?? o?.maxImagePromptCount ?? 1,
    canChangeAspectRatio:
      aspectRatios.length > 0 || (o?.canChangeAspectRatio ?? false),
    aspectRatios:
      aspectRatios.length > 0 ? (aspectRatios as CommonAspectRatio[]) : o?.aspectRatios,
    defaultAspectRatio:
      (knownValue(m.aspect_ratio_default, COMMON_ASPECT_RATIO_VALUES) as
        | CommonAspectRatio
        | undefined) ?? o?.defaultAspectRatio,
    canChangeResolution:
      resolutions.length > 0 || (o?.canChangeResolution ?? false),
    resolutions:
      resolutions.length > 0 ? (resolutions as CommonResolution[]) : o?.resolutions,
    defaultResolution:
      (knownValue(m.resolution_default, COMMON_RESOLUTION_VALUES) as
        | CommonResolution
        | undefined) ?? o?.defaultResolution,
    qualityOptions:
      qualityOptions.length > 0 ? (qualityOptions as CommonQuality[]) : o?.qualityOptions,
    defaultQuality:
      (knownValue(m.default_quality, COMMON_QUALITY_VALUES) as
        | CommonQuality
        | undefined) ?? o?.defaultQuality,
  });
};

const mergedVideoModel = (
  m: ListingVideoModel,
  tauriId: string,
  o: VideoModel | undefined,
): VideoModel => {
  const aspectRatios = knownValues(m.aspect_ratio_options, COMMON_ASPECT_RATIO_VALUES);
  const fullName = m.full_name ?? o?.fullName ?? m.model;

  return new VideoModel({
    // Identity. Keep the overlay's `id` (BY_ID lookups / history) when known.
    id: o?.id ?? tauriId,
    tauriId,
    fullName,
    category: "video",
    creator: creatorFor(m.model_creator, m.model, o?.creator),

    // Presentation. The video API DOES have descriptions (extra_info_short /
    // extra_info) — prefer them so backend copy reaches the picker.
    selectorName: videoSelectorName(tauriId) ?? fullName,
    selectorDescription:
      m.extra_info_short ?? m.extra_info ?? o?.selectorDescription ?? "",
    selectorBadges: o?.selectorBadges ?? [],
    tags: o?.tags ?? [],
    progressBarTime: o?.progressBarTime,
    supportsSystemPrompt: o?.supportsSystemPrompt,

    // Desktop-native provider knowledge.
    providers: o?.getProviders(),

    // Capabilities — served by the API, overlay only as a transitional
    // fallback where the backend config leaves a field unset.
    maxPromptLength: m.text_prompt_max_length ?? o?.maxPromptLength,
    startFrame: m.starting_keyframe_supported ?? o?.startFrame ?? false,
    endFrame: m.ending_keyframe_supported ?? o?.endFrame ?? false,
    requiresImage: m.starting_keyframe_required ?? o?.requiresImage ?? false,
    textToVideoSupported: m.text_to_video_supported ?? o?.textToVideoSupported,
    generateWithSound: m.show_generate_with_sound_toggle ?? o?.generateWithSound,
    durationOptions: m.duration_seconds_options ?? o?.durationOptions,
    defaultDuration: m.duration_seconds_default ?? o?.defaultDuration,
    supportsReferenceMode: m.image_references_supported ?? o?.supportsReferenceMode,
    maxReferenceImages: m.image_references_max ?? o?.maxReferenceImages,
    maxReferenceVideos: m.video_references_max ?? o?.maxReferenceVideos,
    maxVideoRefDuration:
      m.video_references_max_total_duration_seconds ?? o?.maxVideoRefDuration,
    maxReferenceAudios: m.audio_references_max ?? o?.maxReferenceAudios,
    maxAudioRefDuration:
      m.audio_references_max_total_duration_seconds ?? o?.maxAudioRefDuration,
    resolutionOptions:
      m.resolution_options?.map(resolutionLabel) ?? o?.resolutionOptions,
    defaultResolution: m.resolution_default
      ? resolutionLabel(m.resolution_default)
      : o?.defaultResolution,
    // Aspect handling: API aspect ratios drive the modern picker; legacy
    // models (grok/sora native size UI) keep their overlay sizeOptions.
    sizeOptions:
      aspectRatios.length > 0
        ? aspectRatios.map(sizeOptionForAspectRatio)
        : o?.sizeOptions,
    supportsCommonAspectRatio:
      aspectRatios.length > 0 || (o?.supportsCommonAspectRatio ?? false),
  });
};

// ── Helpers ────────────────────────────────────────────────────────────────

const COMMON_ASPECT_RATIO_VALUES: Set<string> = new Set(Object.values(CommonAspectRatio));
const COMMON_RESOLUTION_VALUES: Set<string> = new Set(Object.values(CommonResolution));
const COMMON_QUALITY_VALUES: Set<string> = new Set(Object.values(CommonQuality));

const knownValues = (values: string[] | null | undefined, known: Set<string>): string[] =>
  (values ?? []).filter((v) => known.has(v));

const knownValue = (
  value: string | null | undefined,
  known: Set<string>,
): string | undefined => (value != null && known.has(value) ? value : undefined);

/**
 * Derive a video size picker option from a CommonAspectRatio value.
 * `tauriValue` is the CommonAspectRatio serde string sent in the request.
 */
const sizeOptionForAspectRatio = (value: string): SizeOption => {
  switch (value) {
    case "square":
      return { tauriValue: value, textLabel: "1:1", icon: SizeIconOption.Square };
    case "square_hd":
      return { tauriValue: value, textLabel: "1:1 HD", icon: SizeIconOption.Square };
    case "wide_sixteen_by_nine":
      return { tauriValue: value, textLabel: "16:9", icon: SizeIconOption.Landscape16x9 };
    case "tall_nine_by_sixteen":
      return { tauriValue: value, textLabel: "9:16", icon: SizeIconOption.Portrait9x16 };
    case "wide_four_by_three":
      return { tauriValue: value, textLabel: "4:3", icon: SizeIconOption.Standard4x3 };
    case "tall_three_by_four":
      return { tauriValue: value, textLabel: "3:4", icon: SizeIconOption.Portrait3x4 };
    case "wide_three_by_two":
      return { tauriValue: value, textLabel: "3:2", icon: SizeIconOption.Landscape };
    case "tall_two_by_three":
      return { tauriValue: value, textLabel: "2:3", icon: SizeIconOption.Portrait };
    case "wide_five_by_four":
      return { tauriValue: value, textLabel: "5:4", icon: SizeIconOption.Landscape };
    case "tall_four_by_five":
      return { tauriValue: value, textLabel: "4:5", icon: SizeIconOption.Portrait };
    case "wide_twenty_one_by_nine":
      return { tauriValue: value, textLabel: "21:9", icon: SizeIconOption.Landscape16x9 };
    case "tall_nine_by_twenty_one":
      return { tauriValue: value, textLabel: "9:21", icon: SizeIconOption.Portrait9x16 };
    case "wide":
      return { tauriValue: value, textLabel: "Landscape", icon: SizeIconOption.Landscape };
    case "tall":
      return { tauriValue: value, textLabel: "Portrait", icon: SizeIconOption.Portrait };
    case "auto":
      return { tauriValue: value, textLabel: "Auto", icon: SizeIconOption.Square };
    default:
      return { tauriValue: value, textLabel: value, icon: SizeIconOption.Square };
  }
};

/**
 * CommonResolution serde value -> the UI label form the video promptbox uses.
 * (PromptBoxVideo's RESOLUTION_STRING_TO_COMMON accepts both forms; labels
 * display better.)
 */
const resolutionLabel = (value: string): string => {
  switch (value) {
    case "four_eighty_p":
      return "480p";
    case "seven_twenty_p":
      return "720p";
    case "ten_eighty_p":
      return "1080p";
    default:
      return value; // Raw enum value; still request-mappable.
  }
};

// Guess a creator from the API's `model_creator`, then the overlay, then the
// model-id prefix, then ArtCraft.
const CREATOR_BY_PREFIX: Array<[string, ModelCreator]> = [
  ["flux", ModelCreator.BlackForestLabs],
  ["nano_banana", ModelCreator.Google],
  ["gpt_image", ModelCreator.OpenAi],
  ["seedream", ModelCreator.Bytedance],
  ["seedance", ModelCreator.Bytedance],
  ["kling", ModelCreator.Kling],
  ["sora", ModelCreator.OpenAi],
  ["veo", ModelCreator.Google],
  ["grok", ModelCreator.Grok],
  ["happy_horse", ModelCreator.Alibaba],
  ["midjourney", ModelCreator.Midjourney],
  ["qwen", ModelCreator.Alibaba],
];

const creatorFor = (
  raw: string | null | undefined,
  modelId: string,
  overlayCreator: ModelCreator | undefined,
): ModelCreator => {
  const mapped = modelCreatorFromBackend(raw ?? undefined);
  if (mapped) return mapped;
  if (overlayCreator) return overlayCreator;
  for (const [prefix, creator] of CREATOR_BY_PREFIX) {
    if (modelId.startsWith(prefix)) return creator;
  }
  return ModelCreator.ArtCraft;
};
