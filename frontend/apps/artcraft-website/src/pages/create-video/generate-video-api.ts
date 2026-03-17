import { JobsApi, GenerationApi } from "@storyteller/api";
import type { GeneratedVideo } from "./create-video-store";

// ── Model → endpoint mapping ──────────────────────────────────────────────

const MULTI_FUNCTION_MODELS: Record<string, string> = {
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

function getEndpointForModel(tauriId: string): string {
  const slug = MULTI_FUNCTION_MODELS[tauriId];
  if (slug) return `/v1/generate/video/multi_function/${slug}`;
  throw new Error(`No REST endpoint for video model: ${tauriId}`);
}

export function videoModelHasWebEndpoint(tauriId: string): boolean {
  return tauriId in MULTI_FUNCTION_MODELS;
}

// ── Aspect ratio mapping ──────────────────────────────────────────────────

const ASPECT_RATIO_MAP: Record<string, Record<string, string>> = {
  kling: {
    square: "square",
    wide_sixteen_by_nine: "sixteen_by_nine",
    tall_nine_by_sixteen: "nine_by_sixteen",
  },
  seedance_1p5: {
    square: "square",
    wide_sixteen_by_nine: "sixteen_by_nine",
    wide_four_by_three: "four_by_three",
    wide_twenty_one_by_nine: "twenty_one_by_nine",
    tall_three_by_four: "three_by_four",
    tall_nine_by_sixteen: "nine_by_sixteen",
    auto: "auto",
  },
  seedance_2p0: {
    square: "square1x1",
    wide_sixteen_by_nine: "landscape16x9",
    wide_four_by_three: "standard4x3",
    tall_three_by_four: "portrait3x4",
    tall_nine_by_sixteen: "portrait9x16",
  },
  sora: {
    auto: "auto",
    wide_sixteen_by_nine: "sixteen_by_nine",
    tall_nine_by_sixteen: "nine_by_sixteen",
  },
  veo: {
    auto: "auto",
    wide_sixteen_by_nine: "sixteen_by_nine",
    tall_nine_by_sixteen: "nine_by_sixteen",
  },
};

function getAspectRatioFamily(tauriId: string): string {
  if (tauriId.startsWith("kling")) return "kling";
  if (tauriId === "seedance_2p0") return "seedance_2p0";
  if (tauriId.startsWith("seedance")) return "seedance_1p5";
  if (tauriId.startsWith("sora")) return "sora";
  if (tauriId.startsWith("veo")) return "veo";
  return "sora"; // default
}

// ── Duration mapping ─────────────────────────────────────────────────────

const DURATION_WORDS: Record<number, string> = {
  3: "three_seconds",
  4: "four_seconds",
  5: "five_seconds",
  6: "six_seconds",
  7: "seven_seconds",
  8: "eight_seconds",
  9: "nine_seconds",
  10: "ten_seconds",
  11: "eleven_seconds",
  12: "twelve_seconds",
  13: "thirteen_seconds",
  14: "fourteen_seconds",
  15: "fifteen_seconds",
};

// ── Request builder ───────────────────────────────────────────────────────

export interface GenerateVideoParams {
  prompt: string;
  modelTauriId: string;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
  imageMediaToken?: string;
  endFrameImageMediaToken?: string;
  referenceImageMediaTokens?: string[];
  referenceVideoMediaTokens?: string[];
  referenceAudioMediaTokens?: string[];
}

function buildRequestBody(params: GenerateVideoParams): Record<string, unknown> {
  const { prompt, modelTauriId, aspectRatio, duration, resolution, generateAudio, imageMediaToken, endFrameImageMediaToken, referenceImageMediaTokens, referenceVideoMediaTokens, referenceAudioMediaTokens } = params;

  const body: Record<string, unknown> = {
    uuid_idempotency_token: crypto.randomUUID(),
    prompt,
  };

  if (imageMediaToken) {
    // Different models use different field names for the image token
    if (modelTauriId.startsWith("seedance_1p5") || modelTauriId.startsWith("veo")) {
      body.start_frame_image_media_token = imageMediaToken;
    } else if (modelTauriId === "seedance_2p0") {
      body.start_frame_media_token = imageMediaToken;
    } else {
      body.image_media_token = imageMediaToken;
    }
  }

  if (endFrameImageMediaToken) {
    body.end_frame_image_media_token = endFrameImageMediaToken;
  }

  if (aspectRatio) {
    const family = getAspectRatioFamily(modelTauriId);
    const map = ASPECT_RATIO_MAP[family];
    body.aspect_ratio = map?.[aspectRatio] ?? aspectRatio;
  }

  if (duration) {
    // Seedance 2.0 uses raw integer for duration_seconds
    if (modelTauriId === "seedance_2p0") {
      body.duration_seconds = duration;
    } else {
      body.duration = DURATION_WORDS[duration] ?? `${duration}_seconds`;
    }
  }

  if (resolution) {
    body.resolution = resolution;
  }

  if (generateAudio !== undefined) {
    body.generate_audio = generateAudio;
  }

  if (referenceImageMediaTokens?.length) {
    body.reference_image_media_tokens = referenceImageMediaTokens;
  }

  if (referenceVideoMediaTokens?.length) {
    body.reference_video_media_tokens = referenceVideoMediaTokens;
  }

  if (referenceAudioMediaTokens?.length) {
    body.reference_audio_media_tokens = referenceAudioMediaTokens;
  }

  return body;
}

// ── Enqueue generation ────────────────────────────────────────────────────

export async function enqueueVideoGeneration(
  params: GenerateVideoParams,
): Promise<{ success: boolean; jobToken?: string; error?: string }> {
  const endpoint = getEndpointForModel(params.modelTauriId);
  const body = buildRequestBody(params);
  const api = new GenerationApi();
  return api.Enqueue(endpoint, body);
}

// ── Poll for completion ───────────────────────────────────────────────────

export async function pollVideoJobResult(
  jobToken: string,
): Promise<{ status: "pending" | "complete" | "failed"; video?: GeneratedVideo; error?: string }> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.GetJobByToken({ token: jobToken });

  if (!response.success || !response.data) {
    return { status: "pending" };
  }

  const state = response.data;
  const statusStr = state.status?.status?.toLowerCase() ?? "";

  if (statusStr === "complete_success" || statusStr === "complete") {
    const result = state.maybe_result as Record<string, unknown> | undefined;
    const mediaLinks = (result as any)?.media_links;

    if (mediaLinks?.cdn_url) {
      return {
        status: "complete",
        video: {
          media_token: (result as any)?.entity_token ?? jobToken,
          cdn_url: mediaLinks.cdn_url,
          maybe_thumbnail_template: mediaLinks.maybe_thumbnail_template,
        },
      };
    }

    return { status: "complete" };
  }

  if (
    statusStr.includes("fail") ||
    statusStr.includes("error") ||
    statusStr === "dead"
  ) {
    return {
      status: "failed",
      error: state.status?.maybe_extra_status_description ?? "Generation failed",
    };
  }

  return { status: "pending" };
}

// ── Polling controller ────────────────────────────────────────────────────

export function startVideoPolling(
  jobToken: string,
  onComplete: (video: GeneratedVideo) => void,
  onError: (reason: string) => void,
  intervalMs = 4000,
  maxAttempts = 180, // 12 min (video takes longer than images)
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const result = await pollVideoJobResult(jobToken);
      if (stopped) return;

      if (result.status === "complete" && result.video) {
        onComplete(result.video);
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

  // Start first poll after a short delay (video takes longer to start)
  setTimeout(poll, 3000);

  return () => {
    stopped = true;
  };
}
