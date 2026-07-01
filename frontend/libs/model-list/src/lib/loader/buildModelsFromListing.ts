// Builds the picker model lists FROM the backend omni listing (the Tauri
// command response), mirroring how the web apps render `res.models`. Membership
// and order come from the backend; the frontend overlay only supplies richer UI
// metadata (selectorName, badges, tags, size icons) when it has an entry for a
// model. Backend models with no overlay entry still appear via a minimal model
// built straight from the response, so NEW backend models show up immediately.
//
// Pure module (no tauri-api import). The store in `@storyteller/tauri-api` feeds
// it the command payload's `models[]`; the DTO is accepted structurally.

import { ImageModel } from "../classes/ImageModel.js";
import { VideoModel } from "../classes/VideoModel.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";
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
  is_disabled?: boolean | null;
}

export interface ListingImageModel extends ListingModelBase {
  text_prompt_supported?: boolean | null;
  image_refs_supported?: boolean | null;
  image_refs_max?: number | null;
}

export interface ListingVideoModel extends ListingModelBase {
  extra_info_short?: string | null;
  text_to_video_supported?: boolean | null;
  starting_keyframe_supported?: boolean | null;
  starting_keyframe_required?: boolean | null;
  ending_keyframe_supported?: boolean | null;
  resolution_options?: string[] | null;
  resolution_default?: string | null;
  duration_seconds_options?: number[] | null;
  duration_seconds_default?: number | null;
  show_generate_with_sound_toggle?: boolean | null;
}

// ── Public builders ────────────────────────────────────────────────────────

export const buildImageModelsFromListing = (
  overlay: ImageModel[],
  listing: ListingImageModel[],
): ImageModel[] =>
  build(overlay, listing, BACKEND_TO_TAURI_IMAGE_ID, minimalImageModel);

export const buildVideoModelsFromListing = (
  overlay: VideoModel[],
  listing: ListingVideoModel[],
): VideoModel[] =>
  build(overlay, listing, BACKEND_TO_TAURI_VIDEO_ID, minimalVideoModel);

// ── Core assembly ──────────────────────────────────────────────────────────

const build = <T extends { tauriId: string }, L extends ListingModelBase>(
  overlay: T[],
  listing: L[],
  alias: Record<string, string>,
  makeMinimal: (m: L, tauriId: string) => T,
): T[] => {
  const overlayByTauriId = new Map(overlay.map((m) => [m.tauriId, m]));
  const knownTauriIds = new Set(listing.map((m) => alias[m.model] ?? m.model));

  const result: T[] = [];
  // Backend drives membership + order.
  for (const m of listing) {
    if (m.is_disabled === true) continue;
    const tauriId = alias[m.model] ?? m.model;
    result.push(overlayByTauriId.get(tauriId) ?? makeMinimal(m, tauriId));
  }
  // Append frontend-only models the backend has never heard of (switch_x,
  // inpaint, angle models, …).
  for (const m of overlay) {
    if (!knownTauriIds.has(m.tauriId)) result.push(m);
  }
  return result;
};

// ── Minimal models (backend model with no overlay entry) ───────────────────

const minimalImageModel = (m: ListingImageModel, tauriId: string): ImageModel =>
  new ImageModel({
    id: tauriId,
    tauriId,
    fullName: displayName(m),
    category: "image",
    creator: creatorFor(m.model_creator, m.model),
    selectorName: displayName(m),
    selectorDescription: "",
    selectorBadges: [],
    maxGenerationCount: 4,
    defaultGenerationCount: 1,
    canTextToImage: m.text_prompt_supported !== false,
    canUseImagePrompt: m.image_refs_supported === true,
    maxImagePromptCount: m.image_refs_max ?? 1,
  });

const minimalVideoModel = (m: ListingVideoModel, tauriId: string): VideoModel =>
  new VideoModel({
    id: tauriId,
    tauriId,
    fullName: displayName(m),
    category: "video",
    creator: creatorFor(m.model_creator, m.model),
    selectorName: displayName(m),
    selectorDescription: m.extra_info_short ?? "",
    selectorBadges: [],
    startFrame: m.starting_keyframe_supported === true,
    endFrame: m.ending_keyframe_supported === true,
    requiresImage:
      m.starting_keyframe_required === true || m.text_to_video_supported === false,
    textToVideoSupported: m.text_to_video_supported !== false,
    resolutionOptions: m.resolution_options ?? undefined,
    defaultResolution: m.resolution_default ?? undefined,
    durationOptions: m.duration_seconds_options ?? undefined,
    defaultDuration: m.duration_seconds_default ?? undefined,
    generateWithSound: m.show_generate_with_sound_toggle === true,
  });

// ── Helpers ────────────────────────────────────────────────────────────────

const displayName = (m: ListingModelBase): string => m.full_name || m.model;

// Guess a creator from the `model_creator` field, falling back to the model-id
// prefix, then to ArtCraft.
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
): ModelCreator => {
  const mapped = modelCreatorFromBackend(raw ?? undefined);
  if (mapped) return mapped;
  for (const [prefix, creator] of CREATOR_BY_PREFIX) {
    if (modelId.startsWith(prefix)) return creator;
  }
  return ModelCreator.ArtCraft;
};
