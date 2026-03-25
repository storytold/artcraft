import { Tooltip } from "@storyteller/ui-tooltip";
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListCheck,
  faSpinnerThird,
  faXmark,
  faTrashAlt,
  faTasks,
  faBroom,
  faBomb,
  faCircleExclamation,
  faTriangleExclamation,
} from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import {
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxImage,
} from "@storyteller/ui-gallery-modal";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GetTaskQueue,
  MarkTaskAsDismissed,
  TasksNukeAll,
} from "@storyteller/tauri-api";
import type { TaskQueueItem } from "@storyteller/tauri-api";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import {
  useSelectedImageModel,
  useSelectedVideoModel,
  ModelPage,
} from "@storyteller/ui-model-selector";
import { Button } from "@storyteller/ui-button";
import {
  getProviderDisplayName,
  ALL_MODELS_LIST,
  getModelDisplayName,
} from "@storyteller/model-list";
import { CloseButton } from "@storyteller/ui-close-button";
import { ActionReminderModal } from "@storyteller/ui-action-reminder-modal";
import { TaskMediaFileClass } from "@storyteller/api-enums";
import {
  getThumbnailUrl,
  THUMBNAIL_SIZES,
  getPlaceholderForMediaClass,
} from "@storyteller/common";
import { coverImageCache } from "~/pages/PageImageTo3DObject/ImageTo3DStore";
import { useCreditsState } from "@storyteller/credits";
import { getMetaForTask, cleanupOldEntries } from "./taskEnqueueMeta";

type InProgressTask = {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  updatedAt?: Date;
  canDismiss?: boolean;
  estimatedTimeLeftMs?: number;
  modelType?: string;
  prompt?: string;
  refImageUrls?: string[];
};

type CompletedTask = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  completedAt?: Date;
  updatedAt?: Date;
  imageUrls?: string[];
  mediaTokens?: string[];
  mediaFileClass?: TaskMediaFileClass;
  batchImageToken?: string;
  prompt?: string;
};

type FailedTask = {
  id: string;
  title: string;
  subtitle?: string;
  failedAt?: Date;
  status: string;
  failureReason?: string;
  failureMessage?: string;
  prompt?: string;
  refImageUrls?: string[];
};

const formatTimeLeft = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0 && minutes > 0) return `~ ${hours}h ${minutes}m left`;
  if (hours > 0) return `~ ${hours}h left`;
  if (minutes > 0) return `~ ${minutes}m left`;
  return `~ ${seconds}s left`;
};

const InProgressCard = ({
  task,
  onDismiss,
}: {
  task: InProgressTask;
  onDismiss?: () => void;
}) => {
  const progressPercent = Math.max(0, Math.min(100, Math.round(task.progress)));
  const isAlmostDone = task.progress >= 95;
  const timeLabel = isAlmostDone
    ? "Almost done..."
    : task.estimatedTimeLeftMs != null && task.estimatedTimeLeftMs > 0
      ? formatTimeLeft(task.estimatedTimeLeftMs)
      : null;
  const isSeedance2 = task.modelType === "seedance_2p0";
  const hasRefImages =
    task.refImageUrls && task.refImageUrls.length > 0;

  const thumbnailContent = hasRefImages ? (
    <Tooltip
      content={task.prompt || ""}
      position="bottom"
      strategy="fixed"
      className="max-w-[320px] text-wrap text-xs"
      zIndex={50}
      delay={200}
      disabled={!task.prompt}
    >
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded">
        <img
          src={task.refImageUrls![0]}
          alt="Reference"
          className="h-full w-full object-cover opacity-50"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-white/80"
            size="lg"
          />
        </div>
        {task.refImageUrls!.length > 1 && (
          <div className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] text-white/80">
            +{task.refImageUrls!.length - 1}
          </div>
        )}
      </div>
    </Tooltip>
  ) : (
    <Tooltip
      content={task.prompt || ""}
      position="bottom"
      strategy="fixed"
      className="max-w-[320px] text-wrap text-xs"
      zIndex={50}
      delay={200}
      disabled={!task.prompt}
    >
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded bg-ui-controls">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-base-fg/60"
          size="lg"
        />
      </div>
    </Tooltip>
  );

  return (
    <div className="rounded-md p-2 transition-colors hover:bg-ui-controls/40">
      <div className="flex items-center gap-2.5">
        {thumbnailContent}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 truncate font-medium text-base-fg/90">
              {task.title}
              {isSeedance2 && (
                <Tooltip
                  content="Seedance 2.0 is in Early Alpha. Generations may be slow and may experience outages."
                  position="top"
                  strategy="fixed"
                  className="w-[200px] text-wrap bg-yellow-400/60 backdrop-blur-3xl"
                  zIndex={50}
                  delay={100}
                >
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="h-3 w-3 shrink-0 text-yellow-400/60 transition-all hover:text-yellow-400"
                  />
                </Tooltip>
              )}
            </div>
            <div className="ml-2 shrink-0 text-xs tabular-nums text-base-fg/60">
              {progressPercent}%
            </div>
          </div>
          {task.subtitle && (
            <div className="mt-0.5 truncate text-xs text-base-fg opacity-60">
              {task.subtitle}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 rounded bg-ui-controls">
              <div
                className="h-1.5 rounded bg-brand-primary-400"
                style={{
                  width: `${Math.max(0, Math.min(100, task.progress))}%`,
                }}
              />
            </div>
          </div>
          {timeLabel && (
            <div className="mt-1 text-xs text-base-fg/50">{timeLabel}</div>
          )}
        </div>
        {onDismiss && (
          <button
            className="ml-auto h-6 w-6 rounded-full p-1 text-base-fg/60 hover:bg-ui-controls"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
    </div>
  );
};

const CompletedCard = ({
  task,
  onClick,
  onDismiss,
}: {
  task: CompletedTask;
  onClick?: () => void;
  onDismiss?: () => void;
}) => {
  return (
    <div
      className="flex cursor-pointer items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-ui-controls/40"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <Tooltip
        content={task.prompt || ""}
        position="bottom"
        strategy="fixed"
        className="max-w-[320px] text-wrap text-xs"
        zIndex={50}
        delay={200}
        disabled={!task.prompt}
      >
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded bg-ui-controls">
          {task.thumbnailUrl ? (
            <img
              src={task.thumbnailUrl}
              alt={task.title}
              onError={(e) => {
                e.currentTarget.src = getPlaceholderForMediaClass(
                  task.mediaFileClass,
                );
                e.currentTarget.style.opacity = "0.3";
                // Set the `data-brokenurl` property for debugging the broken images:
                (e.currentTarget as HTMLImageElement).dataset.brokenurl =
                  task.thumbnailUrl;
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-base-fg/40">
              Done
            </div>
          )}
        </div>
      </Tooltip>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-base-fg/90">
          {task.title}
        </div>
        {task.subtitle && (
          <div className="mt-0.5 truncate text-xs text-base-fg opacity-60">
            {task.subtitle}
          </div>
        )}
        {task.completedAt && (
          <div className="text-xs text-base-fg opacity-60">
            {task.completedAt.toISOString()}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          className="ml-auto h-6 w-6 rounded-full p-1 text-base-fg/60 hover:bg-ui-controls"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  );
};

const FAILED_STATUS_LABEL: Record<string, string> = {
  complete_failure: "Failed",
  attempt_failed: "Failed",
  dead: "Failed",
  cancelled_by_user: "Cancelled",
  cancelled_by_provider: "Cancelled by provider",
  cancelled_by_us: "Cancelled",
};

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

const FailedCard = ({
  task,
  onDismiss,
}: {
  task: FailedTask;
  onDismiss?: () => void;
}) => {
  const statusLabel = FAILED_STATUS_LABEL[task.status] || "Failed";
  const hasRefImages =
    task.refImageUrls && task.refImageUrls.length > 0;

  const thumbnailContent = hasRefImages ? (
    <Tooltip
      content={task.prompt || ""}
      position="bottom"
      strategy="fixed"
      className="max-w-[320px] text-wrap text-xs"
      zIndex={50}
      delay={200}
      disabled={!task.prompt}
    >
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded">
        <img
          src={task.refImageUrls![0]}
          alt="Reference"
          className="h-full w-full object-cover opacity-50"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-red-900/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="text-red-400"
            size="lg"
          />
        </div>
        {task.refImageUrls!.length > 1 && (
          <div className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] text-white/80">
            +{task.refImageUrls!.length - 1}
          </div>
        )}
      </div>
    </Tooltip>
  ) : (
    <Tooltip
      content={task.prompt || ""}
      position="bottom"
      strategy="fixed"
      className="max-w-[320px] text-wrap text-xs"
      zIndex={50}
      delay={200}
      disabled={!task.prompt}
    >
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded bg-red-500/10">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-red-400"
          size="lg"
        />
      </div>
    </Tooltip>
  );

  return (
    <div className="rounded-md p-2 transition-colors hover:bg-ui-controls/40">
      <div className="flex items-center gap-2.5">
        {thumbnailContent}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="truncate font-medium text-base-fg/90">
              {task.title}
            </div>
          </div>
          {task.subtitle && (
            <div className="mt-0.5 truncate text-xs text-base-fg opacity-60">
              {task.subtitle}
            </div>
          )}
          <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
            <span className="shrink-0 rounded bg-red-500/15 px-1.5 py-0 text-[11px] font-medium text-red-400">
              {statusLabel}
            </span>
            {task.failureReason && (
              <div className="min-w-0 overflow-hidden">
                <Tooltip
                  content={task.failureReason}
                  position="bottom"
                  strategy="fixed"
                  className="max-w-[280px] text-wrap bg-danger text-xs"
                  zIndex={50}
                  delay={300}
                >
                  <div className="truncate text-[11px] text-red-400/60">
                    {task.failureReason}
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
          {task.failureMessage && (
            <div className="overflow-hidden">
              <Tooltip
                content={task.failureMessage}
                position="bottom"
                strategy="fixed"
                className="max-w-[280px] text-wrap text-xs"
                zIndex={50}
                delay={200}
              >
                <div className="mt-0.5 cursor-default truncate text-[11px] text-base-fg/40">
                  {task.failureMessage}
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            className="ml-auto h-6 w-6 rounded-full p-1 text-base-fg/60 hover:bg-ui-controls"
            aria-label="Dismiss"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
    </div>
  );
};

export const TaskQueue = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [inProgress, setInProgress] = useState<InProgressTask[]>([]);
  const [completed, setCompleted] = useState<CompletedTask[]>([]);
  const [failed, setFailed] = useState<FailedTask[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(() => {
    const stored = localStorage.getItem("taskQueueLastReadAt");
    return stored ? parseInt(stored, 10) : 0;
  });

  // remove unread state; unread tracking handled via IDs below
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [unreadCompletedIds, setUnreadCompletedIds] = useState<string[]>([]);
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  // Confirmation state
  const [confirmationConfig, setConfirmationConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    primaryActionText: string;
    primaryActionIcon: any;
    primaryActionBtnClassName: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: null,
    primaryActionText: "",
    primaryActionIcon: faTrashAlt,
    primaryActionBtnClassName: "",
    onConfirm: async () => { },
  });

  const handleClearCompleted = (onSuccess?: () => void) => {
    setConfirmationConfig({
      isOpen: true,
      title: "Clear completed tasks?",
      message: (
        <span className="text-sm text-white/80">
          This will remove all completed tasks from the task queue.
        </span>
      ),
      primaryActionText: "Clear completed",
      primaryActionIcon: faBroom,
      primaryActionBtnClassName:
        "bg-green-500/10 hover:bg-green-500/20 text-green-500",
      onConfirm: async () => {
        await dismissCompleted();
        if (onSuccess) onSuccess();
      },
    });
  };

  const handleClearStale = () => {
    setConfirmationConfig({
      isOpen: true,
      title: "Clear stale tasks?",
      message: (
        <span className="text-sm text-white/80">
          This will remove all stale/stuck in-progress tasks from the queue.
        </span>
      ),
      primaryActionText: "Clear stale",
      primaryActionIcon: faTrashAlt,
      primaryActionBtnClassName:
        "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500",
      onConfirm: async () => {
        await dismissStale();
      },
    });
  };

  const handleClearFailed = () => {
    setConfirmationConfig({
      isOpen: true,
      title: "Clear failed tasks?",
      message: (
        <span className="text-sm text-white/80">
          This will remove all failed/cancelled tasks from the queue.
        </span>
      ),
      primaryActionText: "Clear failed",
      primaryActionIcon: faTrashAlt,
      primaryActionBtnClassName:
        "bg-red-500/10 hover:bg-red-500/20 text-red-500",
      onConfirm: async () => {
        await dismissFailed();
      },
    });
  };

  const handleRemoveAll = () => {
    setConfirmationConfig({
      isOpen: true,
      title: "Remove all tasks?",
      message: (
        <span className="text-sm text-white/80">
          This will remove ALL tasks (completed and in-progress) from the queue.
          This cannot be undone.
        </span>
      ),
      primaryActionText: "Nuke all",
      primaryActionIcon: faBomb,
      primaryActionBtnClassName:
        "bg-red-500/10 hover:bg-red-500/20 text-red-500",
      onConfirm: async () => {
        await dismissAll();
      },
    });
  };

  // Use currently selected models for image and video pages to drive fake progress.
  const selectedImageModel = useSelectedImageModel(ModelPage.TextToImage);
  const selectedVideoModel = useSelectedVideoModel(ModelPage.ImageToVideo);
  // Snapshot per-task duration so switching models doesn't affect existing items
  const taskDurationRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const formatTitleParts = (t: TaskQueueItem) => {
      const provider = t.provider
        ? getProviderDisplayName(String(t.provider).toLowerCase())
        : undefined;
      const taskTypeStr = t.task_type ? String(t.task_type).toLowerCase() : "";
      const modelTypeStr = t.model_type
        ? String(t.model_type).toLowerCase()
        : "";
      const isSplatModel =
        taskTypeStr.includes("gaussian") ||
        modelTypeStr.includes("marble") ||
        modelTypeStr.includes("worldlabs");
      const is3DModel =
        taskTypeStr.includes("3d") ||
        taskTypeStr.includes("object") ||
        taskTypeStr.includes("dimensional") ||
        isSplatModel;

      let kind = undefined;
      if (isSplatModel) {
        kind = "3D World";
      } else if (taskTypeStr.includes("image") && is3DModel) {
        kind = "Image to 3D";
      } else if (is3DModel) {
        kind = "3D Model";
      } else if (taskTypeStr.includes("video")) {
        kind = "Video";
      } else if (taskTypeStr.includes("image")) {
        kind = "Image";
      }

      const modelDisplay = t.model_type
        ? getModelDisplayName(String(t.model_type))
        : undefined;

      const title = kind || "Task";
      const subtitle =
        modelDisplay && provider
          ? `${modelDisplay} — ${provider}`
          : modelDisplay || provider || undefined;
      return { title, subtitle, kind };
    };

    const load = async () => {
      try {
        const result = await GetTaskQueue();

        if (cancelled) return;
        console.log("TaskQueue:GetTaskQueue result", result);

        const { tasks } = result;

        const now = Date.now();
        const inProg = tasks
          .filter(
            (t) => t.task_status === "pending" || t.task_status === "started",
          )
          .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
          .map((t: TaskQueueItem) => {
            const createdMs = t.created_at.getTime();
            const taskTypeStr = t.task_type
              ? String(t.task_type).toLowerCase()
              : "";
            const isVideo = taskTypeStr.includes("video");
            let duration = taskDurationRef.current.get(t.id);
            if (!duration) {
              const actualModel = t.model_type
                ? ALL_MODELS_LIST.find(
                  (m) => m.tauriId === t.model_type || m.id === t.model_type,
                )
                : undefined;
              duration =
                actualModel?.progressBarTime ??
                (isVideo
                  ? selectedVideoModel?.progressBarTime
                  : selectedImageModel?.progressBarTime) ??
                20000;
              taskDurationRef.current.set(t.id, duration);
            }
            const raw = ((now - createdMs) / duration) * 100;
            const progress = Math.min(95, Math.max(0, raw));
            const elapsed = now - createdMs;
            const estimatedTimeLeftMs = Math.max(0, duration - elapsed);
            const parts = formatTitleParts(t);
            const canDismiss = now - createdMs > 5 * 60 * 1000; // 5 minutes
            const meta = getMetaForTask(
              t.id,
              t.model_type ? String(t.model_type) : undefined,
              createdMs,
            );
            return {
              id: t.id,
              title: `Generating ${parts.kind || "Task"}...`,
              subtitle: parts.subtitle,
              progress,
              updatedAt: t.updated_at,
              canDismiss,
              estimatedTimeLeftMs,
              modelType: t.model_type ? String(t.model_type) : undefined,
              prompt: meta?.prompt,
              refImageUrls: meta?.refImageUrls,
            };
          });

        // prune durations for tasks no longer in progress
        const inProgIds = new Set(inProg.map((x) => x.id));
        for (const id of Array.from(taskDurationRef.current.keys())) {
          if (!inProgIds.has(id)) {
            taskDurationRef.current.delete(id);
          }
        }

        const done = tasks
          .filter((t) => t.task_status === "complete_success")
          .sort(
            (a, b) =>
              (b.completed_at?.getTime() || b.updated_at.getTime()) -
              (a.completed_at?.getTime() || a.updated_at.getTime()),
          )
          .map((t: TaskQueueItem) => {
            const mediaToken = t.completed_item?.primary_media_file?.token;
            // Try server thumbnail first, then fall back to local cache
            const serverThumbnail = getThumbnailUrl(
              t.completed_item?.primary_media_file
                ?.maybe_thumbnail_url_template,
              { width: THUMBNAIL_SIZES.MEDIUM },
            );
            const cachedThumbnail = mediaToken
              ? coverImageCache.get(mediaToken)
              : undefined;

            const meta = getMetaForTask(
              t.id,
              t.model_type ? String(t.model_type) : undefined,
              t.created_at.getTime(),
            );

            return {
              id: t.id,
              ...formatTitleParts(t),
              thumbnailUrl: serverThumbnail || cachedThumbnail || undefined,
              prompt: meta?.prompt,
              imageUrls: t.completed_item?.primary_media_file?.cdn_url
                ? [t.completed_item?.primary_media_file?.cdn_url]
                : [],
              mediaTokens: (() => {
                const primaryToken =
                  t.completed_item?.primary_media_file?.token;
                const tokens: string[] = primaryToken ? [primaryToken] : [];
                return tokens;
              })(),
              mediaFileClass: t.completed_item?.media_file_class,
              batchImageToken: t.completed_item?.maybe_batch_token,
              completedAt: t.completed_at,
              updatedAt: t.updated_at,
            };
          });

        const FAILED_STATUSES = new Set([
          "complete_failure",
          "attempt_failed",
          "dead",
          "cancelled_by_user",
          "cancelled_by_provider",
          "cancelled_by_us",
        ]);

        const failedTasks = tasks
          .filter((t) => FAILED_STATUSES.has(t.task_status))
          .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
          .map((t: TaskQueueItem) => {
            const parts = formatTitleParts(t);
            const fr = t.failure_reason;
            const failureReason = fr
              ? FAILURE_REASON_LABEL[fr.failure_type] || undefined
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
              title: parts.title || "Task",
              subtitle: parts.subtitle,
              failedAt: t.completed_at || t.updated_at,
              status: t.task_status,
              failureReason: failureReason || fr?.failure_message || undefined,
              failureMessage,
              prompt: meta?.prompt,
              refImageUrls: meta?.refImageUrls,
            };
          });

        setInProgress(inProg);
        setCompleted(done);
        setFailed(failedTasks);

        // Track newly completed IDs when popover is closed
        const newCompletedIdSet = new Set(done.map((d) => d.id));
        const newlyCompletedIds: string[] = [];
        newCompletedIdSet.forEach((id) => {
          if (!prevCompletedIdsRef.current.has(id)) {
            newlyCompletedIds.push(id);
          }
        });
        prevCompletedIdsRef.current = newCompletedIdSet;
        if (!isPopoverOpen && newlyCompletedIds.length > 0) {
          setUnreadCompletedIds((prev) =>
            Array.from(new Set([...(prev ?? []), ...newlyCompletedIds])),
          );
        }
      } catch (_) {
        // ignore
      }
    };

    cleanupOldEntries();
    load();
    const id = setInterval(load, 5000);

    // Listen for cover image uploads to refresh and show new thumbnails
    const handleCoverUploaded = () => {
      if (!cancelled) {
        // Small delay to allow server to process
        setTimeout(load, 1000);
      }
    };
    window.addEventListener("cover-image-uploaded", handleCoverUploaded);

    let unlistenComplete: Promise<UnlistenFn> | null = null;
    let unlistenFailed: Promise<UnlistenFn> | null = null;
    (async () => {
      // Update immediately when Tauri signals a generation completion
      unlistenComplete = listen("generation-complete-event", () => {
        if (!cancelled) {
          load();
        }
      });
      // Also update immediately when a generation fails
      unlistenFailed = listen("generation-failed-event", () => {
        if (!cancelled) {
          load();
          // Refunded credits may take a moment to settle in the database
          setTimeout(() => {
            useCreditsState.getState().fetchFromServer();
          }, 2000);
        }
      });
    })();
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cover-image-uploaded", handleCoverUploaded);
      if (unlistenComplete) {
        unlistenComplete.then((f) => f());
      }
      if (unlistenFailed) {
        unlistenFailed.then((f) => f());
      }
    };
  }, [
    lastReadAt,
    selectedImageModel?.progressBarTime,
    selectedVideoModel?.progressBarTime,
    isPopoverOpen,
  ]);

  const hasNothing = useMemo(
    () =>
      inProgress.length === 0 && completed.length === 0 && failed.length === 0,
    [inProgress.length, completed.length, failed.length],
  );

  const inProgressCount = inProgress.length;
  const badgeCount = inProgressCount + (unreadCompletedIds?.length ?? 0);

  const handleOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      const now = Date.now();
      setLastReadAt(now);
      localStorage.setItem("taskQueueLastReadAt", String(now));
      setUnreadCompletedIds([]);
    }
  };

  const dismissTask = async (id: string) => {
    try {
      await MarkTaskAsDismissed(id);
      setInProgress((prev) => prev.filter((t) => t.id !== id));
      setCompleted((prev) => prev.filter((t) => t.id !== id));
      setFailed((prev) => prev.filter((t) => t.id !== id));
      setUnreadCompletedIds((prev) => (prev ?? []).filter((x) => x !== id));
      taskDurationRef.current.delete(id);
    } catch (_) {
      // ignore
    }
  };

  const dismissCompleted = async () => {
    const ids = completed.map((t) => t.id);
    try {
      await Promise.all(ids.map((id) => MarkTaskAsDismissed(id)));
    } catch (_) {
      // ignore
    } finally {
      setCompleted([]);
      setUnreadCompletedIds([]);
    }
  };

  const dismissFailed = async () => {
    const ids = failed.map((t) => t.id);
    try {
      await Promise.all(ids.map((id) => MarkTaskAsDismissed(id)));
    } catch (_) {
      // ignore
    } finally {
      setFailed([]);
    }
  };

  const dismissStale = async () => {
    const staleIds = inProgress.filter((t) => t.canDismiss).map((t) => t.id);
    try {
      await Promise.all(staleIds.map((id) => MarkTaskAsDismissed(id)));
      setInProgress((prev) => prev.filter((t) => !staleIds.includes(t.id)));
      taskDurationRef.current.forEach((_, id) => {
        if (staleIds.includes(id)) {
          taskDurationRef.current.delete(id);
        }
      });
    } catch (_) {
      // ignore
    }
  };

  const dismissAll = async () => {
    try {
      await TasksNukeAll();
    } catch (_) {
      // ignore
    } finally {
      setCompleted([]);
      setInProgress([]);
      setFailed([]);
      setUnreadCompletedIds([]);
      taskDurationRef.current.clear();
    }
  };

  return (
    <>
      <Tooltip content="Task Queue" position="bottom" closeOnClick={true}>
        <div className="relative">
          {badgeCount > 0 && (
            <div className="absolute -right-1 -top-1 z-20 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-brand-primary-400 text-[13px] font-medium text-white">
              {badgeCount}
            </div>
          )}
          <PopoverMenu
            mode="default"
            buttonClassName="h-[38px] w-[38px] !p-0 relative"
            panelClassName="w-[360px] p-2 bg-ui-panel mt-2.5"
            position="bottom"
            align="end"
            triggerIcon={
              inProgressCount > 0 ? (
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="animate-spin"
                />
              ) : (
                <FontAwesomeIcon icon={faListCheck} />
              )
            }
            onOpenChange={handleOpenChange}
          >
            {(close) => (
              <>
                <div className="flex max-h-[80vh] flex-col">
                  <div className="max-h-[80vh] overflow-y-auto p-1">
                    {hasNothing ? (
                      <div className="flex w-full flex-col items-center justify-center p-5 text-base-fg/60">
                        <div className="flex items-center gap-2.5 text-sm opacity-60">
                          <FontAwesomeIcon icon={faTasks} /> No tasks yet
                        </div>
                      </div>
                    ) : (
                      <div>
                        {inProgress.length > 0 && (
                          <div className="mb-4">
                            <div className="mb-1 px-1 text-xs uppercase tracking-wide text-base-fg/50">
                              In Progress
                            </div>
                            {inProgress.map((t) => (
                              <InProgressCard
                                key={t.id}
                                task={t}
                                onDismiss={
                                  t.canDismiss
                                    ? () => dismissTask(t.id)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        )}
                        {failed.length > 0 && (
                          <div className="mb-4">
                            <div className="mb-1 flex items-center justify-between px-1">
                              <div className="text-xs font-semibold uppercase tracking-wide text-red-400/70">
                                Failed
                              </div>
                              <button
                                className="text-xs tracking-wide text-red-400/70 transition-colors hover:text-red-300"
                                onClick={() => handleClearFailed()}
                              >
                                <FontAwesomeIcon
                                  icon={faXmark}
                                  className="mr-1"
                                />
                                Clear failed
                              </button>
                            </div>
                            {failed.map((t) => (
                              <FailedCard
                                key={t.id}
                                task={t}
                                onDismiss={() => dismissTask(t.id)}
                              />
                            ))}
                          </div>
                        )}
                        {completed.length > 0 && (
                          <div>
                            <div className="mb-1 flex items-center justify-between px-1">
                              <div className="text-xs font-semibold uppercase tracking-wide text-base-fg/50">
                                Completed
                              </div>
                              <button
                                className="text-xs tracking-wide text-base-fg/50 transition-colors hover:text-base-fg/100"
                                onClick={() => handleClearCompleted()}
                              >
                                <FontAwesomeIcon
                                  icon={faXmark}
                                  className="mr-1"
                                />
                                Clear completed
                              </button>
                            </div>
                            {completed.map((t) => (
                              <CompletedCard
                                key={t.id}
                                task={t}
                                onClick={() => {
                                  const firstMediaToken =
                                    t.mediaTokens?.[0] || t.id;
                                  const item: GalleryItem = {
                                    id: firstMediaToken,
                                    label: t.title,
                                    thumbnail: t.thumbnailUrl || null,
                                    fullImage: t.imageUrls?.[0] || null,
                                    createdAt: (
                                      t.completedAt || new Date()
                                    ).toISOString(),
                                    mediaClass: t.mediaFileClass,
                                    batchImageToken: t.batchImageToken,
                                    mediaTokens: t.mediaTokens,
                                    imageUrls: t.imageUrls,
                                  } as GalleryItem;
                                  galleryModalLightboxMediaId.value = item.id;
                                  galleryModalLightboxImage.value = {
                                    ...item,
                                    imageUrls: t.imageUrls,
                                    mediaTokens: t.mediaTokens,
                                    batchImageToken: t.batchImageToken,
                                  } as unknown as GalleryItem;
                                  galleryModalLightboxVisible.value = true;
                                  close();
                                }}
                                onDismiss={() => dismissTask(t.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-3">
                    <div className="flex items-center justify-center">
                      <Button
                        className="grow border-none bg-white/5 text-white/70 hover:bg-white/10"
                        variant="ghost"
                        onClick={() => {
                          setModalOpen(true);
                          close();
                        }}
                      >
                        Show all
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </PopoverMenu>
        </div>
      </Tooltip>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        className="h-[520px] max-w-3xl"
        showClose={false}
      >
        <div className="flex h-full flex-col">
          <div className="rounded-t-xl border-ui-panel-border bg-ui-panel">
            <div className="flex items-center justify-between p-3">
              <h2 className="text-lg font-semibold">Task Queue</h2>
              <div className="flex items-center gap-2">
                <Button
                  className="flex h-9 items-center justify-center bg-green-500/10 px-3 text-green-500 hover:bg-green-500/20"
                  onClick={() => handleClearCompleted()}
                >
                  <FontAwesomeIcon icon={faBroom} className="mr-1.5" />
                  Clear completed
                </Button>
                <Button
                  className="flex h-9 items-center justify-center bg-orange-500/10 px-3 text-orange-500 hover:bg-orange-500/20"
                  onClick={() => handleClearStale()}
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="mr-1.5" />
                  Clear stale
                </Button>
                <Button
                  className="flex h-9 items-center justify-center bg-red-500/10 px-3 text-red-400 hover:bg-red-500/20"
                  onClick={() => handleClearFailed()}
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="mr-1.5" />
                  Clear failed
                </Button>
                <Button
                  className="flex h-9 items-center justify-center bg-red-500/10 px-3 text-red-500 hover:bg-red-500/20"
                  onClick={() => handleRemoveAll()}
                >
                  <FontAwesomeIcon icon={faBomb} className="mr-1.5" />
                  Remove all
                </Button>
                <div className="mr-2 h-4 w-[1px] bg-base-fg/10" />
                <CloseButton onClick={() => setModalOpen(false)} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {hasNothing ? (
              <div className="flex w-full flex-col items-center justify-center p-5 text-base-fg/60">
                <div className="flex items-center gap-2.5 text-sm opacity-60">
                  <FontAwesomeIcon icon={faTasks} /> No tasks yet
                </div>
              </div>
            ) : (
              <div>
                {inProgress.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-1 text-xs uppercase tracking-wide text-base-fg/50">
                      In Progress
                    </div>
                    {inProgress.map((t) => (
                      <InProgressCard
                        key={t.id}
                        task={t}
                        onDismiss={
                          t.canDismiss ? () => dismissTask(t.id) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
                {failed.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-1 text-xs uppercase tracking-wide text-red-400/70">
                      Failed
                    </div>
                    {failed.map((t) => (
                      <FailedCard
                        key={t.id}
                        task={t}
                        onDismiss={() => dismissTask(t.id)}
                      />
                    ))}
                  </div>
                )}
                {completed.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs uppercase tracking-wide text-base-fg/50">
                      Completed
                    </div>
                    {completed.map((t) => (
                      <CompletedCard
                        key={t.id}
                        task={t}
                        onClick={() => {
                          const item: GalleryItem = {
                            id: t.id,
                            label: t.title,
                            thumbnail: t.thumbnailUrl || null,
                            fullImage: t.imageUrls?.[0] || null,
                            createdAt: (
                              t.completedAt || new Date()
                            ).toISOString(),
                            mediaClass: t.mediaFileClass,
                            batchImageToken: t.batchImageToken,
                            mediaTokens: t.mediaTokens,
                            imageUrls: t.imageUrls,
                          } as GalleryItem;
                          galleryModalLightboxMediaId.value = item.id;
                          galleryModalLightboxImage.value = item as GalleryItem;
                          galleryModalLightboxVisible.value = true;
                          setModalOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm clear completed modal */}
      <ActionReminderModal
        isOpen={confirmationConfig.isOpen}
        onClose={() =>
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false }))
        }
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        onPrimaryAction={async () => {
          await confirmationConfig.onConfirm();
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        primaryActionText={confirmationConfig.primaryActionText}
        secondaryActionText="Cancel"
        primaryActionIcon={confirmationConfig.primaryActionIcon}
        primaryActionBtnClassName={confirmationConfig.primaryActionBtnClassName}
      />
    </>
  );
};

export default TaskQueue;
