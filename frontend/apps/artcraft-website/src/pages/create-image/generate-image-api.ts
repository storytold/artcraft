import { JobsApi, MediaFilesApi, OmniGenApi } from "@storyteller/api";
import type { OmniGenImageRequest } from "@storyteller/api";
import type { GeneratedImage } from "./create-image-store";

// ── Request params ───────────────────────────────────────────────────────

export interface GenerateImageParams {
  prompt: string;
  model: string;
  numImages?: number;
  aspectRatio?: string;
  resolution?: string;
  imageMediaTokens?: string[];
}

// ── Enqueue generation ───────────────────────────────────────────────────

export async function enqueueImageGeneration(
  params: GenerateImageParams,
): Promise<{ success: boolean; jobToken?: string; error?: string }> {
  const body: OmniGenImageRequest = {
    model: params.model,
    prompt: params.prompt,
    idempotency_token: crypto.randomUUID(),
    aspect_ratio: params.aspectRatio ?? null,
    resolution: params.resolution ?? null,
    image_batch_count: params.numImages ?? 1,
    image_media_tokens: params.imageMediaTokens?.length
      ? params.imageMediaTokens
      : null,
  };

  try {
    const api = new OmniGenApi();
    const response = await api.generateImage(body);
    if (response.success && response.inference_job_token) {
      return { success: true, jobToken: response.inference_job_token };
    }
    return { success: false, error: "Generation failed" };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Request failed" };
  }
}

// ── Poll for completion ──────────────────────────────────────────────────

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

// ── Polling controller ───────────────────────────────────────────────────

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
