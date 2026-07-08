import { JobsApi, MediaFilesApi, OmniGenApi } from "@storyteller/api";
import type { OmniGenSplatRequest } from "@storyteller/api";
import type { GeneratedAsset } from "./create-world-store";

// ── Request params ───────────────────────────────────────────────────────

export interface GenerateSplatParams {
  model: string;
  prompt?: string;
  referenceImageMediaTokens?: string[];
  referenceVideoMediaToken?: string;
  isPanoramic?: boolean;
  disableRecaption?: boolean;
}

// ── Enqueue generation ───────────────────────────────────────────────────

export async function enqueueSplatGeneration(
  params: GenerateSplatParams,
): Promise<{
  success: boolean;
  jobToken?: string;
  error?: string;
  errorCode?: number;
}> {
  const body: OmniGenSplatRequest = {
    model: params.model,
    idempotency_token: crypto.randomUUID(),
    prompt: params.prompt ?? null,
    reference_image_media_tokens: params.referenceImageMediaTokens?.length
      ? params.referenceImageMediaTokens
      : null,
    reference_video_media_token: params.referenceVideoMediaToken ?? null,
    is_panoramic: params.isPanoramic ?? null,
    disable_recaption: params.disableRecaption ?? null,
  };

  try {
    const api = new OmniGenApi();
    const response = await api.generateSplat(body);
    if (response.success && response.inference_job_token) {
      return { success: true, jobToken: response.inference_job_token };
    }
    return { success: false, error: "Generation failed" };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "Request failed",
      errorCode: parseHttpStatusCode(err),
    };
  }
}

function parseHttpStatusCode(err: unknown): number | undefined {
  const message = err instanceof Error ? err.message : String(err);
  const match = /status:\s*(\d+)/.exec(message);
  return match ? Number(match[1]) : undefined;
}

// ── Poll for completion ──────────────────────────────────────────────────

async function pollJobResult(
  jobToken: string,
): Promise<{ status: "pending" | "complete" | "failed"; assets: GeneratedAsset[]; error?: string }> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.GetJobByToken({ token: jobToken });

  if (!response.success || !response.data) {
    return { status: "pending", assets: [] };
  }

  const state = response.data;
  const statusStr = state.status?.status?.toLowerCase() ?? "";

  if (statusStr === "complete_success" || statusStr === "complete") {
    const result = state.maybe_result as Record<string, unknown> | undefined;
    const mediaLinks = (result as any)?.media_links;
    const entityToken = (result as any)?.entity_token as string | undefined;

    if (mediaLinks?.cdn_url) {
      return {
        status: "complete",
        assets: [
          {
            media_token: entityToken ?? jobToken,
            cdn_url: mediaLinks.cdn_url,
            maybe_thumbnail_template: mediaLinks.maybe_thumbnail_template,
          },
        ],
      };
    }

    if (entityToken) {
      try {
        const mediaApi = new MediaFilesApi();
        const mediaFile = await mediaApi.GetMediaFileByToken({
          mediaFileToken: entityToken,
        });
        const cdnUrl = (mediaFile.data as any)?.media_links?.cdn_url;
        if (cdnUrl) {
          return {
            status: "complete",
            assets: [{ media_token: entityToken, cdn_url: cdnUrl }],
          };
        }
      } catch {
        // fall through
      }
    }

    return { status: "complete", assets: [] };
  }

  if (
    statusStr.includes("fail") ||
    statusStr.includes("error") ||
    statusStr === "dead"
  ) {
    return {
      status: "failed",
      assets: [],
      error:
        state.status?.maybe_failure_message ??
        state.status?.maybe_extra_status_description ??
        "Generation failed",
    };
  }

  return { status: "pending", assets: [] };
}

// ── Polling controller ───────────────────────────────────────────────────

// Splat / world generation is slow, so allow a generous window.
export function startPolling(
  jobToken: string,
  onComplete: (assets: GeneratedAsset[]) => void,
  onError: (reason: string) => void,
  intervalMs = 5000,
  maxAttempts = 180,
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
        onComplete(result.assets);
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

  setTimeout(poll, 2000);

  return () => {
    stopped = true;
  };
}
