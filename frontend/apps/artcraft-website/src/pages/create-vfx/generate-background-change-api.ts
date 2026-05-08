import { JobsApi } from "@storyteller/api";
import {
  submitVFXJob,
  VFX_NOT_AVAILABLE_ERROR,
} from "@storyteller/ui-vfx";

export interface GeneratedBackgroundChange {
  cdn_url: string;
}

// ── Request params ───────────────────────────────────────────────────────

export interface GenerateBackgroundChangeParams {
  sourceVideoMediaToken: string;
  referenceImageMediaToken?: string | null;
  prompt?: string | null;
}

export type EnqueueResult =
  | { success: true; jobToken: string }
  | { success: false; error: string; backendUnavailable?: boolean };

// ── Enqueue generation ───────────────────────────────────────────────────

export async function enqueueBackgroundChangeGeneration(
  params: GenerateBackgroundChangeParams,
): Promise<EnqueueResult> {
  const trimmedPrompt = params.prompt?.trim();
  const response = await submitVFXJob({
    source_video_media_token: params.sourceVideoMediaToken,
    reference_image_media_token: params.referenceImageMediaToken ?? null,
    prompt: trimmedPrompt && trimmedPrompt.length > 0 ? trimmedPrompt : null,
  });

  if (response.success) {
    return { success: true, jobToken: response.inference_job_token };
  }

  return {
    success: false,
    error: response.error_message ?? "Failed to submit background change job.",
    backendUnavailable: response.error_code_str === VFX_NOT_AVAILABLE_ERROR,
  };
}

// ── Poll for completion ──────────────────────────────────────────────────

export async function pollBackgroundChangeJobResult(
  jobToken: string,
): Promise<{
  status: "pending" | "complete" | "failed";
  output?: GeneratedBackgroundChange;
  error?: string;
}> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.GetJobByToken({ token: jobToken });

  if (!response.success || !response.data) {
    return { status: "pending" };
  }

  const state = response.data;
  const statusStr = state.status?.status?.toLowerCase() ?? "";

  if (statusStr === "complete_success" || statusStr === "complete") {
    const result = state.maybe_result as Record<string, unknown> | undefined;
    const cdnUrl =
      ((result as any)?.media_links?.cdn_url as string | undefined) ??
      ((result as any)?.cdn_url as string | undefined) ??
      undefined;

    if (cdnUrl) {
      return { status: "complete", output: { cdn_url: cdnUrl } };
    }
    return {
      status: "failed",
      error: "Generation finished but returned no output URL.",
    };
  }

  if (
    statusStr.includes("fail") ||
    statusStr.includes("error") ||
    statusStr === "dead"
  ) {
    return {
      status: "failed",
      error:
        state.status?.maybe_failure_message ??
        state.status?.maybe_extra_status_description ??
        "Generation failed",
    };
  }

  return { status: "pending" };
}

// ── Polling controller ───────────────────────────────────────────────────

export function startBackgroundChangePolling(
  jobToken: string,
  onComplete: (output: GeneratedBackgroundChange) => void,
  onError: (reason: string) => void,
  intervalMs = 4000,
  maxAttempts = 180, // ~12 min at 4s
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const result = await pollBackgroundChangeJobResult(jobToken);
      if (stopped) return;

      if (result.status === "complete" && result.output) {
        onComplete(result.output);
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

  // Start first poll after a short delay (video jobs take time to start)
  setTimeout(poll, 3000);

  return () => {
    stopped = true;
  };
}
