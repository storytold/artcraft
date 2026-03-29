import { JobsApi, OmniGenApi } from "@storyteller/api";
import type { OmniGenVideoRequest } from "@storyteller/api";
import type { GeneratedVideo } from "./create-video-store";

// ── Request params ───────────────────────────────────────────────────────

export interface GenerateVideoParams {
  prompt: string;
  model: string;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
  startFrameImageMediaToken?: string;
  endFrameImageMediaToken?: string;
  referenceImageMediaTokens?: string[];
  referenceVideoMediaTokens?: string[];
  referenceAudioMediaTokens?: string[];
}

// ── Enqueue generation ───────────────────────────────────────────────────

export async function enqueueVideoGeneration(
  params: GenerateVideoParams,
): Promise<{ success: boolean; jobToken?: string; error?: string }> {
  const body: OmniGenVideoRequest = {
    model: params.model,
    prompt: params.prompt,
    idempotency_token: crypto.randomUUID(),
    aspect_ratio: params.aspectRatio ?? null,
    resolution: params.resolution ?? null,
    duration_seconds: params.duration ?? null,
    generate_audio: params.generateAudio ?? null,
    start_frame_image_media_token: params.startFrameImageMediaToken ?? null,
    end_frame_image_media_token: params.endFrameImageMediaToken ?? null,
    reference_image_media_tokens: params.referenceImageMediaTokens?.length
      ? params.referenceImageMediaTokens
      : null,
    reference_video_media_tokens: params.referenceVideoMediaTokens?.length
      ? params.referenceVideoMediaTokens
      : null,
    reference_audio_media_tokens: params.referenceAudioMediaTokens?.length
      ? params.referenceAudioMediaTokens
      : null,
  };

  try {
    const api = new OmniGenApi();
    const response = await api.generateVideo(body);
    if (response.success && response.inference_job_token) {
      return { success: true, jobToken: response.inference_job_token };
    }
    return { success: false, error: "Generation failed" };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Request failed" };
  }
}

// ── Poll for completion ──────────────────────────────────────────────────

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

// ── Polling controller ───────────────────────────────────────────────────

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
