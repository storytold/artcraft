import { Tooltip } from "@storyteller/ui-tooltip";
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListCheck,
  faSpinnerThird,
  faXmark,
  faTrashAlt,
  faTasks,
} from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import {
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxImage,
} from "@storyteller/ui-gallery-modal";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { useEffect, useMemo, useRef, useState } from "react";
import { GetTaskQueue, MarkTaskAsDismissed } from "@storyteller/tauri-api";
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
  getModelDisplayName,
} from "@storyteller/model-list";
import { CloseButton } from "@storyteller/ui-close-button";
import { ActionReminderModal } from "@storyteller/ui-action-reminder-modal";
import { TaskMediaFileClass } from "@storyteller/api-enums";

type InProgressTask = {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  updatedAt?: Date;
  canDismiss?: boolean;
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
};

const InProgressCard = ({
  task,
  onDismiss,
}: {
  task: InProgressTask;
  onDismiss?: () => void;
}) => {
  return (
    <div className="mb-2 rounded-md border border-ui-divider bg-ui-background p-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-ui-controls">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="text-base-fg/60 animate-spin"
            size="lg"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="text-base-fg/90 truncate font-medium">
              {task.title}
            </div>
            <div className="text-base-fg/60 ml-2 shrink-0 text-xs tabular-nums">
              {Math.max(0, Math.min(100, Math.round(task.progress)))}%
            </div>
          </div>
          {task.subtitle && (
            <div className="text-base-fg mt-0.5 truncate text-xs opacity-60">
              {task.subtitle}
            </div>
          )}
          <div className="mt-2 h-1.5 w-full rounded bg-ui-controls">
            <div
              className="h-1.5 rounded bg-brand-primary-400"
              style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
            />
          </div>
        </div>
        {onDismiss && (
          <button
            className="text-base-fg/60 ml-auto h-6 w-6 rounded-full p-1 hover:bg-ui-controls"
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
      className="mb-2 flex cursor-pointer items-center gap-2.5 rounded-md border border-ui-divider bg-ui-background p-2 transition-colors hover:bg-ui-controls/40"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-ui-controls">
        {task.thumbnailUrl ? (
          <img
            src={task.thumbnailUrl}
            alt={task.title}
            onError={(e) => {
              console.log("Failed to load thumbnail", e);
              let errorPlaceholder = "/resources/placeholders/placeholder.png";
              switch (task.mediaFileClass) {
                case TaskMediaFileClass.Video:
                  errorPlaceholder =
                    "/resources/placeholders/placeholder_play.png";
                  break;
              }
              e.currentTarget.src = errorPlaceholder;
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-base-fg/40 flex h-full w-full items-center justify-center text-[10px]">
            Done
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-base-fg/90 truncate text-sm font-medium">
          {task.title}
        </div>
        {task.subtitle && (
          <div className="text-base-fg mt-0.5 truncate text-xs opacity-60">
            {task.subtitle}
          </div>
        )}
        {task.completedAt && (
          <div className="text-base-fg text-xs opacity-60">
            {task.completedAt.toISOString()}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          className="text-base-fg/60 ml-auto h-6 w-6 rounded-full p-1 hover:bg-ui-controls"
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

export const TaskQueue = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [inProgress, setInProgress] = useState<InProgressTask[]>([]);
  const [completed, setCompleted] = useState<CompletedTask[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(() => {
    const stored = localStorage.getItem("taskQueueLastReadAt");
    return stored ? parseInt(stored, 10) : 0;
  });

  // remove unread state; unread tracking handled via IDs below
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [unreadCompletedIds, setUnreadCompletedIds] = useState<string[]>([]);
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  // confirmation modal state for destructive actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [afterConfirm, setAfterConfirm] = useState<(() => void) | null>(null);

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
      const taskTypeStr = t.task_type ? String(t.task_type) : "";
      const kind = taskTypeStr.includes("video")
        ? "Video"
        : taskTypeStr.includes("image")
          ? "Image"
          : undefined;
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
              duration =
                (isVideo
                  ? selectedVideoModel?.progressBarTime
                  : selectedImageModel?.progressBarTime) ?? 20000;
              taskDurationRef.current.set(t.id, duration);
            }
            const raw = ((now - createdMs) / duration) * 100;
            const progress = Math.min(95, Math.max(0, raw));
            const parts = formatTitleParts(t);
            const canDismiss = now - createdMs > 5 * 60 * 1000; // 5 minutes
            return {
              id: t.id,
              title: `Generating ${parts.kind || "Task"}...`,
              subtitle: parts.subtitle,
              progress,
              updatedAt: t.updated_at,
              canDismiss,
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
          .map((t: TaskQueueItem) => ({
            id: t.id,
            ...formatTitleParts(t),
            thumbnailUrl: t.completed_item?.primary_media_file
              ?.maybe_thumbnail_url_template
              ? t.completed_item?.primary_media_file?.maybe_thumbnail_url_template.replace(
                  "{WIDTH}",
                  "250",
                )
              : undefined,
            imageUrls: t.completed_item?.primary_media_file?.cdn_url
              ? [t.completed_item?.primary_media_file?.cdn_url]
              : [],
            mediaTokens: (() => {
              const primaryToken = t.completed_item?.primary_media_file?.token;
              const tokens: string[] = primaryToken ? [primaryToken] : [];
              return tokens;
            })(),
            mediaFileClass: t.completed_item?.media_file_class,
            batchImageToken: t.completed_item?.maybe_batch_token,
            completedAt: t.completed_at,
            updatedAt: t.updated_at,
          }));

        setInProgress(inProg);
        setCompleted(done);

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

    load();
    const id = setInterval(load, 5000);
    let unlisten: Promise<UnlistenFn> | null = null;
    (async () => {
      // Update immediately when Tauri signals a generation completion
      unlisten = listen("generation-complete-event", () => {
        if (!cancelled) {
          load();
        }
      });
    })();
    return () => {
      cancelled = true;
      clearInterval(id);
      if (unlisten) {
        unlisten.then((f) => f());
      }
    };
  }, [
    lastReadAt,
    selectedImageModel?.progressBarTime,
    selectedVideoModel?.progressBarTime,
    isPopoverOpen,
  ]);

  const hasNothing = useMemo(
    () => inProgress.length === 0 && completed.length === 0,
    [inProgress.length, completed.length],
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
                <div className="flex max-h-[480px] flex-col">
                  <div className="max-h-[420px] overflow-y-auto p-1">
                    {hasNothing ? (
                      <div className="text-base-fg/60 flex w-full flex-col items-center justify-center p-5">
                        <div className="flex items-center gap-2.5 text-sm opacity-60">
                          <FontAwesomeIcon icon={faTasks} /> No tasks yet
                        </div>
                      </div>
                    ) : (
                      <div>
                        {inProgress.length > 0 && (
                          <div className="mb-4">
                            <div className="text-base-fg/50 mb-1 px-1 text-xs uppercase tracking-wide">
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
                        {completed.length > 0 && (
                          <div>
                            <div className="text-base-fg/50 mb-1 px-1 text-xs uppercase tracking-wide">
                              Completed
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
                                    mediaClass: "image",
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
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        className="grow"
                        variant="secondary"
                        onClick={() => {
                          setModalOpen(true);
                          close();
                        }}
                      >
                        Show all
                      </Button>
                      <Tooltip
                        content="Clear all"
                        position="bottom"
                        closeOnClick={true}
                      >
                        <Button
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-red/20 text-white hover:bg-red/40"
                          aria-label="Clear all"
                          onClick={() => {
                            setAfterConfirm(() => () => close());
                            setConfirmOpen(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </Button>
                      </Tooltip>
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Task Queue</h2>
              <div className="flex items-center gap-2">
                <Button
                  className="flex h-9 items-center justify-center bg-red/20 px-3 text-white hover:bg-red/40"
                  onClick={() => {
                    setAfterConfirm(() => null);
                    setConfirmOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
                  Clear all
                </Button>
                <CloseButton onClick={() => setModalOpen(false)} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {hasNothing ? (
              <div className="text-base-fg/60 flex w-full flex-col items-center justify-center p-5">
                <div className="flex items-center gap-2.5 text-sm opacity-60">
                  <FontAwesomeIcon icon={faTasks} /> No tasks yet
                </div>
              </div>
            ) : (
              <div>
                {inProgress.length > 0 && (
                  <div className="mb-4">
                    <div className="text-base-fg/50 mb-2 px-1 text-xs uppercase tracking-wide">
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
                {completed.length > 0 && (
                  <div>
                    <div className="text-base-fg/50 mb-2 px-1 text-xs uppercase tracking-wide">
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
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear all tasks?"
        message={
          <span className="text-sm text-white/80">
            This will remove all completed tasks from the task queue.
          </span>
        }
        onPrimaryAction={async () => {
          await dismissCompleted();
          setConfirmOpen(false);
          if (afterConfirm) afterConfirm();
          setAfterConfirm(null);
        }}
        primaryActionText="Clear completed"
        secondaryActionText="Cancel"
        primaryActionIcon={faTrashAlt}
        primaryActionBtnClassName="bg-red hover:bg-red/80"
      />
    </>
  );
};

export default TaskQueue;
