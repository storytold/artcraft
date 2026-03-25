import { useCallback, useEffect, useRef, useState } from "react";
import { JobsApi, JobStatus } from "@storyteller/api";
import type { Job } from "@storyteller/api";
import {
  getModelDisplayName,
  getProviderDisplayName,
  ALL_MODELS_LIST,
} from "@storyteller/model-list";
import type { GalleryItem } from "./useGalleryData";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InProgressJob {
  id: string;
  prompt: string;
  modelLabel: string;
  progress: number;
  estimatedTimeLeftMs?: number;
}

export interface FailedJob {
  id: string;
  prompt: string;
  modelLabel: string;
  failureReason?: string;
  failureMessage?: string;
  status: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const IN_PROGRESS_STATUSES = new Set([JobStatus.PENDING, JobStatus.STARTED]);
const COMPLETED_STATUSES = new Set([JobStatus.COMPLETE_SUCCESS]);
const FAILED_STATUSES = new Set([
  JobStatus.ATTEMPT_FAILED,
  JobStatus.COMPLETE_FAILURE,
  JobStatus.DEAD,
  JobStatus.CANCELLED_BY_USER,
  JobStatus.CANCELLED_BY_SYSTEM,
]);

const FAILURE_REASON_LABEL: Record<string, string> = {
  rule_bans_user_image: "Image violates content policy",
  rule_bans_user_image_with_faces: "Images with faces are not allowed",
  rule_bans_user_text_prompt: "Text prompt violates content policy",
  rule_bans_user_content: "Content violates content policy",
  rule_bans_generated_video: "Generated video flagged by content policy",
  rule_bans_generated_audio: "Generated audio flagged by content policy",
  rule_bans_generated_content: "Generated content flagged by content policy",
  generation_failed: "Generation failed",
  unknown: "An unknown error occurred",
};

// Cache per-task durations
const taskDurationCache = new Map<string, number>();

// ── Helpers ────────────────────────────────────────────────────────────────

function getJobMediaType(job: Job): "image" | "video" | "other" {
  const cat = job.request.inference_category?.toLowerCase() ?? "";
  if (cat.includes("video")) return "video";
  if (cat.includes("image")) return "image";
  return "other";
}

function getModelLabel(job: Job): string {
  const modelType = job.request.maybe_model_type ?? "";
  const modelDisplay = modelType ? getModelDisplayName(modelType) : undefined;
  const provider = modelType
    ? getProviderDisplayName(modelType.toLowerCase())
    : undefined;
  if (modelDisplay && provider) return `${modelDisplay} — ${provider}`;
  return modelDisplay || job.request.maybe_model_title || "Unknown model";
}

function getPrompt(job: Job): string {
  return job.request.maybe_raw_inference_text || "";
}

function jobToInProgress(job: Job): InProgressJob {
  const now = Date.now();
  const createdMs = new Date(job.created_at).getTime();
  const modelType = job.request.maybe_model_type;
  const isVideo =
    job.request.inference_category?.toLowerCase().includes("video") ?? false;

  let duration = taskDurationCache.get(job.job_token);
  if (!duration) {
    const model = modelType
      ? ALL_MODELS_LIST.find(
          (m) => m.tauriId === modelType || m.id === modelType,
        )
      : undefined;
    duration = model?.progressBarTime ?? (isVideo ? 120000 : 30000);
    taskDurationCache.set(job.job_token, duration);
  }

  const elapsed = now - createdMs;
  const progress = Math.min(95, (elapsed / duration) * 100);
  const estimatedTimeLeftMs = Math.max(0, duration - elapsed);

  return {
    id: job.job_token,
    prompt: getPrompt(job),
    modelLabel: getModelLabel(job),
    progress,
    estimatedTimeLeftMs,
  };
}

function jobToFailed(job: Job): FailedJob {
  const failureCategory = job.status.maybe_failure_category;
  const failureReason = failureCategory
    ? FAILURE_REASON_LABEL[failureCategory] ||
      job.status.maybe_extra_status_description ||
      undefined
    : job.status.maybe_extra_status_description || undefined;
  const failureMessage =
    job.status.maybe_extra_status_description &&
    failureCategory !== "unknown"
      ? job.status.maybe_extra_status_description
      : undefined;

  return {
    id: job.job_token,
    prompt: getPrompt(job),
    modelLabel: getModelLabel(job),
    failureReason,
    failureMessage,
    status: job.status.status,
  };
}

function jobToGalleryItem(job: Job): GalleryItem | null {
  const result = job.maybe_result;
  if (!result?.entity_token) return null;

  const mediaType = getJobMediaType(job);

  return {
    id: result.entity_token,
    label: getPrompt(job) || "Generation",
    thumbnail: result.media_links?.cdn_url || null,
    fullImage: result.media_links?.cdn_url || null,
    createdAt:
      result.maybe_successfully_completed_at || job.updated_at,
    mediaClass: mediaType === "video" ? "video" : "image",
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGenerationJobs(options: {
  mediaType: "image" | "video";
}) {
  const { mediaType } = options;
  const apiRef = useRef(new JobsApi());

  const [inProgress, setInProgress] = useState<InProgressJob[]>([]);
  const [failed, setFailed] = useState<FailedJob[]>([]);
  const [newlyCompleted, setNewlyCompleted] = useState<GalleryItem[]>([]);

  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await apiRef.current.ListRecentJobs();
      if (!response.success || !response.data) return;

      const jobs: Job[] = response.data;

      // Filter by media type
      const filtered = jobs.filter((j) => getJobMediaType(j) === mediaType);

      // In-progress
      const inProg = filtered
        .filter((j) => IN_PROGRESS_STATUSES.has(j.status.status))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .map(jobToInProgress);

      // Failed
      const failedJobs = filtered
        .filter((j) => FAILED_STATUSES.has(j.status.status))
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime(),
        )
        .map(jobToFailed);

      // Completed
      const completedJobs = filtered.filter((j) =>
        COMPLETED_STATUSES.has(j.status.status),
      );
      const completedIdSet = new Set(completedJobs.map((j) => j.job_token));

      // Detect newly completed (skip on first load to avoid flooding)
      if (initialLoadDoneRef.current) {
        const newOnes = completedJobs.filter(
          (j) => !prevCompletedIdsRef.current.has(j.job_token),
        );
        if (newOnes.length > 0) {
          const items = newOnes
            .map(jobToGalleryItem)
            .filter((item): item is GalleryItem => item !== null);
          if (items.length > 0) {
            setNewlyCompleted((prev) => {
              // Deduplicate by id
              const existingIds = new Set(prev.map((i) => i.id));
              const fresh = items.filter((i) => !existingIds.has(i.id));
              return [...fresh, ...prev];
            });
          }
        }
      }
      initialLoadDoneRef.current = true;
      prevCompletedIdsRef.current = completedIdSet;

      // Prune duration cache
      const activeIds = new Set(inProg.map((t) => t.id));
      for (const id of taskDurationCache.keys()) {
        if (!activeIds.has(id)) taskDurationCache.delete(id);
      }

      setInProgress(inProg);
      setFailed(failedJobs);
    } catch {
      // ignore
    }
  }, [mediaType]);

  // Poll every 5 seconds + listen for task-queue-update events
  useEffect(() => {
    load();
    const intervalId = setInterval(load, 5000);

    const handleTaskUpdate = () => load();
    window.addEventListener("task-queue-update", handleTaskUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("task-queue-update", handleTaskUpdate);
    };
  }, [load]);

  const dismissFailed = useCallback(
    async (jobToken: string) => {
      try {
        await apiRef.current.DeleteJobByToken(jobToken);
        setFailed((prev) => prev.filter((f) => f.id !== jobToken));
      } catch {
        // ignore
      }
    },
    [],
  );

  return {
    inProgress,
    failed,
    newlyCompleted,
    dismissFailed,
    refresh: load,
  };
}
