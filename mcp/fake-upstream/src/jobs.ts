/**
 * Inference jobs — ported from `infra/fake-storyteller-web` (wire/jobs.ts, state/entities.ts).
 * The real backend returns deliberately different status objects from `/v1/jobs/job/:token`
 * and `/v1/jobs/session`: only the session listing carries `maybe_failure_category_updated`,
 * `maybe_failure_message` and `maybe_batch_token`. Both variants are reproduced.
 *
 * There is no generation in this fake yet, so jobs come from the seed: one finished, one in
 * progress, one failed, all owned by the seeded user.
 */

export type JobStatus =
  | "pending"
  | "started"
  | "complete_success"
  | "complete_failure"
  | "attempt_failed"
  | "dead"
  | "cancelled_by_user"
  | "cancelled_by_system";

export interface FakeJob {
  readonly jobToken: string;
  readonly ownerUserToken: string;
  readonly inferenceCategory: string;
  readonly status: JobStatus;
  readonly progressPercentage: number;
  readonly modelType: string | null;
  readonly modelTitle: string | null;
  readonly prompt: string | null;
  readonly failureCategory: string | null;
  readonly failureMessage: string | null;
  readonly result: { mediaFileToken: string; cdnUrl: string; completedAt: string } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** The narrow failure enum still sent on `maybe_failure_category` (old clients). */
const OLD_CLIENT_FAILURE_CATEGORIES = new Set([
  "face_not_detected",
  "keep_alive_elapsed",
  "not_yet_implemented",
  "retryable_worker_error",
]);

export function seededJobs(ownerUserToken: string): FakeJob[] {
  return [
    {
      jobToken: "jinf_fake_done_image",
      ownerUserToken,
      inferenceCategory: "image_generation",
      status: "complete_success",
      progressPercentage: 100,
      modelType: "seedream_4",
      modelTitle: "Seedream 4",
      prompt: "a corgi running through a field",
      failureCategory: null,
      failureMessage: null,
      result: {
        mediaFileToken: "m_fake_corgi",
        cdnUrl: "https://cdn.fake.test/media/m_fake_corgi.png",
        completedAt: "2026-08-24T10:00:30Z",
      },
      createdAt: "2026-08-24T10:00:00Z",
      updatedAt: "2026-08-24T10:00:30Z",
    },
    {
      jobToken: "jinf_fake_running_video",
      ownerUserToken,
      inferenceCategory: "video_generation",
      status: "started",
      progressPercentage: 40,
      modelType: "seedance_2p0",
      modelTitle: "Seedance 2.0",
      prompt: "the corgi, now in slow motion",
      failureCategory: null,
      failureMessage: null,
      result: null,
      createdAt: "2026-08-24T10:05:00Z",
      updatedAt: "2026-08-24T10:05:20Z",
    },
    {
      jobToken: "jinf_fake_failed_image",
      ownerUserToken,
      inferenceCategory: "image_generation",
      status: "complete_failure",
      progressPercentage: 0,
      modelType: "gpt_image_1",
      modelTitle: "GPT Image 1",
      prompt: "something the rules do not allow",
      failureCategory: "rule_bans_user_text_prompt",
      failureMessage: "The prompt was rejected by the content rules.",
      result: null,
      createdAt: "2026-08-24T09:00:00Z",
      updatedAt: "2026-08-24T09:00:05Z",
    },
  ];
}

/** `GET /v1/jobs/job/:token` and `GET /v1/jobs/batch`. */
export function jobStatePayload(job: FakeJob): Record<string, unknown> {
  return {
    job_token: job.jobToken,
    request: requestPayload(job),
    status: {
      status: job.status,
      maybe_extra_status_description: null,
      maybe_assigned_worker: null,
      maybe_assigned_cluster: null,
      maybe_first_started_at: job.status === "pending" ? null : job.createdAt,
      attempt_count: job.status === "pending" ? 0 : 1,
      requires_keepalive: false,
      maybe_failure_category: oldClientFailureCategory(job),
      progress_percentage: job.progressPercentage,
    },
    maybe_result: resultPayload(job, false),
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

/** `GET /v1/jobs/session` — the richer status the generation list consumes. */
export function sessionJobPayload(job: FakeJob): Record<string, unknown> {
  return {
    job_token: job.jobToken,
    request: requestPayload(job),
    status: {
      status: job.status,
      maybe_extra_status_description: null,
      maybe_assigned_worker: null,
      maybe_assigned_cluster: null,
      maybe_first_started_at: job.status === "pending" ? null : job.createdAt,
      maybe_current_execution_duration_seconds: job.status === "started" ? 20 : null,
      attempt_count: job.status === "pending" ? 0 : 1,
      requires_keepalive: false,
      maybe_failure_category: oldClientFailureCategory(job),
      maybe_failure_category_updated: job.failureCategory,
      maybe_failure_message: job.failureMessage,
      progress_percentage: job.progressPercentage,
    },
    maybe_result: resultPayload(job, true),
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function requestPayload(job: FakeJob): Record<string, unknown> {
  return {
    inference_category: job.inferenceCategory,
    maybe_prompt_token: null,
    maybe_model_type: job.modelType,
    maybe_model_token: null,
    maybe_model_title: job.modelTitle,
    maybe_raw_inference_text: job.prompt,
    maybe_style_name: null,
    maybe_live_portrait_details: null,
    maybe_lipsync_details: null,
  };
}

function resultPayload(job: FakeJob, includeBatchToken: boolean): Record<string, unknown> | null {
  if (job.result === null) return null;
  return {
    entity_type: "media_file",
    entity_token: job.result.mediaFileToken,
    media_links: {
      cdn_url: job.result.cdnUrl,
      maybe_thumbnail_template: null,
      maybe_video_previews: null,
    },
    maybe_public_bucket_media_path: null,
    maybe_successfully_completed_at: job.result.completedAt,
    ...(includeBatchToken ? { maybe_batch_token: null } : {}),
  };
}

function oldClientFailureCategory(job: FakeJob): string | null {
  return job.failureCategory !== null && OLD_CLIENT_FAILURE_CATEGORIES.has(job.failureCategory)
    ? job.failureCategory
    : null;
}
