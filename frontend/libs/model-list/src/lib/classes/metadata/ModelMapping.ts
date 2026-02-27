import React from "react";
import { ModelCreator } from "./ModelCreator.js";
import { getCreatorIcon } from "./ModelCreatorIcons.js";

// Map from model type strings to ModelCreator enum values
export const MODEL_TYPE_TO_CREATOR: Record<string, ModelCreator> = {
  flux_1_dev: ModelCreator.BlackForestLabs,
  flux_1_schnell: ModelCreator.BlackForestLabs,
  flux_pro_1p1: ModelCreator.BlackForestLabs,
  flux_pro_1p1_ultra: ModelCreator.BlackForestLabs,
  // Aliases commonly returned by other services
  flux_pro_1_1: ModelCreator.BlackForestLabs,
  flux_pro_1_1_ultra: ModelCreator.BlackForestLabs,
  gpt_image_1: ModelCreator.OpenAi,
  kling_1p6_pro: ModelCreator.Kling,
  kling_2p1_pro: ModelCreator.Kling,
  kling_2p1_master: ModelCreator.Kling,
  seedance_1p0_lite: ModelCreator.Bytedance,
  seedance_2p0: ModelCreator.Bytedance,
  sora_2: ModelCreator.OpenAi,
  veo_2: ModelCreator.Google,
  gemini_25_flash: ModelCreator.Google,
  nano_banana: ModelCreator.Google,
  nano_banana_pro: ModelCreator.Google,
  recraft_3: ModelCreator.Recraft,
  hunyuan_3d: ModelCreator.Tencent,
  worldlabs_gaussian: ModelCreator.WorldLabs,
  grok_image: ModelCreator.Grok,
  grok_video: ModelCreator.Grok,
  midjourney: ModelCreator.Midjourney,
  midjourney_v6: ModelCreator.Midjourney,
  midjourney_v6p1: ModelCreator.Midjourney,
  midjourney_v6p1_raw: ModelCreator.Midjourney,
  midjourney_v7: ModelCreator.Midjourney,
  midjourney_v7_raw: ModelCreator.Midjourney,
  midjourney_v7_draft_raw: ModelCreator.Midjourney,
};

// Get creator icon for a model type
const normalizeModelKey = (modelType: string): string =>
  modelType.toLowerCase().replace(/\./g, "_").trim();

export const getModelCreatorIcon = (
  modelType: string,
): React.ReactNode | null => {
  const creator = MODEL_TYPE_TO_CREATOR[normalizeModelKey(modelType)];
  if (!creator) return null;
  return getCreatorIcon(creator, "h-4 w-4 invert");
};

// Get creator name for display
export const getModelCreatorName = (modelType: string): string | null => {
  const creator = MODEL_TYPE_TO_CREATOR[normalizeModelKey(modelType)];

  // Convert enum value to display name
  switch (creator) {
    case ModelCreator.BlackForestLabs:
      return "Black Forest Labs";
    case ModelCreator.OpenAi:
      return "OpenAI";
    case ModelCreator.Kling:
      return "Kling AI";
    case ModelCreator.Bytedance:
      return "ByteDance";
    case ModelCreator.Google:
      return "Google";
    case ModelCreator.Midjourney:
      return "Midjourney";
    case ModelCreator.Stability:
      return "Stability AI";
    case ModelCreator.Runway:
      return "Runway";
    case ModelCreator.Hailuo:
      return "Hailuo";
    case ModelCreator.Recraft:
      return "Recraft";
    case ModelCreator.Tencent:
      return "Tencent";
    case ModelCreator.Alibaba:
      return "Alibaba";
    case ModelCreator.Vidu:
      return "Vidu";
    case ModelCreator.Fal:
      return "Fal";
    case ModelCreator.Replicate:
      return "Replicate";
    case ModelCreator.TensorArt:
      return "TensorArt";
    case ModelCreator.OpenArt:
      return "OpenArt";
    case ModelCreator.Higgsfield:
      return "Higgsfield";
    case ModelCreator.Krea:
      return "Krea";
    case ModelCreator.Grok:
      return "Grok";
    case ModelCreator.WorldLabs:
      return "World Labs";
    default:
      return creator;
  }
};

// Convert model type string to human-readable display name
export const getModelDisplayName = (modelType: string): string => {
  const displayNames: Record<string, string> = {
    grok_image: "Grok Image",
    grok_video: "Grok Video",
    flux_1_dev: "Flux 1 Dev",
    flux_1_schnell: "Flux 1 Schnell",
    flux_pro_1p1: "Flux Pro 1.1",
    flux_pro_1p1_ultra: "Flux Pro 1.1 Ultra",
    // Aliases
    flux_pro_1_1: "Flux Pro 1.1",
    flux_pro_1_1_ultra: "Flux Pro 1.1 Ultra",
    gpt_image_1: "GPT Image 1",
    kling_1p6_pro: "Kling 1.6 Pro",
    kling_2p1_pro: "Kling 2.1 Pro",
    kling_2p1_master: "Kling 2.1 Master",
    seedance_1p0_lite: "Seedance 1.0 Lite",
    seedance_2p0: "Seedance 2.0",
    veo_2: "Veo 2",
    sora_2: "Sora 2",
    recraft_3: "Recraft 3",
    hunyuan_3d_2p0: "Hunyuan 3D 2.0",
    hunyuan_3d_2p1: "Hunyuan 3D 2.1",
    hunyuan_3d: "Hunyuan 3D",
    worldlabs_gaussian: "World Labs Marble",
    flux_pro_kontext_max: "Flux Pro Kontext Max",
    gemini_25_flash: "Nano Banana",
    nano_banana: "Nano Banana",
    nano_banana_pro: "Nano Banana Pro",
    flux_dev_juggernaut: "Flux Dev Juggernaut",

    // Catch-all bucket for Midjourney.
    midjourney: "Midjourney",

    // Specific Midjourney models.
    midjourney_v6: "Midjourney V6",
    midjourney_v6p1: "Midjourney V6.1",
    midjourney_v6p1_raw: "Midjourney V6.1 (Raw)",
    midjourney_v7: "Midjourney V7",
    midjourney_v7_raw: "Midjourney V7 (Raw)",
    midjourney_v7_draft_raw: "Midjourney V7 (Draft Raw)",

    // TODO: add more models here - BFlat
  };

  const key = normalizeModelKey(modelType);
  return displayNames[key] || modelType;
};

// Convert provider string to human-readable display name (this is for the provider priority in settings)
export const getProviderDisplayName = (provider: string): string => {
  const displayNames: Record<string, string> = {
    artcraft: "ArtCraft",
    fal: "FAL",
    grok: "Grok",
    midjourney: "Midjourney",
    sora: "Sora",
    worldlabs: "World Labs",
  };

  return displayNames[provider] || provider;
};

// Get provider icon (string-based provider)
export const getProviderIconByName = (
  provider: string,
  className = "h-4 w-4 invert",
): React.ReactNode | null => {
  const providerToCreator: Record<string, ModelCreator> = {
    artcraft: ModelCreator.ArtCraft,
    fal: ModelCreator.Fal,
    grok: ModelCreator.Grok,
    midjourney: ModelCreator.Midjourney,
    sora: ModelCreator.OpenAi,
    worldlabs: ModelCreator.WorldLabs,
  };
  const creator = providerToCreator[provider?.toLowerCase?.() ?? ""];
  if (!creator) return null;
  return getCreatorIcon(creator, className);
};
