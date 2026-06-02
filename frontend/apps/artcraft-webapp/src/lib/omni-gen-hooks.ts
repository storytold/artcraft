import { useEffect, useState } from "react";
import { OmniGenApi } from "@storyteller/api";
import type {
  OmniGenImageModelInfo,
  OmniGenVideoModelInfo,
} from "@storyteller/api";

// ── Singleton caches (fetch once per session) ────────────────────────────

let imageModelsCache: OmniGenImageModelInfo[] | null = null;
let imageModelsFetching = false;
let imageModelsError: string | null = null;
let imageModelsListeners: Array<() => void> = [];

let videoModelsCache: OmniGenVideoModelInfo[] | null = null;
let videoModelsFetching = false;
let videoModelsError: string | null = null;
let videoModelsListeners: Array<() => void> = [];

function notifyImageListeners() {
  imageModelsListeners.forEach((cb) => cb());
  imageModelsListeners = [];
}

function notifyVideoListeners() {
  videoModelsListeners.forEach((cb) => cb());
  videoModelsListeners = [];
}

function fetchImageModelsOnce() {
  if (imageModelsCache || imageModelsFetching) return;
  imageModelsFetching = true;
  imageModelsError = null;
  const api = new OmniGenApi();
  api.getImageModels().then(
    (res) => {
      imageModelsFetching = false;
      if (res.success && res.models?.length) {
        imageModelsCache = res.models.filter((m) => m.is_disabled !== true);
      } else {
        imageModelsError = "No image models returned from API";
        console.warn("[OmniGen] Image models response:", res);
      }
      notifyImageListeners();
    },
    (err) => {
      imageModelsFetching = false;
      imageModelsError = err?.message ?? "Failed to fetch image models";
      console.error("[OmniGen] Failed to fetch image models:", err);
      notifyImageListeners();
    },
  );
}

function fetchVideoModelsOnce() {
  if (videoModelsCache || videoModelsFetching) return;
  videoModelsFetching = true;
  videoModelsError = null;
  const api = new OmniGenApi();
  api.getVideoModels().then(
    (res) => {
      videoModelsFetching = false;
      if (res.success && res.models?.length) {
        videoModelsCache = res.models.filter((m) => m.is_disabled !== true);
      } else {
        videoModelsError = "No video models returned from API";
        console.warn("[OmniGen] Video models response:", res);
      }
      notifyVideoListeners();
    },
    (err) => {
      videoModelsFetching = false;
      videoModelsError = err?.message ?? "Failed to fetch video models";
      console.error("[OmniGen] Failed to fetch video models:", err);
      notifyVideoListeners();
    },
  );
}

// ── Hooks ────────────────────────────────────────────────────────────────

export function useOmniGenImageModels(): {
  models: OmniGenImageModelInfo[];
  isLoading: boolean;
  error: string | null;
} {
  const [models, setModels] = useState<OmniGenImageModelInfo[]>(
    imageModelsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!imageModelsCache);
  const [error, setError] = useState<string | null>(imageModelsError);

  useEffect(() => {
    if (imageModelsCache) {
      setModels(imageModelsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    const onReady = () => {
      setIsLoading(false);
      if (imageModelsCache) {
        setModels(imageModelsCache);
        setError(null);
      } else {
        setError(imageModelsError);
      }
    };

    imageModelsListeners.push(onReady);
    fetchImageModelsOnce();

    return () => {
      imageModelsListeners = imageModelsListeners.filter(
        (cb) => cb !== onReady,
      );
    };
  }, []);

  return { models, isLoading, error };
}

export function useOmniGenVideoModels(): {
  models: OmniGenVideoModelInfo[];
  isLoading: boolean;
  error: string | null;
} {
  const [models, setModels] = useState<OmniGenVideoModelInfo[]>(
    videoModelsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!videoModelsCache);
  const [error, setError] = useState<string | null>(videoModelsError);

  useEffect(() => {
    if (videoModelsCache) {
      setModels(videoModelsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    const onReady = () => {
      setIsLoading(false);
      if (videoModelsCache) {
        setModels(videoModelsCache);
        setError(null);
      } else {
        setError(videoModelsError);
      }
    };

    videoModelsListeners.push(onReady);
    fetchVideoModelsOnce();

    return () => {
      videoModelsListeners = videoModelsListeners.filter(
        (cb) => cb !== onReady,
      );
    };
  }, []);

  return { models, isLoading, error };
}

// ── Display name helper ──────────────────────────────────────────────────

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Image models
  flux_1_dev: "Flux 1 Dev",
  flux_1_schnell: "Flux 1 Schnell",
  flux_pro_1p1: "Flux Pro 1.1",
  flux_pro_1p1_ultra: "Flux Pro 1.1 Ultra",
  gpt_image_1p5: "GPT Image 1.5",
  gpt_image_2: "GPT Image 2",
  midjourney_7: "Midjourney v7",
  midjourney_7_niji: "Midjourney v7 Niji (Anime)",
  midjourney_8: "Midjourney v8",
  nano_banana: "Nano Banana",
  nano_banana_2: "Nano Banana 2",
  nano_banana_pro: "Nano Banana Pro",
  seedream_4: "Seedream 4",
  seedream_4p5: "Seedream 4.5",
  seedream_5_lite: "Seedream 5 Lite",
  // Video models
  grok_video: "Grok Video",
  grok_imagine_video: "Grok Imagine",
  grok_imagine_video_1p5: "Grok Imagine 1.5",
  kling_1p6_pro: "Kling 1.6 Pro",
  kling_2p1_pro: "Kling 2.1 Pro",
  kling_2p1_master: "Kling 2.1 Master",
  kling_2p5_turbo_pro: "Kling 2.5 Turbo Pro",
  kling_2p6_pro: "Kling 2.6 Pro",
  kling_3p0_standard: "Kling 3.0 Standard",
  kling_3p0_pro: "Kling 3.0 Pro",
  seedance_1p0_lite: "Seedance 1.0 Lite",
  seedance_1p5_pro: "Seedance 1.5 Pro",
  seedance_2p0: "Seedance 2.0",
  seedance_2p0_fast: "Seedance 2.0 Fast",
  seedance_2p0_bp: "Seedance 2.0 Plus",
  seedance_2p0_bp_fast: "Seedance 2.0 Plus Fast",
  happy_horse_1p0: "Happy Horse 1.0",
  sora_2: "Sora 2",
  sora_2_pro: "Sora 2 Pro",
  veo_2: "Google Veo 2",
  veo_3: "Google Veo 3",
  veo_3_fast: "Google Veo 3 Fast",
  veo_3p1: "Google Veo 3.1",
  veo_3p1_fast: "Google Veo 3.1 Fast",
  // Edit / VFX models
  switch_x: "SwitchX",
};

export function getModelDisplayName(
  modelId: string,
  fullName?: string | null,
): string {
  if (fullName) return fullName;
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}

// ── Description / info helpers ─────────────────────────────────────────────

// Manual fallbacks so we can show a tagline (and a longer info blurb) even when
// the API doesn't return one yet for a given model. The API value always wins.
const MODEL_DESCRIPTIONS: Record<string, string> = {
  // ── Image models ──
  flux_1_dev: "Open-weight model with rich detail",
  flux_1_schnell: "Fastest FLUX for quick drafts",
  flux_pro_1p1: "Pro-grade quality and prompt accuracy",
  flux_pro_1p1_ultra: "Ultra high-resolution FLUX output",
  gpt_image_1: "OpenAI's original image model",
  gpt_image_1p5: "OpenAI imagery with reliable text",
  gpt_image_2: "4K images with crisp text rendering",
  midjourney_7: "Signature artistic, stylized imagery",
  midjourney_7_niji: "Anime and illustration styles",
  midjourney_8: "Midjourney's latest flagship model",
  nano_banana: "Fast, versatile editing and generation",
  nano_banana_2: "Pro quality at Flash speed",
  nano_banana_pro: "Google's flagship image model",
  seedream_4: "High-fidelity photorealistic generation",
  seedream_4p5: "ByteDance's next-gen 4K model",
  seedream_5_lite: "Lightweight, fast visual reasoning",
  // ── Video models ── (seedance_2p0 intentionally omitted)
  grok_video: "Stylized video generation by xAI",
  grok_imagine_video: "Versatile video styles by xAI",
  grok_imagine_video_1p5: "Image-to-video styles by xAI",
  kling_1p6_pro: "Smooth, coherent motion",
  kling_2p1_pro: "Sharper realism and detail",
  kling_2p1_master: "Top-fidelity cinematic motion",
  kling_2p5_turbo_pro: "Fast, high-quality generation",
  kling_2p6_pro: "Refined motion and prompt control",
  kling_3p0_standard: "Next-gen temporal consistency",
  kling_3p0_pro: "Kling's flagship cinematic video",
  seedance_1p0_lite: "Fast, lightweight video clips",
  seedance_1p5_pro: "Keyframes with synced audio",
  happy_horse_1p0: "Expressive motion from a frame",
  sora_2: "Realistic video with synced audio",
  sora_2_pro: "Sora's highest-fidelity tier",
  veo_2: "Coherent, high-quality motion",
  veo_3: "Realistic video with native audio",
  veo_3_fast: "Faster Veo 3 with audio",
  veo_3p1: "Latest Veo with finer control",
  veo_3p1_fast: "Speed-tuned Veo 3.1",
  // ── Edit / VFX ──
  switch_x: "Swap or relight backgrounds",
};

const MODEL_INFOS: Record<string, string> = {
  // Longer blurbs surfaced behind the (i) info icon. Optional per model.
  // nano_banana_pro:
  //   "Google's flagship image model. Generates up to 4K, supports image references for editing, and batches up to 4 images at once.",
  // gpt_image_2:
  //   "OpenAI's image model with industry-leading text rendering. Emulated resolutions up to 4K and quality presets (High / Medium / Low).",
};

/** Short tagline shown under the model name.
 *
 *  Precedence: the API value always wins; the manual map is only a fallback for
 *  when the API hasn't returned a value (field absent / null / empty). Exactly
 *  one source is ever used — never both. Because this is derived from the model
 *  object (which only exists after the single atomic models fetch resolves), a
 *  row never renders with the manual value and then swaps to the API one — so
 *  there's no flicker, including before the API has returned. */
export function getModelDescription(
  modelId: string,
  apiDescription?: string | null,
): string {
  if (apiDescription) return apiDescription;
  return MODEL_DESCRIPTIONS[modelId] ?? "";
}

/** Longer info blurb for the (i) icon. Same precedence/no-flicker contract as
 *  getModelDescription: API value wins, manual map is the fallback, only one is
 *  ever used. Empty string means "no info icon for this model". */
export function getModelInfo(modelId: string, apiInfo?: string | null): string {
  if (apiInfo) return apiInfo;
  return MODEL_INFOS[modelId] ?? "";
}

// ── Creator icon helper ──────────────────────────────────────────────────

const MODEL_CREATOR_ICON_MAP: Record<string, string> = {
  flux: "blackforestlabs",
  nano_banana: "google",
  gpt_image: "openai",
  midjourney: "midjourney",
  seedream: "bytedance",
  seedance: "bytedance",
  kling: "kling",
  sora: "openai",
  veo: "google",
  grok: "grok",
  happy_horse: "alibaba",
  // Beeble SwitchX (background change) has no provider icon — use the ArtCraft
  // mark since it's surfaced as an ArtCraft feature.
  switch_x: "artcraft",
};

const ICON_FILES: Record<string, string> = {
  blackforestlabs: "blackforestlabs.svg",
  artcraft: "artcraft.svg",
  openai: "openai.svg",
  midjourney: "midjourney.svg",
  bytedance: "bytedance.svg",
  kling: "kling.svg",
  google: "google.svg",
  grok: "grok.svg",
  alibaba: "alibaba.svg",
};

export function getModelCreatorIconPath(modelId: string): string {
  const basePath = "/images/services";
  for (const [prefix, creator] of Object.entries(MODEL_CREATOR_ICON_MAP)) {
    if (modelId.startsWith(prefix)) {
      const file = ICON_FILES[creator] ?? "generic.svg";
      return `${basePath}/${file}`;
    }
  }
  return `${basePath}/generic.svg`;
}
