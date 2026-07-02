// Frontend-only per-feature data for image models, keyed by `tauriId`.
//
// Each exported function is a sparse lookup: a model has an entry ONLY when
// its value differs from the class default (see `ImageModel` / `Model`), so
// every feature is individually inspectable and deletable once the backend
// omni listing serves it. `buildModelsFromListing.ts` merges the API
// capability fields over these values at runtime.

import { GenerationProvider } from "@storyteller/api-enums";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";
import { ModelTag } from "../classes/metadata/ModelTag.js";
import { CommonAspectRatio } from "../classes/properties/CommonAspectRatio.js";
import { CommonResolution } from "../classes/properties/CommonResolution.js";
import { CommonQuality } from "../classes/properties/CommonQuality.js";

// All image model tauriIds, in picker (list) order.
export const KNOWN_IMAGE_TAURI_IDS: string[] = [
  "grok_imagine_image",
  "midjourney",
  "flux_pro_1p1_ultra",
  "flux_pro_1p1",
  "flux_1_dev",
  "flux_1_schnell",
  "nano_banana",
  "nano_banana_2",
  "nano_banana_pro",
  "gpt_image_1",
  "gpt_image_1p5",
  "gpt_image_2",
  "seedream_4",
  "seedream_4p5",
  "seedream_5_lite",
  "qwen_edit_2511_angles",
  "flux_2_lora_angles",
  "flux_pro_kontext_max",
  "flux_pro_1",
  "flux_dev_juggernaut",
];

// Models the backend omni listing does not know about; the loader appends
// these after the backend-driven entries.
export const FRONTEND_ONLY_IMAGE_TAURI_IDS: string[] = [
  "midjourney",
  "grok_imagine_image",
  "qwen_edit_2511_angles",
  "flux_2_lora_angles",
  "flux_pro_kontext_max",
  "flux_pro_1",
  "flux_dev_juggernaut",
];

// ── Identity ────────────────────────────────────────────────────────────────

// Frontend `id` where it historically diverged from `tauriId` (BY_ID lookups
// and generation history depend on these).
export const imageLegacyId = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {
    grok_imagine_image: "grok_image",
    flux_pro_1p1_ultra: "flux_pro_1_1_ultra",
    flux_pro_1p1: "flux_pro_1_1",
    flux_pro_1: "flux_pro_inpaint",
    flux_dev_juggernaut: "flux_dev_juggernaut_inpaint",
  };
  return values[tauriId];
};

export const imageCreator = (tauriId: string): ModelCreator | undefined => {
  const values: Record<string, ModelCreator> = {
    grok_imagine_image: ModelCreator.Grok,
    midjourney: ModelCreator.Midjourney,
    flux_pro_1p1_ultra: ModelCreator.BlackForestLabs,
    flux_pro_1p1: ModelCreator.BlackForestLabs,
    flux_1_dev: ModelCreator.BlackForestLabs,
    flux_1_schnell: ModelCreator.BlackForestLabs,
    nano_banana: ModelCreator.Google,
    nano_banana_2: ModelCreator.Google,
    nano_banana_pro: ModelCreator.Google,
    gpt_image_1: ModelCreator.OpenAi,
    gpt_image_1p5: ModelCreator.OpenAi,
    gpt_image_2: ModelCreator.OpenAi,
    seedream_4: ModelCreator.Bytedance,
    seedream_4p5: ModelCreator.Bytedance,
    seedream_5_lite: ModelCreator.Bytedance,
    qwen_edit_2511_angles: ModelCreator.Alibaba,
    flux_2_lora_angles: ModelCreator.BlackForestLabs,
    flux_pro_kontext_max: ModelCreator.BlackForestLabs,
    flux_pro_1: ModelCreator.BlackForestLabs,
    flux_dev_juggernaut: ModelCreator.BlackForestLabs,
  };
  return values[tauriId];
};

// ── Presentation ────────────────────────────────────────────────────────────

export const imageFullName = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {
    grok_imagine_image: "Grok",
    midjourney: "Midjourney",
    qwen_edit_2511_angles: "Qwen Edit 2511 Angles",
    flux_2_lora_angles: "Flux 2 LoRA Angles",
    flux_pro_kontext_max: "Flux Pro Kontext Max",
    flux_pro_1: "Flux Pro Inpaint",
    flux_dev_juggernaut: "Flux Dev Juggernaut Inpaint",
  };
  return values[tauriId];
};

// Only where the picker name differs from `fullName` (the caller falls back
// to `imageFullName`).
export const imageSelectorName = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {
    flux_pro_1: "Flux Pro (Inpainting)",
    flux_dev_juggernaut: "Flux Dev Juggernaut",
  };
  return values[tauriId];
};

export const imageSelectorDescription = (
  tauriId: string,
): string | undefined => {
  const values: Record<string, string> = {
    grok_imagine_image: "Fast af",
    midjourney: "Stunning style and quality",
    flux_pro_1p1_ultra: "Higher quality model",
    flux_pro_1p1: "High quality model",
    flux_1_dev: "Fast, but lower quality",
    flux_1_schnell: "Fastest image gen, but lowest quality",
    nano_banana: "Fast instructive editing",
    nano_banana_2: "Fast instructive editing",
    nano_banana_pro: "Powerful instructive editing",
    gpt_image_1: "Slow, but super smart",
    gpt_image_1p5: "Faster, improved",
    gpt_image_2: "Smart with great text support",
    seedream_4: "Fast",
    seedream_4p5: "Fast",
    seedream_5_lite: "Fast",
    qwen_edit_2511_angles: "Angle manipulation with optional prompt",
    flux_2_lora_angles: "Angle manipulation",
    flux_pro_kontext_max: "Fast instructive editing",
    flux_pro_1: "Fast inpainting",
    flux_dev_juggernaut: "Fast inpainting, low quality",
  };
  return values[tauriId];
};

export const imageSelectorBadges = (tauriId: string): string[] | undefined => {
  const values: Record<string, string[]> = {
    grok_imagine_image: ["10 sec."],
    midjourney: ["45 sec."],
    flux_pro_1p1_ultra: ["35 sec."],
    flux_pro_1p1: ["10 sec."],
    flux_1_dev: ["10 sec."],
    flux_1_schnell: ["10 sec."],
    nano_banana: ["25 sec."],
    nano_banana_2: ["25 sec."],
    nano_banana_pro: ["30 sec."],
    gpt_image_1: ["60 sec."],
    gpt_image_1p5: ["60 sec."],
    gpt_image_2: ["2 min."],
    seedream_4: ["60 sec."],
    seedream_4p5: ["60 sec."],
    seedream_5_lite: ["60 sec."],
    qwen_edit_2511_angles: ["30 sec."],
    flux_2_lora_angles: ["30 sec."],
    flux_pro_kontext_max: ["20 sec."],
    flux_pro_1: ["30 sec."],
    flux_dev_juggernaut: ["10 sec."],
  };
  return values[tauriId];
};

export const imageTags = (tauriId: string): ModelTag[] | undefined => {
  const values: Record<string, ModelTag[]> = {
    nano_banana: [ModelTag.InstructiveEdit],
    nano_banana_2: [ModelTag.InstructiveEdit],
    nano_banana_pro: [ModelTag.InstructiveEdit],
    gpt_image_1: [ModelTag.InstructiveEdit],
    gpt_image_1p5: [ModelTag.InstructiveEdit],
    gpt_image_2: [ModelTag.InstructiveEdit],
    seedream_4: [ModelTag.InstructiveEdit],
    seedream_4p5: [ModelTag.InstructiveEdit],
    seedream_5_lite: [ModelTag.InstructiveEdit],
    flux_pro_kontext_max: [ModelTag.InstructiveEdit],
  };
  return values[tauriId];
};

// Milliseconds; only where it differs from the `Model` default (20000).
export const imageProgressBarTime = (tauriId: string): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_image: 10000,
    midjourney: 45000,
    flux_pro_1p1_ultra: 35000,
    flux_pro_1p1: 10000,
    flux_1_dev: 10000,
    flux_1_schnell: 10000,
    nano_banana: 25000,
    nano_banana_2: 25000,
    nano_banana_pro: 25000,
    gpt_image_1: 60000,
    gpt_image_1p5: 60000,
    gpt_image_2: 120000,
    seedream_4: 60000,
    seedream_4p5: 60000,
    seedream_5_lite: 60000,
    qwen_edit_2511_angles: 30000,
    flux_2_lora_angles: 30000,
    flux_pro_1: 30000,
    flux_dev_juggernaut: 10000,
  };
  return values[tauriId];
};

// ── Desktop-native provider knowledge ───────────────────────────────────────

// Only models whose overlay entry explicitly set `providers:`; everything
// else falls back to `[GenerationProvider.Artcraft]` via `getProviders()`.
export const imageProviders = (
  tauriId: string,
): GenerationProvider[] | undefined => {
  const values: Record<string, GenerationProvider[]> = {
    grok_imagine_image: [GenerationProvider.Grok],
    midjourney: [GenerationProvider.Midjourney],
    flux_1_dev: [GenerationProvider.Artcraft, GenerationProvider.Fal],
    flux_1_schnell: [GenerationProvider.Artcraft, GenerationProvider.Fal],
    nano_banana_2: [GenerationProvider.Artcraft, GenerationProvider.Fal],
    nano_banana_pro: [GenerationProvider.Artcraft, GenerationProvider.Fal],
    gpt_image_1: [GenerationProvider.Artcraft, GenerationProvider.Sora],
  };
  return values[tauriId];
};

// ── Page-subsetting flags ───────────────────────────────────────────────────

// Only entries that explicitly opt OUT of text-to-image (default is true).
export const imageCanTextToImage = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    qwen_edit_2511_angles: false,
    flux_2_lora_angles: false,
    flux_pro_kontext_max: false,
    flux_pro_1: false,
    flux_dev_juggernaut: false,
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const imageCanEditImages = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    nano_banana: true,
    nano_banana_2: true,
    nano_banana_pro: true,
    gpt_image_1: true,
    gpt_image_1p5: true,
    gpt_image_2: true,
    seedream_4: true,
    seedream_4p5: true,
    seedream_5_lite: true,
    flux_pro_kontext_max: true,
    flux_pro_1: true,
    flux_dev_juggernaut: true,
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const imageUsesInpaintingMask = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    flux_pro_1: true,
    flux_dev_juggernaut: true,
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const imageEditingIsInpainting = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    flux_pro_1: true,
    flux_dev_juggernaut: true,
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const imageCanEditAngles = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    qwen_edit_2511_angles: true,
    flux_2_lora_angles: true,
  };
  return values[tauriId];
};

// Finite values only; only where it differs from the `Model` default (3000).
export const imageMaxPromptLength = (tauriId: string): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_image: 8000,
    // No practical prompt limit for these models.
    nano_banana: Infinity,
    nano_banana_2: Infinity,
    nano_banana_pro: Infinity,
    gpt_image_1: Infinity,
    gpt_image_1p5: Infinity,
    gpt_image_2: Infinity,
    midjourney: 6000,
    flux_pro_1p1_ultra: 4000,
    flux_pro_1p1: 4000,
    flux_1_dev: 4000,
    flux_1_schnell: 4000,
    seedream_4: 4000,
    seedream_4p5: 4000,
    seedream_5_lite: 4000,
    qwen_edit_2511_angles: 800,
    flux_2_lora_angles: 4000,
    flux_pro_kontext_max: 4000,
    flux_pro_1: 4000,
    flux_dev_juggernaut: 4000,
  };
  return values[tauriId];
};

// ── Capability fallbacks (the API may not provide these per-model) ──────────

// Only where it differs from the fallback (4).
export const imageMaxGenerationCount = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {
    // NB: Grok only supports 6 images at a time
    grok_imagine_image: 6,
    // NB: Fal only allows one image for some reason!
    flux_pro_1: 1,
  };
  return values[tauriId];
};

// Only where it differs from the fallback (1).
export const imageDefaultGenerationCount = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_image: 6,
    midjourney: 4,
    flux_pro_kontext_max: 4,
    flux_dev_juggernaut: 4,
  };
  return values[tauriId];
};

export const imagePredefinedGenerationCounts = (
  tauriId: string,
): number[] | undefined => {
  const values: Record<string, number[]> = {
    grok_imagine_image: [6],
    midjourney: [4],
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const imageCanUseImagePrompt = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    flux_pro_1p1_ultra: true,
    flux_pro_1p1: true,
    flux_1_dev: true,
    flux_1_schnell: true,
    qwen_edit_2511_angles: true,
    flux_2_lora_angles: true,
  };
  return values[tauriId];
};

// Only where it differs from the default (1).
export const imageMaxImagePromptCount = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_image: 6,
    midjourney: 6,
    flux_pro_1p1_ultra: 6,
    flux_pro_1p1: 6,
    flux_1_dev: 6,
    flux_1_schnell: 6,
    nano_banana: 6,
    nano_banana_2: 6,
    nano_banana_pro: 4,
    gpt_image_1: 6,
    gpt_image_1p5: 6,
    gpt_image_2: 6,
    seedream_4: 6,
    seedream_4p5: 6,
    seedream_5_lite: 6,
  };
  return values[tauriId];
};

export const imageAspectRatios = (
  tauriId: string,
): CommonAspectRatio[] | undefined => {
  const values: Record<string, CommonAspectRatio[]> = {
    grok_imagine_image: [
      CommonAspectRatio.Square,
      CommonAspectRatio.WideThreeByTwo,
      CommonAspectRatio.TallTwoByThree,
    ],
    qwen_edit_2511_angles: [
      CommonAspectRatio.Square,
      CommonAspectRatio.SquareHd,
      CommonAspectRatio.WideFourByThree,
      CommonAspectRatio.WideSixteenByNine,
      CommonAspectRatio.TallThreeByFour,
      CommonAspectRatio.TallNineBySixteen,
    ],
    flux_2_lora_angles: [
      CommonAspectRatio.Square,
      CommonAspectRatio.SquareHd,
      CommonAspectRatio.WideFourByThree,
      CommonAspectRatio.WideSixteenByNine,
      CommonAspectRatio.TallThreeByFour,
      CommonAspectRatio.TallNineBySixteen,
    ],
  };
  return values[tauriId];
};

export const imageDefaultAspectRatio = (
  tauriId: string,
): CommonAspectRatio | undefined => {
  const values: Record<string, CommonAspectRatio> = {
    grok_imagine_image: CommonAspectRatio.Square,
    qwen_edit_2511_angles: CommonAspectRatio.SquareHd,
    flux_2_lora_angles: CommonAspectRatio.SquareHd,
  };
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const imageResolutions = (
  tauriId: string,
): CommonResolution[] | undefined => {
  const values: Record<string, CommonResolution[]> = {};
  return values[tauriId];
};

// No overlay entry set an explicit default; `ImageModel` falls back to
// `resolutions[0]`.
export const imageDefaultResolution = (
  tauriId: string,
): CommonResolution | undefined => {
  const values: Record<string, CommonResolution> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const imageQualityOptions = (
  tauriId: string,
): CommonQuality[] | undefined => {
  const values: Record<string, CommonQuality[]> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const imageDefaultQuality = (
  tauriId: string,
): CommonQuality | undefined => {
  const values: Record<string, CommonQuality> = {};
  return values[tauriId];
};
