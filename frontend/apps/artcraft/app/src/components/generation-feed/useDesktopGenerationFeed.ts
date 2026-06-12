import { useCallback, useEffect, useRef, useState } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { GetTaskQueue, MarkTaskAsDismissed } from "@storyteller/tauri-api";
import type { TaskQueueItem } from "@storyteller/tauri-api";
import {
  useTextToImageGenerationCompleteEvent,
  useVideoGenerationCompleteEvent,
} from "@storyteller/tauri-events";
import { MediaFilesApi } from "@storyteller/api";
import {
  getMediaThumbnail,
  getThumbnailUrl,
  THUMBNAIL_SIZES,
} from "@storyteller/common";
import {
  ALL_MODELS_LIST,
  getModelDisplayName,
  getProviderDisplayName,
} from "@storyteller/model-list";
import type {
  FailedJob,
  GalleryItem,
  InProgressJob,
} from "@storyteller/ui-generation-list";
import {
  getMetaForTask,
  cleanupOldEntries,
} from "../signaled/TopBar/taskEnqueueMeta";

// Desktop twin of the webapp's useGenerationJobs: feeds the shared
// GenerationListView from the Tauri task queue instead of JobsApi. Polls every
// 5s and reloads instantly on Tauri generation events / local enqueues.

const POLL_INTERVAL_MS = 5000;

const FAILED_STATUSES = new Set([
  "complete_failure",
  "attempt_failed",
  "dead",
  "cancelled_by_user",
  "cancelled_by_provider",
  "cancelled_by_us",
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

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDesktopGenerationFeed(options: {
  mediaType: "image" | "video";
}) {
  const { mediaType } = options;
  const mediaApiRef = useRef(new MediaFilesApi());

  const [inProgress, setInProgress] = useState<InProgressJob[]>([]);
  const [failed, setFailed] = useState<FailedJob[]>([]);
  const [newlyCompleted, setNewlyCompleted] = useState<GalleryItem[]>([]);

  // Snapshot per-task durations so the fake progress stays stable.
  const durationsRef = useRef<Map<string, number>>(new Map());
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  // Locally dismissed failed tasks — hides them until the server-side
  // dismissal lands in the next poll.
  const dismissedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const { tasks } = await GetTaskQueue();
      const filtered = tasks.filter(
        (t) => getTaskMediaType(t) === mediaType && !dismissedRef.current.has(t.id),
      );

      const newInProgress = filtered
        .filter(
          (t) => t.task_status === "pending" || t.task_status === "started",
        )
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .map((t) => taskToInProgress(t, mediaType, durationsRef.current));

      const newFailed = filtered
        .filter((t) => FAILED_STATUSES.has(String(t.task_status)))
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
        .map((t) => taskToFailed(t, mediaType));

      const completedTasks = filtered.filter(
        (t) => String(t.task_status) === "complete_success",
      );
      const completedIdSet = new Set(completedTasks.map((t) => t.id));

      // Detect newly completed (skip on first load to avoid flooding —
      // history comes from the gallery API instead).
      let expandedNewItems: GalleryItem[] = [];
      if (initialLoadDoneRef.current) {
        const newOnes = completedTasks.filter(
          (t) => !prevCompletedIdsRef.current.has(t.id),
        );
        if (newOnes.length > 0) {
          // Await expansion so the pending row and its completed replacement
          // commit in the same React render — no "remove then add" gap.
          const expanded = await Promise.all(
            newOnes.map((t) =>
              taskToGalleryItems(t, mediaType, mediaApiRef.current),
            ),
          );
          expandedNewItems = expanded.flat();
        }
      }
      initialLoadDoneRef.current = true;
      prevCompletedIdsRef.current = completedIdSet;

      // Prune duration snapshots for tasks no longer in progress.
      const activeIds = new Set(newInProgress.map((j) => j.id));
      for (const id of Array.from(durationsRef.current.keys())) {
        if (!activeIds.has(id)) durationsRef.current.delete(id);
      }

      if (expandedNewItems.length > 0) {
        setNewlyCompleted((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const fresh = expandedNewItems.filter((i) => !existingIds.has(i.id));
          return [...fresh, ...prev];
        });
      }
      setInProgress(newInProgress);
      setFailed(newFailed);
    } catch {
      // ignore — next poll retries
    }
  }, [mediaType]);

  /** Prepend completed items (deduped) ahead of the next poll. */
  const addCompletedItems = useCallback((items: GalleryItem[]) => {
    if (items.length === 0) return;
    setNewlyCompleted((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const fresh = items.filter((i) => !existingIds.has(i.id));
      if (fresh.length === 0) return prev;
      return [...fresh, ...prev];
    });
  }, []);

  // Push-style completion: the Rust backend emits typed completion events
  // carrying the generated media inline, so results appear instantly instead
  // of waiting on the next task-queue poll. The follow-up load() reconciles
  // the pending chip; the poll's own newly-completed detection dedupes by
  // media token against these. NB: the tauri-events hooks subscribe once on
  // mount, so the callbacks must only capture stable values (mediaType is a
  // constant per page; addCompletedItems/load are stable).
  useTextToImageGenerationCompleteEvent(async (event) => {
    if (mediaType !== "image" || !event.generated_images?.length) return;
    const createdAt = new Date().toISOString();
    addCompletedItems(
      event.generated_images.map((img) => ({
        id: img.media_token,
        label: "Image Generation",
        thumbnail:
          getThumbnailUrl(img.maybe_thumbnail_template, {
            width: THUMBNAIL_SIZES.LARGE,
          }) ?? img.cdn_url,
        fullImage: img.cdn_url,
        createdAt,
        mediaClass: "image",
      })),
    );
    load();
  });

  useVideoGenerationCompleteEvent(async (event) => {
    if (mediaType !== "video" || !event.generated_video) return;
    const video = event.generated_video;
    addCompletedItems([
      {
        id: video.media_token,
        label: "Video Generation",
        thumbnail:
          getThumbnailUrl(video.maybe_thumbnail_template, {
            width: THUMBNAIL_SIZES.LARGE,
          }) ?? null,
        fullImage: video.cdn_url,
        createdAt: new Date().toISOString(),
        mediaClass: "video",
      },
    ]);
    load();
  });

  // Poll + reload on Tauri generation events and local "task-queue-update"
  // dispatches (fired by the pages right after enqueueing).
  useEffect(() => {
    cleanupOldEntries();
    load();
    const intervalId = setInterval(load, POLL_INTERVAL_MS);

    const handleTaskUpdate = () => load();
    window.addEventListener("task-queue-update", handleTaskUpdate);

    let cancelled = false;
    const unlistenComplete: Promise<UnlistenFn> = listen(
      "generation-complete-event",
      () => {
        if (!cancelled) load();
      },
    );
    const unlistenFailed: Promise<UnlistenFn> = listen(
      "generation-failed-event",
      () => {
        if (!cancelled) load();
      },
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("task-queue-update", handleTaskUpdate);
      unlistenComplete.then((f) => f());
      unlistenFailed.then((f) => f());
    };
  }, [load]);

  const dismissFailed = useCallback(async (taskId: string) => {
    dismissedRef.current.add(taskId);
    setFailed((prev) => prev.filter((f) => f.id !== taskId));
    try {
      await MarkTaskAsDismissed(taskId);
    } catch {
      // ignore — the local filter already hides it
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

// ── Task mapping helpers ────────────────────────────────────────────────────

function getTaskMediaType(t: TaskQueueItem): "image" | "video" | "other" {
  const taskTypeStr = t.task_type ? String(t.task_type).toLowerCase() : "";
  const modelTypeStr = t.model_type ? String(t.model_type).toLowerCase() : "";
  const isSplat =
    taskTypeStr.includes("gaussian") ||
    modelTypeStr.includes("marble") ||
    modelTypeStr.includes("worldlabs");
  const is3D =
    taskTypeStr.includes("3d") ||
    taskTypeStr.includes("object") ||
    taskTypeStr.includes("dimensional") ||
    isSplat;
  if (is3D) return "other";
  if (taskTypeStr.includes("video")) return "video";
  if (taskTypeStr.includes("image")) return "image";
  return "other";
}

function getTaskModelLabel(t: TaskQueueItem): string {
  const modelType = t.model_type ? String(t.model_type) : "";
  const modelDisplay = modelType ? getModelDisplayName(modelType) : undefined;
  const provider = t.provider
    ? getProviderDisplayName(String(t.provider).toLowerCase())
    : undefined;
  if (modelDisplay && provider) return `${modelDisplay} · ${provider}`;
  return modelDisplay || provider || "Unknown model";
}

function taskToInProgress(
  t: TaskQueueItem,
  mediaType: "image" | "video",
  durations: Map<string, number>,
): InProgressJob {
  const now = Date.now();
  const createdMs = t.created_at.getTime();

  let duration = durations.get(t.id);
  if (!duration) {
    const model = t.model_type
      ? ALL_MODELS_LIST.find(
          (m) =>
            m.tauriId === String(t.model_type) || m.id === String(t.model_type),
        )
      : undefined;
    duration =
      model?.progressBarTime ?? (mediaType === "video" ? 900000 : 30000);
    durations.set(t.id, duration);
  }

  const elapsed = now - createdMs;
  const progress = Math.min(95, Math.max(0, (elapsed / duration) * 100));
  const meta = getMetaForTask(
    t.id,
    t.model_type ? String(t.model_type) : undefined,
    createdMs,
  );

  return {
    id: t.id,
    prompt: meta?.prompt ?? "",
    modelId: t.model_type ? String(t.model_type) : "",
    modelLabel: getTaskModelLabel(t),
    progress,
    estimatedTimeLeftMs: Math.max(0, duration - elapsed),
    createdAt: t.created_at.toISOString(),
    // One image task can produce a whole batch — surface the requested count
    // so the pending chip reads "Generating N images".
    batchCount: meta?.batchCount,
    mediaClass: mediaType,
  };
}

function taskToFailed(
  t: TaskQueueItem,
  mediaType: "image" | "video",
): FailedJob {
  const fr = t.failure_reason;
  const failureReason = fr
    ? FAILURE_REASON_LABEL[fr.failure_type] || fr.failure_message || undefined
    : undefined;
  const failureMessage =
    fr?.failure_message && fr.failure_type !== "unknown"
      ? fr.failure_message
      : undefined;
  const meta = getMetaForTask(
    t.id,
    t.model_type ? String(t.model_type) : undefined,
    t.created_at.getTime(),
  );

  return {
    id: t.id,
    prompt: meta?.prompt ?? "",
    modelId: t.model_type ? String(t.model_type) : "",
    modelLabel: getTaskModelLabel(t),
    failureReason,
    failureMessage,
    status: String(t.task_status),
    createdAt: t.created_at.toISOString(),
    refImageUrl: meta?.refImageUrls?.[0],
    mediaClass: mediaType,
  };
}

/** Map a completed task to its GalleryItem(s), expanding batch siblings. */
async function taskToGalleryItems(
  t: TaskQueueItem,
  mediaType: "image" | "video",
  mediaFilesApi: MediaFilesApi,
): Promise<GalleryItem[]> {
  const file = t.completed_item?.primary_media_file;
  if (!file) return [];

  const meta = getMetaForTask(
    t.id,
    t.model_type ? String(t.model_type) : undefined,
    t.created_at.getTime(),
  );
  const label =
    meta?.prompt ||
    (mediaType === "video" ? "Video Generation" : "Image Generation");
  const modelId = t.model_type ? String(t.model_type) : undefined;
  // Sort by task creation time (not completion time) so the completed row
  // occupies the same slot the pending row held — no layout shift.
  const createdAt = t.created_at.toISOString();

  const primary: GalleryItem = {
    id: file.token,
    label,
    thumbnail:
      getThumbnailUrl(file.maybe_thumbnail_url_template, {
        width: THUMBNAIL_SIZES.LARGE,
      }) ?? null,
    fullImage: file.cdn_url || null,
    createdAt,
    mediaClass: mediaType,
    modelId,
    batchImageToken: t.completed_item?.maybe_batch_token,
  };

  const batchToken = t.completed_item?.maybe_batch_token;
  if (!batchToken) return [primary];

  try {
    const batchResponse = await mediaFilesApi.GetMediaFilesByBatchToken({
      batchToken,
    });
    if (!batchResponse.success || !batchResponse.data?.length) {
      return [primary];
    }
    return batchResponse.data
      .map((batchFile: any): GalleryItem | null => {
        const cdnUrl = batchFile.media_links?.cdn_url;
        if (!cdnUrl) return null;
        const thumbnail = getMediaThumbnail(batchFile.media_links, mediaType, {
          size: THUMBNAIL_SIZES.LARGE,
        });
        return {
          id: batchFile.token,
          label,
          thumbnail: thumbnail || cdnUrl,
          fullImage: cdnUrl,
          createdAt,
          mediaClass: mediaType,
          modelId,
          batchImageToken: batchToken,
        };
      })
      .filter((i): i is GalleryItem => i !== null);
  } catch {
    return [primary];
  }
}
