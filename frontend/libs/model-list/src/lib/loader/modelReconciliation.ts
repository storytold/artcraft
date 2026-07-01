// Reconciles the frontend model OVERLAY (the hand-maintained `IMAGE_MODELS` /
// `VIDEO_MODELS`, which carry all the UI/product metadata + page-capability flags)
// against the backend omni listing (`ListImageModels` / `ListVideoModels`).
//
// The backend is authoritative for WHICH models are offered; the overlay is
// authoritative for the metadata the backend doesn't have (selectorName, badges,
// tags, canTextToImage/canEditImages/canEditAngles, sizeOptions, durations, and
// the frontend-only models switch_x / inpaint / angle / kontext).
//
// This module is intentionally PURE (no tauri-api import) so `model-list` stays
// free of a circular dependency. The async loader that calls the Tauri commands
// lives in `tauri-api` and feeds `knownBackendIds` / `offeredBackendIds` here.

import { ImageModel } from "../classes/ImageModel.js";
import { VideoModel } from "../classes/VideoModel.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";

/**
 * Backend omni model id (the `CommonImageModel` serde string) -> frontend `tauriId`.
 *
 * MIGRATION (2026-07): RETIRED. The overlay `tauriId`s now use the
 * storyteller-web omni identifiers directly, and the Tauri generate commands
 * accept them, so no aliasing remains. Do not add entries — fix ids at the
 * source instead. (Kept exported until the reconcile helpers are deleted.)
 * See external/reports/2026-07/storyteller-web-omni-vs-tauri-model-differences.md.
 */
export const BACKEND_TO_TAURI_IMAGE_ID: Record<string, string> = {};

export const BACKEND_TO_TAURI_VIDEO_ID: Record<string, string> = {};

/** Backend `model_creator` snake_case string -> frontend `ModelCreator` enum. */
export const modelCreatorFromBackend = (raw?: string): ModelCreator | undefined => {
  switch (raw) {
    case "alibaba": return ModelCreator.Alibaba;
    case "artcraft": return ModelCreator.ArtCraft;
    case "black_forest_labs": return ModelCreator.BlackForestLabs;
    case "bytedance": return ModelCreator.Bytedance;
    case "fal": return ModelCreator.Fal;
    case "google": return ModelCreator.Google;
    case "grok": return ModelCreator.Grok;
    case "hailuo": return ModelCreator.Hailuo;
    case "higgsfield": return ModelCreator.Higgsfield;
    case "kling": return ModelCreator.Kling;
    case "krea": return ModelCreator.Krea;
    case "midjourney": return ModelCreator.Midjourney;
    case "open_ai": return ModelCreator.OpenAi;
    case "open_art": return ModelCreator.OpenArt;
    case "recraft": return ModelCreator.Recraft;
    case "replicate": return ModelCreator.Replicate;
    case "runway": return ModelCreator.Runway;
    case "stability": return ModelCreator.Stability;
    case "tencent": return ModelCreator.Tencent;
    case "tensor_art": return ModelCreator.TensorArt;
    case "vidu": return ModelCreator.Vidu;
    case "world_labs": return ModelCreator.WorldLabs;
    default: return undefined;
  }
};

const toTauriIds = (backendIds: string[], alias: Record<string, string>): Set<string> =>
  new Set(backendIds.map((id) => alias[id] ?? id));

/**
 * Membership is BACKEND-DRIVEN, mirroring the web apps' `omni-gen-hooks` (which
 * render `res.models.filter((m) => m.is_disabled !== true)`):
 *
 * - Keep an overlay model when the backend returns it ENABLED.
 * - Drop it when the backend KNOWS the model but has it disabled (`is_disabled`).
 * - Keep it when the backend has never heard of it — a frontend-only model like
 *   `switch_x` / inpaint / angles that has no omni counterpart.
 *
 * The overlay only supplies the UI metadata the backend lacks (selectorName,
 * badges, tags, capability flags); the backend response decides what appears.
 */
const reconcile = <T extends { tauriId: string }>(
  overlay: T[],
  knownBackendIds: string[],
  enabledBackendIds: string[],
  alias: Record<string, string>,
): T[] => {
  const known = toTauriIds(knownBackendIds, alias);
  const enabled = toTauriIds(enabledBackendIds, alias);
  return overlay.filter((m) => enabled.has(m.tauriId) || !known.has(m.tauriId));
};

export const reconcileImageModels = (
  overlay: ImageModel[],
  knownBackendIds: string[],
  enabledBackendIds: string[],
): ImageModel[] => reconcile(overlay, knownBackendIds, enabledBackendIds, BACKEND_TO_TAURI_IMAGE_ID);

export const reconcileVideoModels = (
  overlay: VideoModel[],
  knownBackendIds: string[],
  enabledBackendIds: string[],
): VideoModel[] => reconcile(overlay, knownBackendIds, enabledBackendIds, BACKEND_TO_TAURI_VIDEO_ID);
