import React from "react";
import { ModelCreator } from "./ModelCreator.js";
import { getCreatorIcon } from "./ModelCreatorIcons.js";

// Normalize a model id/type key for lookups (lowercase, dots → underscores)
const normalizeModelKey = (modelType: string): string =>
  modelType.toLowerCase().replace(/\./g, "_").trim();

/** Matches all seedance_* variants (video-only; image models are seedream_*). */
export const isSeedanceVideoModelId = (modelId: string): boolean =>
  normalizeModelKey(modelId).startsWith("seedance");

const CHINESE_CHARACTERS_REGEX = /\p{Script=Han}/u;

/**
 * Effective soft prompt-length limit for a model. Normally the model's
 * `text_prompt_max_length`, but seedance waives the limit (Infinity) when the
 * prompt contains Chinese characters: the server counts CJK characters as
 * more than one unit, so a client-side character count would false-positive.
 */
export const effectivePromptMaxLength = (
  modelId: string,
  modelMaxLength: number | undefined,
  prompt: string,
): number | undefined => {
  if (isSeedanceVideoModelId(modelId) && CHINESE_CHARACTERS_REGEX.test(prompt)) {
    return Infinity;
  }
  return modelMaxLength;
};

// Convert model type string to human-readable display name. An API-provided
// full name (when present) wins over the static map.
export const getModelDisplayName = (
  modelType: string,
  fullName?: string | null,
): string => {
  if (fullName) return fullName;

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
    flux_3: "Flux 3",
    flux_3_draft: "Flux 3 Draft",
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
    seedance_1p0_pro: "Seedance 1.0 Pro",
    seedance_1p5_pro: "Seedance 1.5 Pro",
    seedance_2p0: "Seedance 2.0",
    seedance_2p0_fast: "Seedance 2.0 Fast",
    seedance_2p0_mini: "Seedance 2.0 Mini",
    seedance_2p0_bp: "Seedance 2.0 Plus",
    seedance_2p0_bp_fast: "Seedance 2.0 Plus Fast",
    seedance_2p0_bp_mini: "Seedance 2.0 Plus Mini",
    seedance_2p0_u: "Seedance 2.0 Ultra",
    seedance_2p0_u_fast: "Seedance 2.0 Ultra Fast",
    seedance_2p0_bpu: "Seedance 2.0 Plus Ultra",
    seedance_2p0_bpu_fast: "Seedance 2.0 Plus Ultra Fast",
    seedance_2p0_bpu_mini: "Seedance 2.0 Plus Ultra Mini",
    seedance_2p5: "Seedance 2.5",
    seedance_2p5_preview: "Seedance 2.5 Preview",
    // Seedance — dot-normalized aliases
    seedance_1_0_lite: "Seedance 1.0 Lite",
    // Anonymous preview aliases the backend used pre-announce
    preview_model: "Preview Model",
    preview_model_fast: "Preview Model Fast",

    // Happy Horse (Alibaba wanvideo)
    happy_horse_1p0: "Happy Horse 1.0",

    // MiniMax (Hailuo)
    minimax_h3: "MiniMax H3",

    // Seedream / SeedEdit (ByteDance)
    seedream_4: "Seedream 4",
    seedream_4p5: "Seedream 4.5",
    seedream_5_lite: "Seedream 5 Lite",
    seedream_5p0_pro: "Seedream 5.0 Pro",
    seedream_5p0_pro_u: "Seedream 5.0 Pro Ultra",
    seededit_3: "SeedEdit 3",

    // Audio — Suno
    suno_music: "Suno Music",
    suno_remix: "Suno Remix",
    suno_sounds: "Suno Sounds",
    suno_sample: "Suno Sample",

    // Audio — Seed Audio (ByteDance)
    seed_audio_1p0: "Seed Audio 1.0",

    // Google
    veo_2: "Google Veo 2",
    veo_3: "Google Veo 3",
    veo_3_fast: "Google Veo 3 Fast",
    veo_3p1: "Google Veo 3.1",
    veo_3p1_fast: "Google Veo 3.1 Fast",
    veo_3p1_lite: "Google Veo 3.1 Lite",
    gemini_25_flash: "Nano Banana",
    nano_banana: "Nano Banana",
    nano_banana_2: "Nano Banana 2",
    nano_banana_pro: "Nano Banana Pro",

    // Recraft
    recraft_3: "Recraft 3",

    // Vidu
    vidu_q3: "Vidu Q3",
    vidu_q3_turbo: "Vidu Q3 Turbo",

    // Hunyuan (Tencent) — p-style IDs
    hunyuan_3d: "Hunyuan 3D",
    hunyuan_3d_2: "Hunyuan 3D 2.0",
    hunyuan_3d_2p0: "Hunyuan 3D 2.0",
    hunyuan_3d_2p1: "Hunyuan 3D 2.1",
    hunyuan_3d_3: "Hunyuan 3D 3.0",
    hunyuan_3d_3_sketch: "Hunyuan 3D 3 Sketch",
    hunyuan_3d_3p1_pro: "Hunyuan 3D 3.1 Pro",
    hunyuan_3d_3p1_rapid: "Hunyuan 3D 3.1 Rapid",
    hunyuan_3d_3p1_part: "Hunyuan 3D 3.1 Part",
    hunyuan_3d_3p1_topology: "Hunyuan 3D 3.1 Smart Topology",
    // Hunyuan — dot-normalized aliases
    hunyuan_3d_2_0: "Hunyuan 3D 2.0",
    hunyuan_3d_2_1: "Hunyuan 3D 2.1",

    // Other 3D mesh models
    tripo3d_h3p1: "Tripo3D H3.1",
    meshy_v6: "Meshy 6",
    rodin_2p5_fast: "Rodin 2.5 Fast",

    // World Labs
    worldlabs_gaussian: "World Labs Marble",
    marble_0p1_mini: "Marble Mini",
    marble_0p1_plus: "Marble Plus",
    marble_1p0: "Marble 1.0",
    marble_1p0_draft: "Marble 1.0 Draft",
    marble_1p1: "Marble 1.1",
    marble_1p1_plus: "Marble 1.1 Plus",

    // Tripo (splats)
    triposplat: "TripoSplat",

    // Catch-all bucket for Midjourney.
    midjourney: "Midjourney",

    // Specific Midjourney models.
    midjourney_v6: "Midjourney V6",
    midjourney_v6p1: "Midjourney V6.1",
    midjourney_v6p1_raw: "Midjourney V6.1 (Raw)",
    midjourney_v7: "Midjourney V7",
    midjourney_v7_raw: "Midjourney V7 (Raw)",
    midjourney_v7_draft: "Midjourney V7 (Draft)",
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
