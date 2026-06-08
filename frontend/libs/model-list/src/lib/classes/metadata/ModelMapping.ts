import React from "react";
import { ModelCreator } from "./ModelCreator.js";
import { getCreatorIcon } from "./ModelCreatorIcons.js";

// Map from model type strings to ModelCreator enum values
export const MODEL_TYPE_TO_CREATOR: Record<string, ModelCreator> = {
  flux_1_dev: ModelCreator.BlackForestLabs,
  flux_1_schnell: ModelCreator.BlackForestLabs,
  flux_pro_1p1: ModelCreator.BlackForestLabs,
  flux_pro_1p1_ultra: ModelCreator.BlackForestLabs,
  flux_pro_kontext_max: ModelCreator.BlackForestLabs,
  flux_dev_juggernaut: ModelCreator.BlackForestLabs,
  flux_pro_1: ModelCreator.BlackForestLabs,
  // Aliases commonly returned by other services
  flux_pro_1_1: ModelCreator.BlackForestLabs,
  flux_pro_1_1_ultra: ModelCreator.BlackForestLabs,
  gpt_image_1: ModelCreator.OpenAi,
  gpt_image_1p5: ModelCreator.OpenAi,
  gpt_image_2: ModelCreator.OpenAi,
  // Kling — p-style IDs
  kling_1p6_pro: ModelCreator.Kling,
  kling_2p1_pro: ModelCreator.Kling,
  kling_2p1_master: ModelCreator.Kling,
  kling_2p5_turbo_pro: ModelCreator.Kling,
  kling_2p6_pro: ModelCreator.Kling,
  kling_3p0_standard: ModelCreator.Kling,
  kling_3p0_pro: ModelCreator.Kling,
  // Kling — dot-normalized aliases (backend sends e.g. "kling_1.6_pro", normalizeModelKey converts . → _)
  kling_1_6_pro: ModelCreator.Kling,
  kling_2_1_pro: ModelCreator.Kling,
  kling_2_1_master: ModelCreator.Kling,
  // Seedance — p-style IDs
  seedance_1p0_lite: ModelCreator.Bytedance,
  seedance_1p5_pro: ModelCreator.Bytedance,
  seedance_2p0: ModelCreator.Bytedance,
  seedance_2p0_fast: ModelCreator.Bytedance,
  seedance_2p0_bp: ModelCreator.Bytedance,
  seedance_2p0_bp_fast: ModelCreator.Bytedance,
  seedance_2p0_u: ModelCreator.Bytedance,
  seedance_2p0_u_fast: ModelCreator.Bytedance,
  seedance_2p0_bpu: ModelCreator.Bytedance,
  seedance_2p0_bpu_fast: ModelCreator.Bytedance,
  // Seedance — dot-normalized aliases
  seedance_1_0_lite: ModelCreator.Bytedance,
  // Seedream
  seedream_4: ModelCreator.Bytedance,
  seedream_4p5: ModelCreator.Bytedance,
  seedream_5_lite: ModelCreator.Bytedance,
  // Sora
  sora_2: ModelCreator.OpenAi,
  sora_2_pro: ModelCreator.OpenAi,
  // Veo
  veo_2: ModelCreator.Google,
  veo_3: ModelCreator.Google,
  veo_3_fast: ModelCreator.Google,
  veo_3p1: ModelCreator.Google,
  veo_3p1_fast: ModelCreator.Google,
  gemini_25_flash: ModelCreator.Google,
  nano_banana: ModelCreator.Google,
  nano_banana_2: ModelCreator.Google,
  nano_banana_pro: ModelCreator.Google,
  recraft_3: ModelCreator.Recraft,
  // Hunyuan — p-style IDs
  hunyuan_3d: ModelCreator.Tencent,
  hunyuan_3d_2p0: ModelCreator.Tencent,
  hunyuan_3d_2p1: ModelCreator.Tencent,
  hunyuan_3d_2: ModelCreator.Tencent,
  hunyuan_3d_3: ModelCreator.Tencent,
  // Hunyuan — dot-normalized aliases
  hunyuan_3d_2_0: ModelCreator.Tencent,
  hunyuan_3d_2_1: ModelCreator.Tencent,
  worldlabs_gaussian: ModelCreator.WorldLabs,
  marble_0p1_mini: ModelCreator.WorldLabs,
  marble_0p1_plus: ModelCreator.WorldLabs,
  grok_image: ModelCreator.Grok,
  grok_imagine_image: ModelCreator.Grok,
  grok_imagine_image_q: ModelCreator.Grok,
  grok_video: ModelCreator.Grok,
  grok_imagine_video: ModelCreator.Grok,
  grok_imagine_video_1p5: ModelCreator.Grok,
  midjourney: ModelCreator.Midjourney,
  midjourney_v6: ModelCreator.Midjourney,
  midjourney_v6p1: ModelCreator.Midjourney,
  midjourney_v6p1_raw: ModelCreator.Midjourney,
  midjourney_v7: ModelCreator.Midjourney,
  midjourney_v7_raw: ModelCreator.Midjourney,
  midjourney_v7_draft_raw: ModelCreator.Midjourney,
  // Underscore-numbered IDs the backend actually sends for current MJ models
  midjourney_7: ModelCreator.Midjourney,
  midjourney_7_niji: ModelCreator.Midjourney,
  midjourney_8: ModelCreator.Midjourney,
  // Angles
  flux_2_lora_angles: ModelCreator.BlackForestLabs,
  qwen_edit_2511_angles: ModelCreator.Alibaba,
  // Happy Horse (Alibaba wanvideo)
  happy_horse_1p0: ModelCreator.Alibaba,
  // Beeble (Background Change / VFX)
  switch_x: ModelCreator.Beeble,
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
    // Grok
    grok_image: "Grok Image",
    grok_imagine_image: "Grok Imagine",
    grok_imagine_image_q: "Grok Imagine Quality",
    grok_video: "Grok Video",
    grok_imagine_video: "Grok Imagine",
    grok_imagine_video_1p5: "Grok Imagine 1.5",

    // Flux — Black Forest Labs
    flux_1_dev: "Flux 1 Dev",
    flux_1_schnell: "Flux 1 Schnell",
    flux_pro_1p1: "Flux Pro 1.1",
    flux_pro_1p1_ultra: "Flux Pro 1.1 Ultra",
    flux_pro_kontext_max: "Flux Pro Kontext Max",
    flux_dev_juggernaut: "Flux Dev Juggernaut",
    flux_pro_1: "Flux Pro (Inpainting)",
    // Aliases (dot-normalized underscores)
    flux_pro_1_1: "Flux Pro 1.1",
    flux_pro_1_1_ultra: "Flux Pro 1.1 Ultra",

    // OpenAI
    gpt_image_1: "GPT Image 1",
    gpt_image_1p5: "GPT Image 1.5",
    gpt_image_2: "GPT Image 2",
    sora_2: "Sora 2",
    sora_2_pro: "Sora 2 Pro",

    // Kling — p-style IDs
    kling_1p6_pro: "Kling 1.6 Pro",
    kling_2p1_pro: "Kling 2.1 Pro",
    kling_2p1_master: "Kling 2.1 Master",
    kling_2p5_turbo_pro: "Kling 2.5 Turbo Pro",
    kling_2p6_pro: "Kling 2.6 Pro",
    kling_3p0_standard: "Kling 3.0 Standard",
    kling_3p0_pro: "Kling 3.0 Pro",
    // Kling — dot-normalized aliases (backend sends e.g. "kling_1.6_pro", normalizeModelKey converts . → _)
    kling_1_6_pro: "Kling 1.6 Pro",
    kling_2_1_pro: "Kling 2.1 Pro",
    kling_2_1_master: "Kling 2.1 Master",

    // Seedance (ByteDance) — p-style IDs
    seedance_1p0_lite: "Seedance 1.0 Lite",
    seedance_1p5_pro: "Seedance 1.5 Pro",
    seedance_2p0: "Seedance 2.0",
    seedance_2p0_fast: "Seedance 2.0 Fast",
    seedance_2p0_bp: "Seedance 2.0 Plus",
    seedance_2p0_bp_fast: "Seedance 2.0 Plus Fast",
    seedance_2p0_u: "Seedance 2.0 Ultra",
    seedance_2p0_u_fast: "Seedance 2.0 Ultra Fast",
    seedance_2p0_bpu: "Seedance 2.0 Plus Ultra",
    seedance_2p0_bpu_fast: "Seedance 2.0 Plus Ultra Fast",
    // Seedance — dot-normalized aliases
    seedance_1_0_lite: "Seedance 1.0 Lite",

    // Happy Horse (Alibaba wanvideo)
    happy_horse_1p0: "Happy Horse 1.0",

    // Seedream (ByteDance)
    seedream_4: "Seedream 4",
    seedream_4p5: "Seedream 4.5",
    seedream_5_lite: "Seedream 5 Lite",

    // Google
    veo_2: "Google Veo 2",
    veo_3: "Google Veo 3",
    veo_3_fast: "Google Veo 3 Fast",
    veo_3p1: "Google Veo 3.1",
    veo_3p1_fast: "Google Veo 3.1 Fast",
    gemini_25_flash: "Nano Banana",
    nano_banana: "Nano Banana",
    nano_banana_2: "Nano Banana 2",
    nano_banana_pro: "Nano Banana Pro",

    // Recraft
    recraft_3: "Recraft 3",

    // Hunyuan (Tencent) — p-style IDs
    hunyuan_3d: "Hunyuan 3D",
    hunyuan_3d_2: "Hunyuan 3D 2.0",
    hunyuan_3d_2p0: "Hunyuan 3D 2.0",
    hunyuan_3d_2p1: "Hunyuan 3D 2.1",
    hunyuan_3d_3: "Hunyuan 3D 3.0",
    // Hunyuan — dot-normalized aliases
    hunyuan_3d_2_0: "Hunyuan 3D 2.0",
    hunyuan_3d_2_1: "Hunyuan 3D 2.1",

    // World Labs
    worldlabs_gaussian: "World Labs Marble",
    marble_0p1_mini: "Marble Mini",
    marble_0p1_plus: "Marble Plus",

    // Catch-all bucket for Midjourney.
    midjourney: "Midjourney",

    // Specific Midjourney models.
    midjourney_v6: "Midjourney V6",
    midjourney_v6p1: "Midjourney V6.1",
    midjourney_v6p1_raw: "Midjourney V6.1 (Raw)",
    midjourney_v7: "Midjourney V7",
    midjourney_v7_raw: "Midjourney V7 (Raw)",
    midjourney_v7_draft_raw: "Midjourney V7 (Draft Raw)",
    // Underscore-numbered IDs the backend actually sends for current MJ models
    midjourney_7: "Midjourney v7",
    midjourney_7_niji: "Midjourney v7 Niji (Anime)",
    midjourney_8: "Midjourney v8",

    // Angles
    flux_2_lora_angles: "Flux 2 LoRA Angles",
    qwen_edit_2511_angles: "Qwen Edit 2511 Angles",

    // Beeble (Background Change / VFX)
    switch_x: "Beeble SwitchX",
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
