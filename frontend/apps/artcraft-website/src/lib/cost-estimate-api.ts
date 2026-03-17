import { useEffect, useRef, useState } from "react";
import { StorytellerApiHostStore } from "@storyteller/api";

// ── Model ID → API enum value mapping ────────────────────────────────────

const IMAGE_MODEL_MAP: Record<string, string> = {
  flux_1_dev: "flux_1_dev",
  flux_1_schnell: "flux_1_schnell",
  flux_pro_11: "flux_pro_1p1",
  flux_pro_11_ultra: "flux_pro_1p1_ultra",
  gpt_image_1p5: "gpt_image_1p5",
  nano_banana: "nano_banana",
  nano_banana_2: "nano_banana_2",
  nano_banana_pro: "nano_banana_pro",
  seedream_4: "seedream_4",
  seedream_4p5: "seedream_4p5",
  seedream_5_lite: "seedream_5_lite",
};

const VIDEO_MODEL_MAP: Record<string, string> = {
  kling_2p5_turbo_pro: "kling_2p5_turbo_pro",
  kling_2p6_pro: "kling_2p6_pro",
  kling_3p0_standard: "kling_3p0_standard",
  kling_3p0_pro: "kling_3p0_pro",
  seedance_1p5_pro: "seedance_1p5_pro",
  seedance_2p0: "seedance_2p0",
  sora_2: "sora_2",
  sora_2_pro: "sora_2_pro",
  veo_3p1: "veo_3p1",
  veo_3p1_fast: "veo_3p1_fast",
};

// ── Resolution mapping ───────────────────────────────────────────────────

const RESOLUTION_MAP: Record<string, string> = {
  one_k: "one_k",
  "1k": "one_k",
  two_k: "two_k",
  "2k": "two_k",
  four_k: "four_k",
  "4k": "four_k",
};

// ── API call helpers ─────────────────────────────────────────────────────

interface CostEstimateResponse {
  success: boolean;
  cost_in_credits?: number;
  is_free?: boolean;
}

async function postCostEstimate(
  path: string,
  body: Record<string, unknown>,
): Promise<number | null> {
  try {
    const baseUrl = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const data: CostEstimateResponse = await response.json();
    if (data.success && data.cost_in_credits != null) {
      return data.cost_in_credits;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Image cost estimate hook ─────────────────────────────────────────────

export interface ImageCostParams {
  modelTauriId: string;
  aspectRatio?: string;
  resolution?: string;
  numImages: number;
  hasReferenceImages: boolean;
}

export function useImageCostEstimate(params: ImageCostParams): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    const model = IMAGE_MODEL_MAP[params.modelTauriId];
    if (!model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    const body: Record<string, unknown> = {
      model,
      provider: "artcraft",
      generation_mode: params.hasReferenceImages
        ? { type: "image_edit", count: 1 }
        : { type: "text_to_image" },
    };

    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    const mappedResolution = params.resolution
      ? RESOLUTION_MAP[params.resolution]
      : undefined;
    if (mappedResolution) body.resolution = mappedResolution;

    postCostEstimate("/v1/generate/cost_estimate/image", body).then(
      (perImage) => {
        if (id !== abortRef.current) return;
        setCredits(perImage != null ? perImage * params.numImages : null);
      },
    );
  }, [
    params.modelTauriId,
    params.aspectRatio,
    params.resolution,
    params.numImages,
    params.hasReferenceImages,
  ]);

  return credits;
}

// ── Video cost estimate hook ─────────────────────────────────────────────

export interface VideoCostParams {
  modelTauriId: string;
  aspectRatio?: string;
  resolution?: string | null;
  duration?: number | null;
  hasStartFrame: boolean;
  hasEndFrame: boolean;
  isReferenceMode: boolean;
  referenceImageCount: number;
  generateAudio?: boolean;
}

export function useVideoCostEstimate(params: VideoCostParams): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    const model = VIDEO_MODEL_MAP[params.modelTauriId];
    if (!model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    // Determine generation mode
    let generationMode: Record<string, unknown>;
    if (params.isReferenceMode && params.referenceImageCount > 0) {
      generationMode = {
        type: "reference_image_to_video",
        count: params.referenceImageCount,
      };
    } else if (params.hasStartFrame && params.hasEndFrame) {
      generationMode = { type: "start_and_end_frame_to_video" };
    } else if (params.hasStartFrame) {
      generationMode = { type: "start_frame_to_video" };
    } else {
      generationMode = { type: "text_to_video" };
    }

    const body: Record<string, unknown> = {
      model,
      provider: "artcraft",
      generation_mode: generationMode,
    };

    if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
    if (params.duration) body.duration_seconds = params.duration;
    if (params.generateAudio != null) body.generate_audio = params.generateAudio;
    const mappedResolution = params.resolution
      ? RESOLUTION_MAP[params.resolution]
      : undefined;
    if (mappedResolution) body.resolution = mappedResolution;

    postCostEstimate("/v1/generate/cost_estimate/video", body).then(
      (cost) => {
        if (id !== abortRef.current) return;
        setCredits(cost);
      },
    );
  }, [
    params.modelTauriId,
    params.aspectRatio,
    params.resolution,
    params.duration,
    params.hasStartFrame,
    params.hasEndFrame,
    params.isReferenceMode,
    params.referenceImageCount,
    params.generateAudio,
  ]);

  return credits;
}
