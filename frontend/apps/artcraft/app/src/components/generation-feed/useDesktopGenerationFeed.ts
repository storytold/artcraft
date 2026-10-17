// useDesktopGenerationFeed: hook that builds the live feed of generations for the Generate Image and Generate Video pages
// (pages/PageImage/TextToImage.tsx and pages/PageVideo/ImageToVideo.tsx), which hand the result to DesktopGenerationGallery.
// Data sources: the Rust task queue (GetTaskQueue / MarkTaskAsDismissed from @storyteller/tauri-api), Tauri events
// (generation complete/failed) and a browser "task-queue-update" event that pages fire right after enqueueing.
// Prompt text and reference images for each task come from the localStorage cache in signaled/TopBar/taskEnqueueMeta.ts.

import { findDesktopModel , GetTaskQueue, MarkTaskAsDismissed } from "@storyteller/tauri-api";
import { useCallback, useEffect, useRef, useState } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { TaskQueueItem } from "@storyteller/tauri-api";
import {
  useTextToImageGenerationCompleteEvent,
  useVideoGenerationCompleteEvent,
} from "@storyteller/tauri-events";
import { MediaFilesApi } from "@storyteller/api";
import {
  getMediaStillThumbnail,
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

// How often (milliseconds) the task queue is re-read: every 5 seconds.
const POLL_INTERVAL_MS = 5000;

// Newly completed videos that arrived without a thumbnail URL are looked up
// again on this interval, for up to MISSING_THUMBNAIL_GIVE_UP_MS.
// Retry interval: 15_000 ms = 15 s.
const MISSING_THUMBNAIL_POLL_MS = 15_000;
// Stop retrying after 10 minutes (10 * 60_000 ms).
const MISSING_THUMBNAIL_GIVE_UP_MS = 10 * 60_000;

// Task statuses that count as "failed" (shown in the failed list) rather than pending or completed.
const FAILED_STATUSES = new Set([
  "complete_failure",
  "attempt_failed",
  "dead",
  "cancelled_by_user",
  "cancelled_by_provider",
  "cancelled_by_us",
]);

// Backend failure codes mapped to messages a user can read.
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

/**
 * Returns { inProgress, failed, newlyCompleted, dismissFailed, refresh }.
 * options.mediaType: which kind of task this page shows ("image" or "video"); other kinds are filtered out.
 * inProgress / failed come from the task queue; newlyCompleted holds items that finished while the page was open
 * (older history is loaded elsewhere from the gallery API); dismissFailed hides a failed task; refresh reloads now.
 */
export function useDesktopGenerationFeed(options: {
  mediaType: "image" | "video";
}) {
  const { mediaType } = options;
  // Refs (useRef) keep a value across renders without causing a re-render when it changes. This one holds a single MediaFilesApi instance.
  const mediaApiRef = useRef(new MediaFilesApi());

  const [inProgress, setInProgress] = useState<InProgressJob[]>([]);
  const [failed, setFailed] = useState<FailedJob[]>([]);
  const [newlyCompleted, setNewlyCompleted] = useState<GalleryItem[]>([]);

  // Snapshot per-task durations so the fake progress stays stable.
  const durationsRef = useRef<Map<string, number>>(new Map());
  // Ids of tasks that were already completed at the last load, to spot newly finished ones.
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  // False until the first load finishes; the first load does not report "newly completed" items.
  const initialLoadDoneRef = useRef(false);
  // Locally dismissed failed tasks — hides them until the server-side
  // dismissal lands in the next poll.
  const dismissedRef = useRef<Set<string>>(new Set());

  // Loads overlap (poll + Tauri events + local enqueue events). Only the most
  // recently started load may commit, so a slow older response can't overwrite
  // newer state (e.g. bring back a job that already finished or was dismissed).
  const loadSeqRef = useRef(0);

  // Read the task queue and update the three lists. Safe to call often: loadSeqRef numbers each call and only the
  // latest one is allowed to commit its results (see the note above loadSeqRef).
  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    try {
      const { tasks } = await GetTaskQueue();
      if (seq !== loadSeqRef.current) return;
      const filtered = tasks.filter(
        (t) => getTaskMediaType(t) === mediaType && !dismissedRef.current.has(t.id),
      );

      // Pending/started tasks, newest first, each turned into a progress card.
      const newInProgress = filtered
        .filter(
          (t) => t.task_status === "pending" || t.task_status === "started",
        )
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .map((t) => taskToInProgress(t, mediaType, durationsRef.current));

      // Failed or cancelled tasks, most recently updated first.
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
      // A newer load started while expanding; it will commit instead. Leaving
      // prevCompletedIdsRef untouched means it re-detects the same new tasks.
      if (seq !== loadSeqRef.current) return;
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

  // Newly completed videos occasionally arrive without a thumbnail URL (the
  // Rust media-file lookup fails open). The library copy would have it, but the
  // newly completed item takes precedence in the feed, so look it up again
  // until the URL shows up. GalleryThumbnail then re-checks the image itself.
  // A ref mirroring the latest newlyCompleted state, so the interval below can read current items
  // without restarting every time the list changes.
  const newlyCompletedRef = useRef(newlyCompleted);
  newlyCompletedRef.current = newlyCompleted;
  // When we first noticed each item had no thumbnail (item id -> timestamp), used to stop after the give-up time.
  const missingThumbnailSinceRef = useRef<Map<string, number>>(new Map());

  // Video pages only: every 15 s, look up thumbnails for completed videos that arrived without one.
  // The `running` flag prevents two rounds from overlapping; `cancelled` stops work after unmount.
  useEffect(() => {
    if (mediaType !== "video") return;
    let cancelled = false;
    let running = false;

    const lookUpMissingThumbnails = async () => {
      if (running) return; // A slow round is still going.
      running = true;
      try {
        await lookUpMissingThumbnailsOnce();
      } finally {
        running = false;
      }
    };

    // One round: for each item still missing a thumbnail (and younger than the give-up time), ask the backend for its media links.
    const lookUpMissingThumbnailsOnce = async () => {
      const now = Date.now();
      const missing = newlyCompletedRef.current.filter((item) => {
        if (item.thumbnail) return false;
        const since = missingThumbnailSinceRef.current.get(item.id) ?? now;
        missingThumbnailSinceRef.current.set(item.id, since);
        return now - since < MISSING_THUMBNAIL_GIVE_UP_MS;
      });
      for (const item of missing) {
        const response = await mediaApiRef.current.GetMediaFileByToken({
          mediaFileToken: item.id,
        });
        if (cancelled) return;
        const links = response.success
          ? response.data?.media_links
          : undefined;
        // Without a preview or template, getMediaThumbnail would fall back to
        // the .mp4 itself, which an <img> can't show. Try again next round.
        if (!links?.maybe_video_previews?.animated && !links?.maybe_thumbnail_template) {
          continue;
        }
        const thumbnail = getMediaThumbnail(links, "video", {
          size: THUMBNAIL_SIZES.LARGE,
        });
        const stillThumbnail = getMediaStillThumbnail(links, {
          size: THUMBNAIL_SIZES.LARGE,
        });
        setNewlyCompleted((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, thumbnail, stillThumbnail } : i,
          ),
        );
      }
    };

    const intervalId = setInterval(lookUpMissingThumbnails, MISSING_THUMBNAIL_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [mediaType]);

  // Poll + reload on Tauri generation events and local "task-queue-update"
  // dispatches (fired by the pages right after enqueueing).
  // Main loop. On mount: clear stale cache entries, load now, then poll every 5 s. Also reloads when the page fires
  // "task-queue-update" or the Rust side emits generation-complete/failed events. The cleanup removes every listener and timer.
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

  // Hide a failed task right away (local set + state), then tell the Rust side so it stays hidden after the next poll.
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

// Classify a task as "image", "video" or "other" from its task_type / model_type text.
// 3D objects and Gaussian splats (World Labs / Marble) count as "other" so they stay out of these feeds.
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

// Friendly "Model name · Provider" text for a task, falling back to whichever part is known.
function getTaskModelLabel(t: TaskQueueItem): string {
  const modelType = t.model_type ? String(t.model_type) : "";
  const modelDisplay = modelType ? findDesktopModel(modelType)?.fullName ?? getModelDisplayName(modelType) : undefined;
  const provider = t.provider
    ? getProviderDisplayName(String(t.provider).toLowerCase())
    : undefined;
  if (modelDisplay && provider) return `${modelDisplay} · ${provider}`;
  return modelDisplay || provider || "Unknown model";
}

// Turn a running task into a progress card. Progress is an estimate, not a real percentage: elapsed time divided by the model's
// typical duration, capped at 95% until the task really completes. Default duration if the model gives none:
// 900000 ms (15 min) for video, 30000 ms (30 s) for images.
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

// Turn a failed task into a card: a readable reason (from FAILURE_REASON_LABEL) plus the raw backend message when it is informative.
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
  // A completed task with no output file produces no gallery items.
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

  // Image tasks can generate several pictures in one batch; if so, fetch all siblings so every picture appears in the feed.
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
      .map((batchFile): GalleryItem | null => {
        // The batch endpoint returns the full media_links shape, which the shared MediaFile type under-describes.
        const links = batchFile.media_links as unknown as
          | {
              cdn_url?: string;
              maybe_thumbnail_template?: string | null;
              maybe_video_previews?: {
                animated?: string | null;
                still?: string | null;
                still_thumbnail_template?: string | null;
              } | null;
            }
          | undefined;
        const cdnUrl = links?.cdn_url;
        if (!cdnUrl) return null;
        const thumbnail = getMediaThumbnail(links, mediaType, {
          size: THUMBNAIL_SIZES.LARGE,
        });
        return {
          id: batchFile.token,
          label,
          thumbnail: thumbnail || cdnUrl,
          stillThumbnail:
            mediaType === "video"
              ? getMediaStillThumbnail(links, {
                  size: THUMBNAIL_SIZES.LARGE,
                })
              : null,
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
