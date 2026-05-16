import { useEffect, useRef, useState } from "react";
import { OmniGenApi } from "@storyteller/api";
import type { OmniGenImageRequest, OmniGenVideoRequest } from "@storyteller/api";
import {
  ModelPage,
  useSelectedImageModel,
} from "@storyteller/ui-model-selector";
import { usePrompt3DStore } from "@storyteller/ui-promptbox";
import { useCostBreakdownModalStore } from "@storyteller/ui-pricing-modal";

// ── Image cost estimate hook ─────────────────────────────────────────────

export interface ImageCostParams {
  model: string;
  aspectRatio?: string;
  resolution?: string;
  quality?: string;
  numImages: number;
  hasReferenceImages: boolean;
  imageMediaTokenCount?: number;
}

export function useImageCostEstimate(params: ImageCostParams): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!params.model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    const body: OmniGenImageRequest = {
      model: params.model,
      aspect_ratio: params.aspectRatio ?? null,
      resolution: params.resolution ?? null,
      quality: params.quality ?? null,
      image_batch_count: params.numImages,
      image_media_tokens: params.hasReferenceImages
        ? new Array(params.imageMediaTokenCount ?? 1).fill("placeholder")
        : null,
    };

    const api = new OmniGenApi();
    api.estimateImageCost(body).then(
      (response) => {
        if (id !== abortRef.current) return;
        if (response.success && response.cost_in_credits != null) {
          setCredits(response.cost_in_credits);
        } else {
          setCredits(null);
        }
      },
      () => {
        if (id !== abortRef.current) return;
        setCredits(null);
      },
    );
  }, [
    params.model,
    params.aspectRatio,
    params.resolution,
    params.numImages,
    params.hasReferenceImages,
    params.imageMediaTokenCount,
  ]);

  return credits;
}

// ── Stage 3D cost estimate hook ──────────────────────────────────────────

// PromptBox3D's resolution picker stores the UI shorthand ("1k" / "2k" /
// "4k"), but the OmniGen cost endpoint deserializes a CommonResolution enum
// whose variants are "one_k" / "two_k" / "four_k". Map before sending so
// the backend doesn't reject the body with "unknown variant `1k`".
const PROMPT_3D_RESOLUTION_TO_OMNI_GEN: Record<string, string> = {
  "1k": "one_k",
  "2k": "two_k",
  "4k": "four_k",
};

// Stage3DBody pulls credits from useCostBreakdownModalStore keyed by
// ModelPage.Stage3D and passes them down to PromptBox3D's GenerateButton.
// On Tauri this store is fed by lib-internal `useImageCostEstimate` (which
// calls a Tauri invoke). The webapp has no Tauri runtime, so this hook
// fills the same slot via the OmniGen HTTP cost endpoint.
export function useStage3DCostEstimate(): void {
  const selectedModel = useSelectedImageModel(ModelPage.Stage3D);
  const resolution = usePrompt3DStore((s) => s.resolution);
  const referenceImageCount = usePrompt3DStore((s) => s.referenceImages.length);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  const credits = useImageCostEstimate({
    model: selectedModel?.id ?? "",
    resolution: selectedModel?.canChangeResolution
      ? PROMPT_3D_RESOLUTION_TO_OMNI_GEN[resolution]
      : undefined,
    numImages: 1,
    hasReferenceImages: referenceImageCount > 0,
    imageMediaTokenCount: referenceImageCount,
  });

  useEffect(() => {
    setEstimatedCreditsForPage(ModelPage.Stage3D, credits);
  }, [credits, setEstimatedCreditsForPage]);
}

// ── Video cost estimate hook ─────────────────────────────────────────────

export interface VideoCostParams {
  model: string;
  aspectRatio?: string;
  resolution?: string | null;
  duration?: number | null;
  numVideos?: number;
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
    if (!params.model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    const body: OmniGenVideoRequest = {
      model: params.model,
      aspect_ratio: params.aspectRatio ?? null,
      resolution: params.resolution ?? null,
      duration_seconds: params.duration ?? null,
      generate_audio: params.generateAudio ?? null,
      video_batch_count: params.numVideos ?? 1,
    };

    // Wire up frame/reference tokens based on mode
    if (params.isReferenceMode && params.referenceImageCount > 0) {
      body.reference_image_media_tokens = new Array(params.referenceImageCount).fill("placeholder");
    } else {
      if (params.hasStartFrame) {
        body.start_frame_image_media_token = "placeholder";
      }
      if (params.hasEndFrame) {
        body.end_frame_image_media_token = "placeholder";
      }
    }

    const api = new OmniGenApi();
    api.estimateVideoCost(body).then(
      (response) => {
        if (id !== abortRef.current) return;
        if (response.success && response.cost_in_credits != null) {
          setCredits(response.cost_in_credits);
        } else {
          setCredits(null);
        }
      },
      () => {
        if (id !== abortRef.current) return;
        setCredits(null);
      },
    );
  }, [
    params.model,
    params.aspectRatio,
    params.resolution,
    params.duration,
    params.numVideos,
    params.hasStartFrame,
    params.hasEndFrame,
    params.isReferenceMode,
    params.referenceImageCount,
    params.generateAudio,
  ]);

  return credits;
}
