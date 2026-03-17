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
import { useEffect, useMemo, useRef, useState } from "react";
import { JobsApi, JobStatus } from "@storyteller/api";
import type { Job } from "@storyteller/api";
import { Button } from "@storyteller/ui-button";
import {
  getProviderDisplayName,
  getModelDisplayName,
  ALL_MODELS_LIST,
} from "@storyteller/model-list";
import { CloseButton } from "@storyteller/ui-close-button";
import dayjs from "dayjs";
import { ActionReminderModal } from "@storyteller/ui-action-reminder-modal";
import { Lightbox } from "../lightbox/lightbox";
import { showToast } from "../toast/toast";

// ── Types ──────────────────────────────────────────────────────────────────

type InProgressTask = {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  updatedAt?: Date;
  canDismiss?: boolean;
  estimatedTimeLeftMs?: number;
  modelType?: string;
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
};

type FailedTask = {
  id: string;
  title: string;
  subtitle?: string;
  failedAt?: Date;
  status: string;
  failureReason?: string;
  failureMessage?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

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

const FAILED_STATUS_LABEL: Record<string, string> = {
  [JobStatus.COMPLETE_FAILURE]: "Failed",
  [JobStatus.ATTEMPT_FAILED]: "Failed",
  [JobStatus.DEAD]: "Failed",
  [JobStatus.CANCELLED_BY_USER]: "Cancelled",
  [JobStatus.CANCELLED_BY_SYSTEM]: "Cancelled",
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

const IN_PROGRESS_STATUSES = new Set([JobStatus.PENDING, JobStatus.STARTED]);
const COMPLETED_STATUSES = new Set([JobStatus.COMPLETE_SUCCESS]);
const FAILED_STATUSES = new Set([
  JobStatus.ATTEMPT_FAILED,
  JobStatus.COMPLETE_FAILURE,
  JobStatus.DEAD,
  JobStatus.CANCELLED_BY_USER,
  JobStatus.CANCELLED_BY_SYSTEM,
]);

// ── Card Components ────────────────────────────────────────────────────────

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
  return (
    <div className="rounded-md p-2 transition-colors hover:bg-ui-controls/40">
      <div className="flex items-center gap-2.5">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded bg-ui-controls">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-base-fg/60"
            size="lg"
          />
        </div>
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
                className="h-1.5 rounded bg-primary-400"
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
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded bg-ui-controls">
        {task.thumbnailUrl ? (
          <img
            src={task.thumbnailUrl}
            alt={task.title}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-base-fg/40">
            Done
          </div>
        )}
      </div>
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
            {dayjs(task.completedAt).format("MMM D, h:mm A")}
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

const FailedCard = ({
  task,
  onDismiss,
}: {
  task: FailedTask;
  onDismiss?: () => void;
}) => {
  const statusLabel = FAILED_STATUS_LABEL[task.status] || "Failed";
  return (
    <div className="rounded-md p-2 transition-colors hover:bg-ui-controls/40">
      <div className="flex items-center gap-2.5">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded bg-red-500/10">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="text-red-400"
            size="lg"
          />
        </div>
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
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded bg-red-500/15 px-1.5 py-0 text-[11px] font-medium text-red-400">
              {statusLabel}
            </span>
            {task.failureReason && (
              <Tooltip
                content={task.failureReason}
                position="bottom"
                strategy="fixed"
                className="max-w-[280px] text-wrap bg-red-500/90 text-xs"
                zIndex={50}
                delay={300}
              >
                <span className="truncate text-[11px] text-red-400/60">
                  {task.failureReason}
                </span>
              </Tooltip>
            )}
          </div>
          {task.failureMessage && (
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
          )}
          {task.failedAt && (
            <div className="mt-0.5 text-[11px] text-base-fg/40">
              {dayjs(task.failedAt).format("MMM D, h:mm A")}
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

// ── Job → Task transformers ────────────────────────────────────────────────

function formatTitleParts(job: Job) {
  const taskTypeStr = job.request.inference_category?.toLowerCase() ?? "";
  const modelTypeStr = job.request.maybe_model_type ?? "";

  let kind: string | undefined;
  if (taskTypeStr.includes("video")) {
    kind = "Video";
  } else if (taskTypeStr.includes("image")) {
    kind = "Image";
  }

  const modelDisplay = modelTypeStr
    ? getModelDisplayName(modelTypeStr)
    : undefined;
  const provider = modelTypeStr
    ? getProviderDisplayName(modelTypeStr.toLowerCase())
    : undefined;

  const title = kind || "Task";
  const subtitle =
    modelDisplay && provider
      ? `${modelDisplay} — ${provider}`
      : modelDisplay || job.request.maybe_model_title || undefined;
  return { title, subtitle, kind };
}

// Cache per-task durations so model changes don't affect existing progress bars
const taskDurationCache = new Map<string, number>();

function jobsToInProgress(jobs: Job[]): InProgressTask[] {
  const now = Date.now();
  const activeIds = new Set<string>();

  const result = jobs
    .filter((j) => IN_PROGRESS_STATUSES.has(j.status.status))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .map((j): InProgressTask => {
      activeIds.add(j.job_token);
      const createdMs = new Date(j.created_at).getTime();
      const parts = formatTitleParts(j);
      const isVideo =
        j.request.inference_category?.toLowerCase().includes("video") ?? false;
      const modelType = j.request.maybe_model_type;

      // Look up per-model estimated duration, cache per task
      let duration = taskDurationCache.get(j.job_token);
      if (!duration) {
        const model = modelType
          ? ALL_MODELS_LIST.find(
              (m) => m.tauriId === modelType || m.id === modelType,
            )
          : undefined;
        duration = model?.progressBarTime ?? (isVideo ? 120000 : 30000);
        taskDurationCache.set(j.job_token, duration);
      }

      // Always use time-based fake progress (matching desktop app behavior)
      const elapsed = now - createdMs;
      const progress = Math.min(95, (elapsed / duration) * 100);
      const estimatedTimeLeftMs = Math.max(0, duration - elapsed);

      const canDismiss = now - createdMs > 5 * 60 * 1000;

      return {
        id: j.job_token,
        title: `Generating ${parts.kind || "Task"}...`,
        subtitle: parts.subtitle,
        progress,
        updatedAt: new Date(j.updated_at),
        canDismiss,
        estimatedTimeLeftMs,
        modelType: modelType ?? undefined,
      };
    });

  // Prune cached durations for tasks no longer in progress
  for (const id of taskDurationCache.keys()) {
    if (!activeIds.has(id)) taskDurationCache.delete(id);
  }

  return result;
}

function jobsToCompleted(jobs: Job[]): CompletedTask[] {
  return jobs
    .filter((j) => COMPLETED_STATUSES.has(j.status.status))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .map((j): CompletedTask => {
      const cdnUrl = j.maybe_result?.media_links?.cdn_url;
      const parts = formatTitleParts(j);

      return {
        id: j.job_token,
        title: parts.title,
        subtitle: parts.subtitle,
        thumbnailUrl: cdnUrl,
        completedAt: j.maybe_result?.maybe_successfully_completed_at
          ? new Date(j.maybe_result.maybe_successfully_completed_at)
          : new Date(j.updated_at),
        updatedAt: new Date(j.updated_at),
        imageUrls: cdnUrl ? [cdnUrl] : [],
        mediaTokens: j.maybe_result?.entity_token
          ? [j.maybe_result.entity_token]
          : [],
      };
    });
}

function jobsToFailed(jobs: Job[]): FailedTask[] {
  return jobs
    .filter((j) => FAILED_STATUSES.has(j.status.status))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .map((j): FailedTask => {
      const parts = formatTitleParts(j);
      const failureCategory = j.status.maybe_failure_category;
      const failureReason = failureCategory
        ? FAILURE_REASON_LABEL[failureCategory] ||
          j.status.maybe_extra_status_description ||
          undefined
        : j.status.maybe_extra_status_description || undefined;
      const failureMessage =
        j.status.maybe_extra_status_description &&
        failureCategory !== "unknown"
          ? j.status.maybe_extra_status_description
          : undefined;

      return {
        id: j.job_token,
        title: parts.title || "Task",
        subtitle: parts.subtitle,
        failedAt: new Date(j.updated_at),
        status: j.status.status,
        failureReason,
        failureMessage,
      };
    });
}

// ── Main Component ─────────────────────────────────────────────────────────

export const TaskQueue = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [inProgress, setInProgress] = useState<InProgressTask[]>([]);
  const [completed, setCompleted] = useState<CompletedTask[]>([]);
  const [failed, setFailed] = useState<FailedTask[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [unreadCompletedIds, setUnreadCompletedIds] = useState<string[]>([]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMediaToken, setLightboxMediaToken] = useState<string | undefined>();
  const [lightboxCdnUrl, setLightboxCdnUrl] = useState<string | undefined>();
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const prevFailedIdsRef = useRef<Set<string>>(new Set());

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
    onConfirm: async () => {},
  });

  // ── Confirmation handlers ──────────────────────────────────────────

  const handleClearCompleted = () => {
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

  // ── Data loading ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const api = new JobsApi();

    const load = async () => {
      try {
        const response = await api.ListRecentJobs();
        if (cancelled || !response.success || !response.data) return;

        const jobs: Job[] = response.data;

        const inProg = jobsToInProgress(jobs);
        const done = jobsToCompleted(jobs);
        const failedTasks = jobsToFailed(jobs);

        setInProgress(inProg);
        setCompleted(done);
        setFailed(failedTasks);

        // Track newly completed IDs
        const newCompletedIdSet = new Set(done.map((d) => d.id));
        const newlyCompleted = done.filter(
          (d) => !prevCompletedIdsRef.current.has(d.id),
        );
        prevCompletedIdsRef.current = newCompletedIdSet;

        if (newlyCompleted.length > 0) {
          // Show toasts for newly completed jobs
          for (const task of newlyCompleted) {
            showToast(
              "success",
              `${task.title} complete${task.subtitle ? ` — ${task.subtitle}` : ""}`,
            );
          }
          if (!isPopoverOpen) {
            setUnreadCompletedIds((prev) =>
              Array.from(
                new Set([...(prev ?? []), ...newlyCompleted.map((d) => d.id)]),
              ),
            );
          }
        }

        // Track newly failed IDs and show toasts
        const newFailedIdSet = new Set(failedTasks.map((f) => f.id));
        const newlyFailed = failedTasks.filter(
          (f) => !prevFailedIdsRef.current.has(f.id),
        );
        prevFailedIdsRef.current = newFailedIdSet;

        for (const task of newlyFailed) {
          showToast(
            "error",
            `${task.title} failed${task.failureReason ? ` — ${task.failureReason}` : ""}`,
          );
        }
      } catch {
        // ignore
      }
    };

    load();
    const intervalId = setInterval(load, 5000);

    const handleTaskUpdate = () => {
      if (!cancelled) load();
    };
    window.addEventListener("task-queue-update", handleTaskUpdate);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("task-queue-update", handleTaskUpdate);
    };
  }, [isPopoverOpen]);

  // ── Derived state ──────────────────────────────────────────────────

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
      setUnreadCompletedIds([]);
    }
  };

  // ── Dismiss handlers ──────────────────────────────────────────────

  const dismissTask = async (id: string) => {
    try {
      const api = new JobsApi();
      await api.DeleteJobByToken(id);
      setInProgress((prev) => prev.filter((t) => t.id !== id));
      setCompleted((prev) => prev.filter((t) => t.id !== id));
      setFailed((prev) => prev.filter((t) => t.id !== id));
      setUnreadCompletedIds((prev) => (prev ?? []).filter((x) => x !== id));
    } catch {
      // ignore
    }
  };

  const dismissCompleted = async () => {
    const ids = completed.map((t) => t.id);
    try {
      await Promise.allSettled(
        ids.map((id) => new JobsApi().DeleteJobByToken(id)),
      );
    } catch {
      // ignore
    } finally {
      setCompleted([]);
      setUnreadCompletedIds([]);
    }
  };

  const dismissFailed = async () => {
    const ids = failed.map((t) => t.id);
    try {
      await Promise.allSettled(
        ids.map((id) => new JobsApi().DeleteJobByToken(id)),
      );
    } catch {
      // ignore
    } finally {
      setFailed([]);
    }
  };

  const dismissStale = async () => {
    const staleIds = inProgress.filter((t) => t.canDismiss).map((t) => t.id);
    try {
      await Promise.allSettled(
        staleIds.map((id) => new JobsApi().DeleteJobByToken(id)),
      );
      setInProgress((prev) => prev.filter((t) => !staleIds.includes(t.id)));
    } catch {
      // ignore
    }
  };

  const dismissAll = async () => {
    const allIds = [
      ...inProgress.map((t) => t.id),
      ...completed.map((t) => t.id),
      ...failed.map((t) => t.id),
    ];
    try {
      await Promise.allSettled(
        allIds.map((id) => new JobsApi().DeleteJobByToken(id)),
      );
    } catch {
      // ignore
    } finally {
      setInProgress([]);
      setCompleted([]);
      setFailed([]);
      setUnreadCompletedIds([]);
    }
  };

  // ── Shared task list renderer ──────────────────────────────────────

  const renderTaskList = (onCloseAction: () => void) => (
    <>
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
                    t.canDismiss ? () => dismissTask(t.id) : undefined
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
                  <FontAwesomeIcon icon={faXmark} className="mr-1" />
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
                  <FontAwesomeIcon icon={faXmark} className="mr-1" />
                  Clear completed
                </button>
              </div>
              {completed.map((t) => (
                <CompletedCard
                  key={t.id}
                  task={t}
                  onClick={() => {
                    const mediaToken = t.mediaTokens?.[0];
                    const cdnUrl = t.imageUrls?.[0];
                    if (mediaToken || cdnUrl) {
                      setLightboxMediaToken(mediaToken);
                      setLightboxCdnUrl(cdnUrl);
                      setLightboxOpen(true);
                    }
                    onCloseAction();
                  }}
                  onDismiss={() => dismissTask(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <Tooltip content="Task Queue" position="bottom" closeOnClick={true}>
        <div className="relative">
          {badgeCount > 0 && (
            <div className="absolute -right-1 -top-1 z-20 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-primary-400 text-[13px] font-medium text-white">
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
            {(close: () => void) => (
              <div className="flex max-h-[80vh] flex-col">
                <div className="max-h-[80vh] overflow-y-auto p-1">
                  {renderTaskList(close)}
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
            {renderTaskList(() => setModalOpen(false))}
          </div>
        </div>
      </Modal>

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

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxMediaToken(undefined);
          setLightboxCdnUrl(undefined);
        }}
        mediaToken={lightboxMediaToken}
        cdnUrl={lightboxCdnUrl}
      />
    </>
  );
};

export default TaskQueue;
