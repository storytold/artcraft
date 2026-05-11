import { JobsApi, PromptsApi } from "@storyteller/api";
import {
  newIdempotencyToken,
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
    uuid_idempotency_token: newIdempotencyToken(),
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

// ── Session sync ─────────────────────────────────────────────────────────

/**
 * Heuristic match for any Beeble SwitchX model variant the backend may emit.
 * Matches: `switch_x`, `switchx`, `beeble_switchx`, `beeble_switch_x`,
 * `Beeble.SwitchX`, etc.
 */
const isSwitchXModel = (modelType?: string | null): boolean => {
  if (!modelType) return false;
  const normalized = modelType.toLowerCase().replace(/\./g, "_");
  return normalized.includes("switchx") || normalized.includes("switch_x");
};

export interface SessionMediaRef {
  url: string;
  mediaToken: string;
}

export interface SessionBackgroundChangeJob {
  jobToken: string;
  status: "pending" | "complete" | "failed";
  prompt: string;
  source?: SessionMediaRef;
  reference?: SessionMediaRef;
  outputUrl?: string;
  failureReason?: string;
  createdAt: number;
}

/**
 * Fetch the user's recent jobs from `/v1/jobs/session` and filter down to
 * Beeble SwitchX (background-change) jobs. Used on mount so the page reflects
 * server-side state across refreshes and devices, not just localStorage.
 *
 * The model type may live on `job.request.maybe_model_type` OR on the prompt
 * (looked up by `maybe_prompt_token`) — that's the same fallback chain the
 * task queue / video page use, so we match here too.
 */
export async function listSessionBackgroundChangeJobs(): Promise<
  SessionBackgroundChangeJob[]
> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.ListRecentJobs();
  if (!response.success || !response.data) return [];

  // Resolve any missing model_types via the prompts API.
  const promptTokens = Array.from(
    new Set(
      response.data
        .map((j) => j.request.maybe_prompt_token)
        .filter((t): t is string => !!t),
    ),
  );
  const promptsByToken = new Map<
    string,
    {
      maybe_model_type?: string | null;
      maybe_positive_prompt?: string | null;
      maybe_context_images?: Array<{
        media_token: string;
        media_links: {
          cdn_url: string;
          maybe_video_previews?: unknown;
        };
        semantic: string;
      }> | null;
    }
  >();
  if (promptTokens.length > 0) {
    try {
      const promptsApi = new PromptsApi();
      const promptsResponse = await promptsApi.BatchGetPrompts({
        tokens: promptTokens,
      });
      if (promptsResponse.success && promptsResponse.data) {
        for (const p of promptsResponse.data) {
          promptsByToken.set(p.token, p);
        }
      }
    } catch {
      // Non-fatal: fall back to job.request.maybe_model_type only.
    }
  }

  const out: SessionBackgroundChangeJob[] = [];
  for (const job of response.data) {
    const promptToken = job.request.maybe_prompt_token;
    const cachedPrompt = promptToken
      ? promptsByToken.get(promptToken)
      : undefined;
    const modelType =
      cachedPrompt?.maybe_model_type ?? job.request.maybe_model_type;
    if (!isSwitchXModel(modelType)) continue;

    const statusStr = job.status?.status?.toLowerCase() ?? "";
    let status: SessionBackgroundChangeJob["status"];
    let outputUrl: string | undefined;
    let failureReason: string | undefined;

    if (statusStr === "complete_success" || statusStr === "complete") {
      status = "complete";
      const result = job.maybe_result as unknown as
        | Record<string, unknown>
        | undefined;
      outputUrl =
        ((result as any)?.media_links?.cdn_url as string | undefined) ??
        ((result as any)?.cdn_url as string | undefined);
    } else if (
      statusStr.includes("fail") ||
      statusStr.includes("error") ||
      statusStr === "dead" ||
      statusStr.includes("cancel")
    ) {
      status = "failed";
      failureReason =
        job.status?.maybe_failure_message ??
        job.status?.maybe_extra_status_description ??
        "Generation failed";
    } else {
      status = "pending";
    }

    // Extract source video + reference image from the prompt's context images.
    // We don't depend on exact semantic strings — videos are the items whose
    // media_links carry video previews, images are everything else.
    let source: SessionMediaRef | undefined;
    let reference: SessionMediaRef | undefined;
    const ctxImages = cachedPrompt?.maybe_context_images ?? [];
    for (const ci of ctxImages) {
      const isVideo = !!ci.media_links?.maybe_video_previews;
      if (isVideo && !source) {
        source = { url: ci.media_links.cdn_url, mediaToken: ci.media_token };
      } else if (!isVideo && !reference) {
        reference = {
          url: ci.media_links.cdn_url,
          mediaToken: ci.media_token,
        };
      }
      if (source && reference) break;
    }

    const resolvedPrompt =
      cachedPrompt?.maybe_positive_prompt ??
      job.request.maybe_raw_inference_text ??
      "";

    out.push({
      jobToken: job.job_token,
      status,
      prompt: resolvedPrompt,
      source,
      reference,
      outputUrl,
      failureReason,
      createdAt: new Date(job.created_at).getTime(),
    });
  }

  return out;
}

// ── Polling controller ───────────────────────────────────────────────────

export function startBackgroundChangePolling(
  jobToken: string,
  onComplete: (output: GeneratedBackgroundChange) => void,
  onError: (reason: string) => void,
  intervalMs = 4000,
  maxAttempts = 75, // ~5 min at 4s — Beeble SwitchX expected runtime
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
