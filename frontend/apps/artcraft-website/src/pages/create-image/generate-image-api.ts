import { JobsApi, GenerationApi, MediaFilesApi } from "@storyteller/api";
import type { GeneratedImage } from "./create-image-store";

// ── Model → endpoint mapping ──────────────────────────────────────────────

const MULTI_FUNCTION_MODELS: Record<string, string> = {
  nano_banana: "nano_banana",
  nano_banana_2: "nano_banana_2",
  nano_banana_pro: "nano_banana_pro",
  gpt_image_1p5: "gpt_image_1p5",
  seedream_4: "bytedance_seedream_4",
  seedream_4p5: "bytedance_seedream_4p5",
  seedream_5_lite: "bytedance_seedream_5_lite",
};

const TEXT_TO_IMAGE_MODELS: Record<string, string> = {
  flux_1_dev: "flux_1_dev_text_to_image",
  flux_1_schnell: "flux_1_schnell_text_to_image",
  flux_pro_11: "flux_pro_1.1_text_to_image",
  flux_pro_11_ultra: "flux_pro_1.1_ultra_text_to_image",
  gpt_image_1: "gpt_image_1_text_to_image",
};

function getEndpointForModel(tauriId: string): string {
  if (MULTI_FUNCTION_MODELS[tauriId]) {
    return `/v1/generate/image/multi_function/${MULTI_FUNCTION_MODELS[tauriId]}`;
  }
  if (TEXT_TO_IMAGE_MODELS[tauriId]) {
    return `/v1/generate/image/${TEXT_TO_IMAGE_MODELS[tauriId]}`;
  }
  throw new Error(`No REST endpoint for model: ${tauriId}`);
}

// ── Aspect ratio mapping ──────────────────────────────────────────────────

/** Maps frontend CommonAspectRatio values to model-specific backend values */
const ASPECT_RATIO_MAP: Record<string, Record<string, string>> = {
  // Nano Banana family uses ratio names without landscape/portrait prefix
  nano_banana: {
    square: "one_by_one",
    wide_five_by_four: "five_by_four",
    wide_four_by_three: "four_by_three",
    wide_three_by_two: "three_by_two",
    wide_sixteen_by_nine: "sixteen_by_nine",
    wide_twenty_one_by_nine: "twenty_one_by_nine",
    tall_four_by_five: "four_by_five",
    tall_three_by_four: "three_by_four",
    tall_two_by_three: "two_by_three",
    tall_nine_by_sixteen: "nine_by_sixteen",
    auto: "auto",
  },
  // Flux Dev/Schnell use landscape/portrait prefix
  flux: {
    square: "square",
    square_hd: "square_hd",
    wide_four_by_three: "landscape_four_by_three",
    wide_sixteen_by_nine: "landscape_sixteen_by_nine",
    tall_three_by_four: "portrait_three_by_four",
    tall_nine_by_sixteen: "portrait_nine_by_sixteen",
  },
  // GPT Image 1 uses image_size: square/horizontal/vertical
  gpt_image_1: {
    square: "square",
    wide: "horizontal",
    tall: "vertical",
    wide_sixteen_by_nine: "horizontal",
    wide_four_by_three: "horizontal",
    tall_nine_by_sixteen: "vertical",
    tall_three_by_four: "vertical",
  },
  // GPT Image 1.5 uses simple size names (field: image_size)
  gpt_image_1p5: {
    square: "square",
    wide: "wide",
    tall: "tall",
    wide_sixteen_by_nine: "wide",
    wide_four_by_three: "wide",
    wide_three_by_two: "wide",
    tall_nine_by_sixteen: "tall",
    tall_three_by_four: "tall",
  },
  // Seedream uses same as nano_banana
  seedream: {
    square: "one_by_one",
    square_hd: "one_by_one_hd",
    wide_four_by_three: "four_by_three",
    wide_sixteen_by_nine: "sixteen_by_nine",
    tall_three_by_four: "three_by_four",
    tall_nine_by_sixteen: "nine_by_sixteen",
    auto_2k: "auto_2k",
    auto_4k: "auto_4k",
  },
};

function getAspectRatioFamily(tauriId: string): string {
  if (tauriId.startsWith("nano_banana")) return "nano_banana";
  if (tauriId.startsWith("flux")) return "flux";
  if (tauriId === "gpt_image_1p5") return "gpt_image_1p5";
  if (tauriId === "gpt_image_1") return "gpt_image_1";
  if (tauriId.startsWith("seedream")) return "seedream";
  return "flux"; // default
}

/** Models that use `image_size` field instead of `aspect_ratio` */
const IMAGE_SIZE_MODELS = new Set(["gpt_image_1", "gpt_image_1p5"]);

const NUM_IMAGES_MAP: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
};

// ── Request builder ───────────────────────────────────────────────────────

export interface GenerateImageParams {
  prompt: string;
  modelTauriId: string;
  numImages?: number;
  aspectRatio?: string;
  resolution?: string;
  imageMediaTokens?: string[];
}

function buildRequestBody(params: GenerateImageParams): Record<string, unknown> {
  const { prompt, modelTauriId, numImages = 1, aspectRatio, resolution, imageMediaTokens } = params;

  const body: Record<string, unknown> = {
    uuid_idempotency_token: crypto.randomUUID(),
    prompt,
    num_images: NUM_IMAGES_MAP[Math.min(4, Math.max(1, numImages))] ?? "one",
  };

  if (imageMediaTokens?.length) {
    body.image_media_tokens = imageMediaTokens;
  }

  if (aspectRatio) {
    const family = getAspectRatioFamily(modelTauriId);
    const map = ASPECT_RATIO_MAP[family];
    const mapped = map?.[aspectRatio] ?? aspectRatio;

    if (IMAGE_SIZE_MODELS.has(modelTauriId)) {
      body.image_size = mapped;
    } else {
      body.aspect_ratio = mapped;
    }
  }

  if (resolution) {
    body.resolution = resolution;
  }

  return body;
}

// ── Enqueue generation ────────────────────────────────────────────────────

export async function enqueueImageGeneration(
  params: GenerateImageParams,
): Promise<{ success: boolean; jobToken?: string; error?: string }> {
  const endpoint = getEndpointForModel(params.modelTauriId);
  const body = buildRequestBody(params);
  const api = new GenerationApi();
  return api.Enqueue(endpoint, body);
}

// ── Poll for completion ───────────────────────────────────────────────────

export async function pollJobResult(
  jobToken: string,
): Promise<{ status: "pending" | "complete" | "failed"; images: GeneratedImage[]; error?: string }> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.GetJobByToken({ token: jobToken });

  if (!response.success || !response.data) {
    return { status: "pending", images: [] };
  }

  const state = response.data;
  const statusStr = state.status?.status?.toLowerCase() ?? "";

  if (statusStr === "complete_success" || statusStr === "complete") {
    const result = state.maybe_result as Record<string, unknown> | undefined;
    const mediaLinks = (result as any)?.media_links;
    const entityToken = (result as any)?.entity_token as string | undefined;

    // The /v1/jobs/job/{token} endpoint doesn't return maybe_batch_token,
    // so we look it up from the media file itself.
    if (entityToken) {
      try {
        const mediaApi = new MediaFilesApi();
        const mediaFile = await mediaApi.GetMediaFileByToken({
          mediaFileToken: entityToken,
        });
        const batchToken = mediaFile.data?.maybe_batch_token;

        if (batchToken) {
          const batchResponse = await mediaApi.GetMediaFilesByBatchToken({
            batchToken,
          });
          if (batchResponse.success && batchResponse.data?.length) {
            const images: GeneratedImage[] = batchResponse.data
              .map((file: any) => ({
                media_token: file.token,
                cdn_url: file.media_links?.cdn_url,
                maybe_thumbnail_template:
                  file.media_links?.maybe_thumbnail_template,
              }))
              .filter((img: GeneratedImage) => img.cdn_url);
            if (images.length > 0) {
              return { status: "complete", images };
            }
          }
        }
      } catch {
        // Fall through to single-image extraction
      }
    }

    // Single image fallback
    if (mediaLinks?.cdn_url) {
      const image: GeneratedImage = {
        media_token: entityToken ?? jobToken,
        cdn_url: mediaLinks.cdn_url,
        maybe_thumbnail_template: mediaLinks.maybe_thumbnail_template,
      };
      return { status: "complete", images: [image] };
    }

    return { status: "complete", images: [] };
  }

  if (
    statusStr.includes("fail") ||
    statusStr.includes("error") ||
    statusStr === "dead"
  ) {
    return {
      status: "failed",
      images: [],
      error: state.status?.maybe_extra_status_description ?? "Generation failed",
    };
  }

  return { status: "pending", images: [] };
}

// ── Polling controller ────────────────────────────────────────────────────

export function startPolling(
  jobToken: string,
  onComplete: (images: GeneratedImage[]) => void,
  onError: (reason: string) => void,
  intervalMs = 3000,
  maxAttempts = 120,
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const result = await pollJobResult(jobToken);
      if (stopped) return;

      if (result.status === "complete") {
        onComplete(result.images);
        return;
      }
      if (result.status === "failed") {
        onError(result.error ?? "Generation failed");
        return;
      }
      if (attempts >= maxAttempts) {
        onError("Generation timed out");
        return;
      }

      setTimeout(poll, intervalMs);
    } catch {
      if (!stopped && attempts < maxAttempts) {
        setTimeout(poll, intervalMs * 2);
      } else if (!stopped) {
        onError("Network error during polling");
      }
    }
  };

  // Start first poll after a short delay
  setTimeout(poll, 2000);

  return () => {
    stopped = true;
  };
}

// ── Check if model has a web endpoint ─────────────────────────────────────

export function modelHasWebEndpoint(tauriId: string): boolean {
  return tauriId in MULTI_FUNCTION_MODELS || tauriId in TEXT_TO_IMAGE_MODELS;
}
