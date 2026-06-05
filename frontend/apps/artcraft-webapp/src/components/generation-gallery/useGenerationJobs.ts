import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JobsApi, JobStatus, MediaFilesApi } from "@storyteller/api";
import type { Job, Prompts } from "@storyteller/api";
import { getMediaThumbnail, THUMBNAIL_SIZES } from "@storyteller/common";
import {
  getModelDisplayName,
  getProviderDisplayName,
  ALL_MODELS_LIST,
} from "@storyteller/model-list";
import type { GalleryItem } from "./useGalleryData";
import { getCachedPrompt, usePrompts } from "../../lib/prompts-cache";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InProgressJob {
  id: string;
  prompt: string;
  modelId: string;
  modelLabel: string;
  progress: number;
  estimatedTimeLeftMs?: number;
  createdAt: string;
  batchCount?: number;
}

export interface FailedJob {
  id: string;
  prompt: string;
  modelId: string;
  modelLabel: string;
  failureReason?: string;
  failureMessage?: string;
  status: string;
  createdAt: string;
  promptToken?: string;
  refImageUrl?: string;
  mediaClass: "image" | "video";
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

function getModelLabel(job: Job, promptsMap?: Map<string, Prompts>): string {
  const promptToken = job.request.maybe_prompt_token;
  const cachedPrompt = promptToken
    ? (promptsMap?.get(promptToken) ?? getCachedPrompt(promptToken))
    : undefined;

  const modelType =
    cachedPrompt?.maybe_model_type ?? job.request.maybe_model_type ?? "";
  const providerKey = cachedPrompt?.maybe_generation_provider ?? modelType;

  const modelDisplay = modelType ? getModelDisplayName(modelType) : undefined;
  const provider = providerKey
    ? getProviderDisplayName(providerKey.toLowerCase())
    : undefined;

  if (modelDisplay && provider) return `${modelDisplay} · ${provider}`;
  return modelDisplay || provider || "Unknown model";
}

function getPrompt(job: Job, promptsMap?: Map<string, Prompts>): string {
  const promptToken = job.request.maybe_prompt_token;
  const cached = promptToken
    ? (promptsMap?.get(promptToken) ?? getCachedPrompt(promptToken))
    : undefined;
  return (
    cached?.maybe_positive_prompt || job.request.maybe_raw_inference_text || ""
  );
}

function getModelId(job: Job, promptsMap?: Map<string, Prompts>): string {
  const promptToken = job.request.maybe_prompt_token;
  const cachedPrompt = promptToken
    ? (promptsMap?.get(promptToken) ?? getCachedPrompt(promptToken))
    : undefined;
  return cachedPrompt?.maybe_model_type ?? job.request.maybe_model_type ?? "";
}

function jobToInProgress(
  job: Job,
  promptsMap: Map<string, Prompts>,
): InProgressJob {
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
    duration = model?.progressBarTime ?? (isVideo ? 900000 : 30000);
    taskDurationCache.set(job.job_token, duration);
  }

  const elapsed = now - createdMs;
  const progress = Math.min(95, (elapsed / duration) * 100);
  const estimatedTimeLeftMs = Math.max(0, duration - elapsed);

  return {
    id: job.job_token,
    prompt: getPrompt(job, promptsMap),
    modelId: getModelId(job, promptsMap),
    modelLabel: getModelLabel(job, promptsMap),
    progress,
    estimatedTimeLeftMs,
    createdAt: job.created_at,
  };
}

function jobToFailed(job: Job, promptsMap: Map<string, Prompts>): FailedJob {
  const failureCategory =
    job.status.maybe_failure_category_updated ||
    job.status.maybe_failure_category;
  const rawMessage =
    job.status.maybe_failure_message ||
    job.status.maybe_extra_status_description;
  const failureReason = failureCategory
    ? FAILURE_REASON_LABEL[failureCategory] || rawMessage || undefined
    : rawMessage || undefined;
  const failureMessage =
    rawMessage && failureCategory !== "unknown" ? rawMessage : undefined;

  const promptToken = job.request.maybe_prompt_token ?? undefined;
  const promptData = promptToken ? promptsMap.get(promptToken) : undefined;
  const refImageUrl = pickFirstRefImageUrl(promptData);
  const inferred = getJobMediaType(job);
  const mediaClass: "image" | "video" =
    inferred === "video" ? "video" : "image";

  return {
    id: job.job_token,
    prompt: getPrompt(job, promptsMap),
    modelId: getModelId(job, promptsMap),
    modelLabel: getModelLabel(job, promptsMap),
    failureReason,
    failureMessage,
    status: job.status.status,
    createdAt: job.created_at,
    promptToken,
    refImageUrl,
    mediaClass,
  };
}

// Semantics that aren't still images — videos and audio clips can't be rendered
// as the faded backdrop behind the error state, so skip them when picking the
// reference to display.
const NON_IMAGE_REF_SEMANTICS = new Set(["vid_ref", "audioref"]);

function pickFirstRefImageUrl(
  promptData: Prompts | undefined,
): string | undefined {
  const refs = promptData?.maybe_context_images;
  if (!refs?.length) return undefined;
  for (const ref of refs) {
    if (NON_IMAGE_REF_SEMANTICS.has(ref.semantic)) continue;
    const url = ref.media_links?.cdn_url;
    if (url) return url;
  }
  return undefined;
}

function jobToGalleryItem(
  job: Job,
  promptsMap?: Map<string, Prompts>,
): GalleryItem | null {
  const result = job.maybe_result;
  if (!result?.entity_token) return null;

  const mediaType = getJobMediaType(job);
  const mediaClass = mediaType === "video" ? "video" : "image";
  const thumbnail = getMediaThumbnail(result.media_links, mediaClass, {
    size: THUMBNAIL_SIZES.LARGE,
  });

  return {
    id: result.entity_token,
    label: getPrompt(job, promptsMap) || "Generation",
    thumbnail,
    fullImage: result.media_links?.cdn_url || null,
    // Sort by job creation time (not completion time) so the completed card
    // occupies the same Masonry slot the pending card held — no layout shift.
    createdAt: job.created_at,
    mediaClass,
    modelId: job.request.maybe_model_type ?? undefined,
  };
}

/** Expand a single GalleryItem into its batch siblings (if any). */
async function expandBatchItems(
  item: GalleryItem,
  mediaFilesApi: MediaFilesApi,
): Promise<GalleryItem[]> {
  try {
    const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
      mediaFileToken: item.id,
    });
    const batchToken = (mediaResponse.data as any)?.maybe_batch_token;
    if (!batchToken) return [item];

    const batchResponse = await mediaFilesApi.GetMediaFilesByBatchToken({
      batchToken,
    });
    if (!batchResponse.success || !batchResponse.data?.length) return [item];

    return batchResponse.data
      .map((file: any): GalleryItem | null => {
        const cdnUrl = file.media_links?.cdn_url;
        if (!cdnUrl) return null;
        const thumbnail = getMediaThumbnail(file.media_links, item.mediaClass, {
          size: THUMBNAIL_SIZES.LARGE,
        });
        return {
          id: file.token,
          label: item.label,
          thumbnail: thumbnail || cdnUrl,
          fullImage: cdnUrl,
          createdAt: item.createdAt,
          mediaClass: item.mediaClass,
          modelId: item.modelId,
          batchImageToken: batchToken,
        };
      })
      .filter((i): i is GalleryItem => i !== null);
  } catch {
    return [item];
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGenerationJobs(options: {
  mediaType: "image" | "video";
  enabled?: boolean;
}) {
  const { mediaType, enabled = true } = options;
  const apiRef = useRef(new JobsApi());
  const mediaApiRef = useRef(new MediaFilesApi());

  const [inProgressJobs, setInProgressJobs] = useState<Job[]>([]);
  const [failedJobsRaw, setFailedJobsRaw] = useState<Job[]>([]);
  const [newlyCompleted, setNewlyCompleted] = useState<GalleryItem[]>([]);

  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const promptTokens = useMemo(() => {
    const tokens: string[] = [];
    for (const j of inProgressJobs) {
      if (j.request.maybe_prompt_token)
        tokens.push(j.request.maybe_prompt_token);
    }
    for (const j of failedJobsRaw) {
      if (j.request.maybe_prompt_token)
        tokens.push(j.request.maybe_prompt_token);
    }
    return tokens;
  }, [inProgressJobs, failedJobsRaw]);
  const promptsMap = usePrompts(promptTokens);

  const inProgress = useMemo(
    () =>
      inProgressJobs
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .map((j) => jobToInProgress(j, promptsMap)),
    [inProgressJobs, promptsMap],
  );

  const failed = useMemo(
    () =>
      failedJobsRaw
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .map((j) => jobToFailed(j, promptsMap)),
    [failedJobsRaw, promptsMap],
  );

  const load = useCallback(async () => {
    try {
      const response = await apiRef.current.ListRecentJobs();
      if (!response.success || !response.data) return;

      const jobs: Job[] = response.data;

      // Filter by media type
      const filtered = jobs.filter((j) => getJobMediaType(j) === mediaType);

      const newInProgress = filtered.filter((j) =>
        IN_PROGRESS_STATUSES.has(j.status.status),
      );
      const newFailed = filtered.filter((j) =>
        FAILED_STATUSES.has(j.status.status),
      );

      // Completed
      const completedJobs = filtered.filter((j) =>
        COMPLETED_STATUSES.has(j.status.status),
      );
      const completedIdSet = new Set(completedJobs.map((j) => j.job_token));

      // Detect newly completed (skip on first load to avoid flooding)
      let expandedNewItems: GalleryItem[] = [];
      if (initialLoadDoneRef.current) {
        const newOnes = completedJobs.filter(
          (j) => !prevCompletedIdsRef.current.has(j.job_token),
        );
        if (newOnes.length > 0) {
          const items = newOnes
            .map((j) => jobToGalleryItem(j))
            .filter((item): item is GalleryItem => item !== null);
          if (items.length > 0) {
            // Await expansion so the pending card and its completed replacement
            // commit in the same React render — no "remove then add" gap.
            const expanded = await Promise.all(
              items.map((item) => expandBatchItems(item, mediaApiRef.current)),
            );
            expandedNewItems = expanded.flat();
          }
        }
      }
      initialLoadDoneRef.current = true;
      prevCompletedIdsRef.current = completedIdSet;

      // Prune duration cache
      const activeIds = new Set(newInProgress.map((j) => j.job_token));
      for (const id of taskDurationCache.keys()) {
        if (!activeIds.has(id)) taskDurationCache.delete(id);
      }

      if (expandedNewItems.length > 0) {
        setNewlyCompleted((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const fresh = expandedNewItems.filter((i) => !existingIds.has(i.id));
          return [...fresh, ...prev];
        });
      }
      setInProgressJobs(newInProgress);
      setFailedJobsRaw(newFailed);
    } catch {
      // ignore
    }
  }, [mediaType]);

  // Poll every 5 seconds + listen for task-queue-update events.
  // Skip entirely when disabled (e.g. user is logged out) — otherwise we'd
  // hit an authenticated endpoint every 5s for nothing, which on mobile
  // Safari shows up as periodic main-thread jank during the menu animation.
  useEffect(() => {
    if (!enabled) return;
    load();
    const intervalId = setInterval(load, 5000);

    const handleTaskUpdate = () => load();
    window.addEventListener("task-queue-update", handleTaskUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("task-queue-update", handleTaskUpdate);
    };
  }, [load, enabled]);

  const dismissFailed = useCallback(async (jobToken: string) => {
    try {
      await apiRef.current.DeleteJobByToken(jobToken);
      setFailedJobsRaw((prev) => prev.filter((f) => f.job_token !== jobToken));
    } catch {
      // ignore
    }
  }, []);

  return {
    inProgress,
    failed,
    newlyCompleted,
    dismissFailed,
    refresh: load,
  };
}
