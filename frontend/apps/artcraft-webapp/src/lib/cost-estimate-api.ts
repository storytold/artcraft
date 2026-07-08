import { useEffect, useRef, useState } from "react";
import { OmniGenApi } from "@storyteller/api";
import type {
  OmniGenImageRequest,
  OmniGenVideoRequest,
  OmniGenMeshRequest,
  OmniGenSplatRequest,
} from "@storyteller/api";
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
    params.quality,
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

// ── Audio cost estimate hook ─────────────────────────────────────────────

// Shared with the desktop PromptBoxAudio via the omni-gen lib.
export {
  useAudioCostEstimate,
  type AudioCostParams,
} from "@storyteller/omni-gen";

// ── Video cost estimate hook ─────────────────────────────────────────────

export interface VideoCostParams {
  model: string;
  aspectRatio?: string;
  resolution?: string | null;
  bitrate?: string | null;
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
      bitrate: params.bitrate ?? null,
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
    params.bitrate,
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

// ── Mesh (3D object) cost estimate hook ──────────────────────────────────

export interface MeshCostParams {
  model: string;
  referenceImageCount: number;
  hasInputMesh: boolean;
  meshOutputType?: string | null;
  polygonType?: string | null;
  faceCount?: number | null;
  enablePbr?: boolean | null;
  enableTexture?: boolean | null;
  textureQuality?: string | null;
  geometryQuality?: string | null;
}

export function useMeshCostEstimate(params: MeshCostParams): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!params.model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    const body: OmniGenMeshRequest = {
      model: params.model,
      reference_image_media_tokens:
        params.referenceImageCount > 0
          ? new Array(params.referenceImageCount).fill("placeholder")
          : null,
      input_mesh_media_token: params.hasInputMesh ? "placeholder" : null,
      mesh_output_type: params.meshOutputType ?? null,
      polygon_type: params.polygonType ?? null,
      face_count: params.faceCount ?? null,
      enable_pbr: params.enablePbr ?? null,
      enable_texture: params.enableTexture ?? null,
      texture_quality: params.textureQuality ?? null,
      geometry_quality: params.geometryQuality ?? null,
    };

    const api = new OmniGenApi();
    api.estimateMeshCost(body).then(
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
    params.referenceImageCount,
    params.hasInputMesh,
    params.meshOutputType,
    params.polygonType,
    params.faceCount,
    params.enablePbr,
    params.enableTexture,
    params.textureQuality,
    params.geometryQuality,
  ]);

  return credits;
}

// ── Splat (3D world) cost estimate hook ──────────────────────────────────

export interface SplatCostParams {
  model: string;
  referenceImageCount: number;
  hasReferenceVideo: boolean;
  isPanoramic?: boolean | null;
  disableRecaption?: boolean | null;
}

export function useSplatCostEstimate(params: SplatCostParams): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!params.model) {
      setCredits(null);
      return;
    }

    const id = ++abortRef.current;

    const body: OmniGenSplatRequest = {
      model: params.model,
      reference_image_media_tokens:
        params.referenceImageCount > 0
          ? new Array(params.referenceImageCount).fill("placeholder")
          : null,
      reference_video_media_token: params.hasReferenceVideo
        ? "placeholder"
        : null,
      is_panoramic: params.isPanoramic ?? null,
      disable_recaption: params.disableRecaption ?? null,
    };

    const api = new OmniGenApi();
    api.estimateSplatCost(body).then(
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
    params.referenceImageCount,
    params.hasReferenceVideo,
    params.isPanoramic,
    params.disableRecaption,
  ]);

  return credits;
}
