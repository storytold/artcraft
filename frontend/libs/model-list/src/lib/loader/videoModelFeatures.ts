// Frontend-only per-feature data for video models, keyed by `tauriId`.
//
// Each exported function is a sparse lookup: a model has an entry ONLY when
// its value differs from the class default (see `VideoModel` / `Model`), so
// every feature is individually inspectable and deletable once the backend
// omni listing serves it. `buildModelsFromListing.ts` merges the API
// capability fields over these values at runtime.

import { GenerationProvider } from "@storyteller/api-enums";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";
import { ModelTag } from "../classes/metadata/ModelTag.js";
import { SizeIconOption, SizeOption } from "../classes/metadata/SizeOption.js";

// All video model tauriIds, in picker (list) order.
export const KNOWN_VIDEO_TAURI_IDS: string[] = [
  "grok_imagine_video",
  "grok_imagine_video_1p5",
  "kling_1p6_pro",
  "kling_2p1_pro",
  "kling_2p1_master",
  "kling_2p5_turbo_pro",
  "kling_2p6_pro",
  "kling_3p0_standard",
  "kling_3p0_pro",
  "happy_horse_1p0",
  "seedance_1p0_lite",
  "seedance_1p5_pro",
  "seedance_2p0",
  "seedance_2p0_fast",
  "sora_2",
  "sora_2_pro",
  "veo_2",
  "veo_3",
  "veo_3_fast",
  "veo_3p1",
  "veo_3p1_fast",
  "switch_x",
];

// Models the backend omni listing does not know about; the loader appends
// these after the backend-driven entries.
export const FRONTEND_ONLY_VIDEO_TAURI_IDS: string[] = ["switch_x"];

// ── Identity ────────────────────────────────────────────────────────────────

// Frontend `id` where it historically diverged from `tauriId` (BY_ID lookups
// and generation history depend on these).
export const videoLegacyId = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {
    grok_imagine_video: "grok_video",
    kling_1p6_pro: "kling_1_6_pro",
    kling_2p1_pro: "kling_2_1_pro",
    kling_2p1_master: "kling_2_1_master",
    seedance_1p0_lite: "seedance_1_0_lite",
  };
  return values[tauriId];
};

export const videoCreator = (tauriId: string): ModelCreator | undefined => {
  const values: Record<string, ModelCreator> = {
    grok_imagine_video: ModelCreator.Grok,
    grok_imagine_video_1p5: ModelCreator.Grok,
    kling_1p6_pro: ModelCreator.Kling,
    kling_2p1_pro: ModelCreator.Kling,
    kling_2p1_master: ModelCreator.Kling,
    kling_2p5_turbo_pro: ModelCreator.Kling,
    kling_2p6_pro: ModelCreator.Kling,
    kling_3p0_standard: ModelCreator.Kling,
    kling_3p0_pro: ModelCreator.Kling,
    happy_horse_1p0: ModelCreator.Alibaba,
    seedance_1p0_lite: ModelCreator.Bytedance,
    seedance_1p5_pro: ModelCreator.Bytedance,
    seedance_2p0: ModelCreator.Bytedance,
    seedance_2p0_fast: ModelCreator.Bytedance,
    sora_2: ModelCreator.OpenAi,
    sora_2_pro: ModelCreator.OpenAi,
    veo_2: ModelCreator.Google,
    veo_3: ModelCreator.Google,
    veo_3_fast: ModelCreator.Google,
    veo_3p1: ModelCreator.Google,
    veo_3p1_fast: ModelCreator.Google,
    switch_x: ModelCreator.Beeble,
  };
  return values[tauriId];
};

// ── Presentation ────────────────────────────────────────────────────────────

export const videoFullName = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {
    kling_2p1_pro: "Kling 2.1 Pro",
    kling_2p1_master: "Kling 2.1 Master",
    kling_3p0_standard: "Kling 3.0 Standard",
    kling_3p0_pro: "Kling 3.0 Pro",
    seedance_1p0_lite: "Seedance 1.0 Lite",
    sora_2: "Sora 2",
    sora_2_pro: "Sora 2 Pro",
    veo_2: "Google Veo 2",
    veo_3: "Google Veo 3",
    veo_3p1: "Google Veo 3.1",
    veo_3p1_fast: "Google Veo 3.1 Fast",
    switch_x: "Beeble SwitchX",
  };
  return values[tauriId];
};

// Only where the picker name differs from `fullName` (the caller falls back
// to `videoFullName`). Currently every video model uses its full name.
export const videoSelectorName = (tauriId: string): string | undefined => {
  const values: Record<string, string> = {};
  return values[tauriId];
};

export const videoSelectorDescription = (
  tauriId: string,
): string | undefined => {
  const values: Record<string, string> = {
    grok_imagine_video: "Fastest video model",
    kling_1p6_pro: "Fast video model",
    kling_2p1_pro: "Fast video model",
    kling_2p1_master: "Fast video model",
    kling_2p5_turbo_pro: "Fast video model",
    kling_2p6_pro: "Fast video model",
    kling_3p0_standard: "Standard quality video model",
    kling_3p0_pro: "High quality video model",
    happy_horse_1p0: "High quality video model",
    seedance_1p0_lite: "Fast video model",
    seedance_1p5_pro: "High quality video model",
    sora_2: "Smart video model",
    sora_2_pro: "Smart video model",
    veo_2: "Fast video model",
    veo_3: "Slow, high-quality model",
    veo_3_fast: "High-quality model (faster)",
    veo_3p1: "Slow, high-quality model",
    veo_3p1_fast: "High-quality model (faster)",
    switch_x: "Relight, change location, swap objects.",
  };
  return values[tauriId];
};

export const videoSelectorBadges = (tauriId: string): string[] | undefined => {
  const values: Record<string, string[]> = {
    grok_imagine_video: ["20 sec."],
    grok_imagine_video_1p5: ["Preview"],
    kling_1p6_pro: ["2 min."],
    kling_2p1_pro: ["2 min."],
    kling_2p1_master: ["2 min."],
    kling_2p5_turbo_pro: ["2 min."],
    kling_2p6_pro: ["2 min."],
    kling_3p0_standard: ["2 min."],
    kling_3p0_pro: ["2 min."],
    happy_horse_1p0: ["2 min."],
    seedance_1p0_lite: ["2 min."],
    seedance_1p5_pro: ["2 min."],
    seedance_2p0: ["~15 min."],
    seedance_2p0_fast: ["~5 min."],
    sora_2: ["2 min."],
    sora_2_pro: ["2 min."],
    veo_2: ["2 min."],
    veo_3: ["2 min."],
    veo_3_fast: ["2 min."],
    veo_3p1: ["2 min."],
    veo_3p1_fast: ["2 min."],
    switch_x: ["5 min."],
  };
  return values[tauriId];
};

// Currently no video model declares tags.
export const videoTags = (tauriId: string): ModelTag[] | undefined => {
  const values: Record<string, ModelTag[]> = {};
  return values[tauriId];
};

// Milliseconds; only where it differs from the `Model` default (20000).
export const videoProgressBarTime = (tauriId: string): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_video: 50000,
    grok_imagine_video_1p5: 50000,
    kling_1p6_pro: 300000,
    kling_2p1_pro: 300000,
    kling_2p1_master: 300000,
    kling_2p5_turbo_pro: 300000,
    kling_2p6_pro: 300000,
    kling_3p0_standard: 300000,
    kling_3p0_pro: 300000,
    happy_horse_1p0: 300000,
    seedance_1p0_lite: 100000,
    seedance_1p5_pro: 180000,
    seedance_2p0: 900000, // ~15 minutes
    seedance_2p0_fast: 300000, // ~5 minutes
    sora_2: 100000,
    sora_2_pro: 100000,
    veo_2: 100000,
    veo_3: 100000,
    veo_3_fast: 100000,
    veo_3p1: 100000,
    veo_3p1_fast: 100000,
    switch_x: 5 * 60 * 1000,
  };
  return values[tauriId];
};

// ── Desktop-native provider knowledge ───────────────────────────────────────

// Only models whose overlay entry explicitly set `providers:`; everything
// else falls back to `[GenerationProvider.Artcraft]` via `getProviders()`.
export const videoProviders = (
  tauriId: string,
): GenerationProvider[] | undefined => {
  const values: Record<string, GenerationProvider[]> = {
    grok_imagine_video: [GenerationProvider.Grok],
    // Served via Artcraft (storyteller-web / artcraft_router) for now, even
    // though the model is made by xAI. See generate_video_command.rs.
    grok_imagine_video_1p5: [GenerationProvider.Artcraft],
    sora_2: [GenerationProvider.Artcraft, GenerationProvider.Sora],
  };
  return values[tauriId];
};

// ── Prompting ───────────────────────────────────────────────────────────────

// Finite values only; only where it differs from the `Model` default (3000).
export const videoMaxPromptLength = (tauriId: string): number | undefined => {
  const values: Record<string, number> = {
    grok_imagine_video: 4096,
    // No practical prompt limit for these models.
    seedance_2p0: Infinity,
    seedance_2p0_fast: Infinity,
    kling_1p6_pro: 2500,
    kling_2p1_pro: 2500,
    kling_2p1_master: 2500,
    kling_2p5_turbo_pro: 2500,
    kling_2p6_pro: 2500,
    kling_3p0_standard: 2500,
    kling_3p0_pro: 2500,
    happy_horse_1p0: 2500,
    sora_2: 2000,
    sora_2_pro: 2000,
    veo_2: 5000,
    veo_3: 5000,
    veo_3_fast: 5000,
    veo_3p1: 5000,
    veo_3p1_fast: 5000,
    switch_x: 2000,
  };
  return values[tauriId];
};

// Only entries that explicitly opt OUT (default is true).
export const videoSupportsSystemPrompt = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    seedance_1p5_pro: false,
    seedance_2p0: false,
    seedance_2p0_fast: false,
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const videoGenerateWithSound = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    kling_3p0_standard: true,
    kling_3p0_pro: true,
    happy_horse_1p0: true,
    veo_3: true,
    veo_3p1: true,
    veo_3p1_fast: true,
  };
  return values[tauriId];
};

// Only entries that explicitly opt OUT of text-to-video (default is true).
// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoTextToVideoSupported = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {};
  return values[tauriId];
};

// ── Keyframes / input images ────────────────────────────────────────────────

// Only `true` entries.
export const videoStartFrame = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    kling_2p1_pro: true,
    kling_2p1_master: true,
    kling_3p0_standard: true,
    kling_3p0_pro: true,
    seedance_1p0_lite: true,
    veo_2: true,
    veo_3: true,
    veo_3p1: true,
    veo_3p1_fast: true,
  };
  return values[tauriId];
};

// Only `true` entries.
export const videoEndFrame = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    kling_2p1_pro: true,
    kling_3p0_standard: true,
    kling_3p0_pro: true,
  };
  return values[tauriId];
};

// Only `true` entries.
export const videoRequiresImage = (tauriId: string): boolean | undefined => {
  const values: Record<string, boolean> = {
    grok_imagine_video: true,
    grok_imagine_video_1p5: true,
    kling_1p6_pro: true,
    kling_2p1_pro: true,
    kling_2p1_master: true,
    kling_2p6_pro: true,
    seedance_1p0_lite: true,
    veo_2: true,
    veo_3: true,
    veo_3_fast: true,
    veo_3p1: true,
    veo_3p1_fast: true,
    switch_x: true,
  };
  return values[tauriId];
};

// ── Size / aspect ratio ─────────────────────────────────────────────────────

export const videoSizeOptions = (
  tauriId: string,
): SizeOption[] | undefined => {
  const values: Record<string, SizeOption[]> = {
    kling_3p0_standard: [
      {
        tauriValue: "wide_sixteen_by_nine",
        textLabel: "16:9",
        icon: SizeIconOption.Landscape16x9,
      },
      {
        tauriValue: "square",
        textLabel: "1:1",
        icon: SizeIconOption.Square,
      },
      {
        tauriValue: "tall_nine_by_sixteen",
        textLabel: "9:16",
        icon: SizeIconOption.Portrait9x16,
      },
    ],
    kling_3p0_pro: [
      {
        tauriValue: "wide_sixteen_by_nine",
        textLabel: "16:9",
        icon: SizeIconOption.Landscape16x9,
      },
      {
        tauriValue: "square",
        textLabel: "1:1",
        icon: SizeIconOption.Square,
      },
      {
        tauriValue: "tall_nine_by_sixteen",
        textLabel: "9:16",
        icon: SizeIconOption.Portrait9x16,
      },
    ],
    sora_2: [
      {
        tauriValue: "landscape",
        textLabel: "Landscape",
        icon: SizeIconOption.Landscape,
      },
      {
        tauriValue: "portrait",
        textLabel: "Portrait",
        icon: SizeIconOption.Portrait,
      },
    ],
    sora_2_pro: [
      {
        tauriValue: "landscape",
        textLabel: "Landscape",
        icon: SizeIconOption.Landscape,
      },
      {
        tauriValue: "portrait",
        textLabel: "Portrait",
        icon: SizeIconOption.Portrait,
      },
    ],
  };
  return values[tauriId];
};

// Only `true` entries (default is false).
export const videoSupportsCommonAspectRatio = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {
    kling_3p0_standard: true,
    kling_3p0_pro: true,
  };
  return values[tauriId];
};

// ── Duration / resolution ───────────────────────────────────────────────────

export const videoDurationOptions = (
  tauriId: string,
): number[] | undefined => {
  const values: Record<string, number[]> = {
    kling_3p0_standard: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    kling_3p0_pro: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    happy_horse_1p0: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    seedance_1p5_pro: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    seedance_2p0: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    seedance_2p0_fast: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  };
  return values[tauriId];
};

export const videoDefaultDuration = (tauriId: string): number | undefined => {
  const values: Record<string, number> = {
    kling_3p0_standard: 5,
    kling_3p0_pro: 5,
  };
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoResolutionOptions = (
  tauriId: string,
): string[] | undefined => {
  const values: Record<string, string[]> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoDefaultResolution = (
  tauriId: string,
): string | undefined => {
  const values: Record<string, string> = {};
  return values[tauriId];
};

// ── Reference mode ──────────────────────────────────────────────────────────

// Only `true` entries.
// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoSupportsReferenceMode = (
  tauriId: string,
): boolean | undefined => {
  const values: Record<string, boolean> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoMaxReferenceImages = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoMaxReferenceVideos = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoMaxVideoRefDuration = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoMaxReferenceAudios = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {};
  return values[tauriId];
};

// Fully served by the omni API — delete this function once static fallbacks
// are no longer needed.
export const videoMaxAudioRefDuration = (
  tauriId: string,
): number | undefined => {
  const values: Record<string, number> = {};
  return values[tauriId];
};
