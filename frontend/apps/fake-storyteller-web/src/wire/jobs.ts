/**
 * Job response builders.
 *
 * `/v1/jobs/job/:token` and `/v1/jobs/session` return deliberately different
 * status objects in the real backend: only the session listing carries
 * `maybe_failure_category_updated`, `maybe_failure_message` and
 * `maybe_batch_token`. The generation UI reads the session variant, so the
 * difference is load bearing.
 */

import type { JobRecord } from "../state/entities.ts";
import { store } from "../state/store.ts";
import { mediaLinks } from "./media.ts";

/** The narrow failure enum still sent on `maybe_failure_category`. */
const OLD_CLIENT_FAILURE_CATEGORIES = new Set([
  "face_not_detected",
  "keep_alive_elapsed",
  "not_yet_implemented",
  "retryable_worker_error",
]);

/** `GET /v1/jobs/job/:token` and `GET /v1/jobs/batch`. */
export function jobStatePayload(job: JobRecord): object {
  return {
    job_token: job.jobToken,
    request: jobRequestPayload(job),
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
    maybe_result: jobResultPayload(job, false),
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

/** `GET /v1/jobs/session` — the richer status the generation list consumes. */
export function sessionJobPayload(job: JobRecord): object {
  return {
    job_token: job.jobToken,
    request: jobRequestPayload(job),
    status: {
      status: job.status,
      maybe_extra_status_description: null,
      maybe_assigned_worker: null,
      maybe_assigned_cluster: null,
      maybe_first_started_at: job.status === "pending" ? null : job.createdAt,
      maybe_current_execution_duration_seconds: job.status === "started" ? 1 : null,
      attempt_count: job.status === "pending" ? 0 : 1,
      requires_keepalive: false,
      maybe_failure_category: oldClientFailureCategory(job),
      maybe_failure_category_updated: job.maybeFailureCategory ?? null,
      maybe_failure_message: job.maybeFailureMessage ?? null,
      progress_percentage: job.progressPercentage,
    },
    maybe_result: jobResultPayload(job, true),
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

/** `GET /v1/workflows/preview_status/:token` — a deprecated endpoint with an empty request object. */
export function jobPreviewPayload(job: JobRecord): object {
  return {
    job_token: job.jobToken,
    request: {},
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
    maybe_result: null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function jobRequestPayload(job: JobRecord): object {
  return {
    inference_category: job.inferenceCategory,
    maybe_prompt_token: job.maybePromptToken ?? null,
    maybe_model_type: job.maybeModelType ?? null,
    maybe_model_token: null,
    maybe_model_title: job.maybeModelTitle ?? null,
    maybe_raw_inference_text: job.maybeRawInferenceText ?? null,
    maybe_style_name: null,
    maybe_live_portrait_details: null,
    maybe_lipsync_details: null,
  };
}

function jobResultPayload(job: JobRecord, includeBatchToken: boolean): object | null {
  if (job.maybeResultMediaFileToken === undefined) {
    return null;
  }

  const record = store.mediaFilesByToken.get(job.maybeResultMediaFileToken);
  if (record === undefined) {
    return null;
  }

  const result: Record<string, unknown> = {
    entity_type: "media_file",
    entity_token: record.token,
  };

  if (includeBatchToken) {
    result["maybe_batch_token"] = job.maybeBatchToken ?? null;
  }

  result["maybe_public_bucket_media_path"] = `/media/${record.bucketPath}`;
  result["media_links"] = mediaLinks(record);
  result["maybe_successfully_completed_at"] = job.maybeSuccessfullyCompletedAt ?? null;

  return result;
}

function oldClientFailureCategory(job: JobRecord): string | null {
  if (job.maybeFailureCategory === undefined) {
    return null;
  }
  return OLD_CLIENT_FAILURE_CATEGORIES.has(job.maybeFailureCategory) ? job.maybeFailureCategory : null;
}
