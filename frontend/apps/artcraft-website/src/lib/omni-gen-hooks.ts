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
        imageModelsCache = res.models;
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
        videoModelsCache = res.models;
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
      imageModelsListeners = imageModelsListeners.filter((cb) => cb !== onReady);
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
      videoModelsListeners = videoModelsListeners.filter((cb) => cb !== onReady);
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
  nano_banana: "Nano Banana",
  nano_banana_2: "Nano Banana 2",
  nano_banana_pro: "Nano Banana Pro",
  seedream_4: "Seedream 4",
  seedream_4p5: "Seedream 4.5",
  seedream_5_lite: "Seedream 5 Lite",
  // Video models
  grok_video: "Grok Video",
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
  sora_2: "Sora 2",
  sora_2_pro: "Sora 2 Pro",
  veo_2: "Google Veo 2",
  veo_3: "Google Veo 3",
  veo_3_fast: "Google Veo 3 Fast",
  veo_3p1: "Google Veo 3.1",
  veo_3p1_fast: "Google Veo 3.1 Fast",
};

export function getModelDisplayName(modelId: string, fullName?: string | null): string {
  if (fullName) return fullName;
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}

// ── Creator icon helper ──────────────────────────────────────────────────

const MODEL_CREATOR_ICON_MAP: Record<string, string> = {
  flux: "blackforestlabs",
  nano_banana: "google",
  gpt_image: "openai",
  seedream: "bytedance",
  seedance: "bytedance",
  kling: "kling",
  sora: "openai",
  veo: "google",
  grok: "grok",
};

const ICON_FILES: Record<string, string> = {
  blackforestlabs: "blackforestlabs.svg",
  artcraft: "artcraft.svg",
  openai: "openai.svg",
  bytedance: "bytedance.svg",
  kling: "kling.svg",
  google: "google.svg",
  grok: "grok.svg",
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
