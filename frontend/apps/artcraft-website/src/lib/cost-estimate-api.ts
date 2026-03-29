import { useEffect, useRef, useState } from "react";
import { OmniGenApi } from "@storyteller/api";
import type { OmniGenImageRequest, OmniGenVideoRequest } from "@storyteller/api";

// ── Image cost estimate hook ─────────────────────────────────────────────

export interface ImageCostParams {
  model: string;
  aspectRatio?: string;
  resolution?: string;
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

// ── Video cost estimate hook ─────────────────────────────────────────────

export interface VideoCostParams {
  model: string;
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
    params.hasStartFrame,
    params.hasEndFrame,
    params.isReferenceMode,
    params.referenceImageCount,
    params.generateAudio,
  ]);

  return credits;
}
