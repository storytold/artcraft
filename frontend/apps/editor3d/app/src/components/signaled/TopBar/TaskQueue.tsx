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
} from "../../../../../../../libs/components/model-selector/src/lib/classy-model-selector-store";
import { ModelPage } from "../../../../../../../libs/components/model-selector/src/lib/model-pages";
import { Button } from "@storyteller/ui-button";

type InProgressTask = {
  id: string;
  title: string;
  progress: number;
  updatedAt?: string;
};

type CompletedTask = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  completedAt?: string; //dummy
  updatedAt?: string;
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
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-ui-controls">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="text-base-fg/60 animate-spin"
            size="sm"
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
          <div className="mt-2 h-1.5 w-full rounded bg-ui-controls">
            <div
              className="h-1.5 rounded bg-brand-primary-400"
              style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
            />
          </div>
        </div>
        {onDismiss && (
          <button
            className="text-base-fg/60 ml-2 rounded p-1 hover:bg-ui-controls"
            aria-label="Dismiss"
            onClick={onDismiss}
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
      className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border border-ui-divider bg-ui-background p-2 transition-colors hover:bg-ui-controls/40"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-ui-controls">
        {task.thumbnailUrl ? (
          <img
            src={task.thumbnailUrl}
            alt={task.title}
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
        {task.completedAt && (
          <div className="text-base-fg text-xs opacity-60">
            {task.completedAt}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          className="text-base-fg/60 ml-auto rounded p-1 hover:bg-ui-controls"
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

  // Use currently selected models for image and video pages to drive fake progress.
  const selectedImageModel = useSelectedImageModel(ModelPage.TextToImage);
  const selectedVideoModel = useSelectedVideoModel(ModelPage.ImageToVideo);

  useEffect(() => {
    let cancelled = false;

    const formatTitle = (t: { provider?: unknown; task_type?: unknown }) => {
      const provider = t.provider ? String(t.provider) : undefined;
      const type = t.task_type ? String(t.task_type) : undefined;
      return [provider, type].filter(Boolean).join(" · ") || "Task";
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
            const duration =
              (isVideo
                ? selectedVideoModel?.progressBarTime
                : selectedImageModel?.progressBarTime) ?? 20000;
            const raw = ((now - createdMs) / duration) * 100;
            const progress = Math.min(95, Math.max(0, raw));
            return {
              id: t.id,
              title: formatTitle(t),
              progress,
              updatedAt: t.updated_at?.toISOString(),
            };
          });

        const done = tasks
          .filter((t) => t.task_status === "complete_success")
          .sort(
            (a, b) =>
              (b.completed_at?.getTime() || b.updated_at.getTime()) -
              (a.completed_at?.getTime() || a.updated_at.getTime()),
          )
          .map((t) => ({
            id: t.id,
            title: formatTitle(t),
            thumbnailUrl: undefined,
            completedAt: t.completed_at?.toISOString(),
            updatedAt: t.updated_at?.toISOString(),
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
    } catch (_) {
      // ignore
    }
  };

  const dismissAll = async () => {
    const ids = [...inProgress.map((t) => t.id), ...completed.map((t) => t.id)];
    try {
      await Promise.all(ids.map((id) => MarkTaskAsDismissed(id)));
    } catch (_) {
      // ignore
    } finally {
      setInProgress([]);
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
                              <InProgressCard key={t.id} task={t} />
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
                                  const item: GalleryItem = {
                                    id: t.id,
                                    label: t.title,
                                    thumbnail: t.thumbnailUrl || null,
                                    fullImage: t.thumbnailUrl || null,
                                    createdAt: new Date().toISOString(),
                                    mediaClass: "image",
                                  } as GalleryItem;
                                  galleryModalLightboxMediaId.value = item.id;
                                  galleryModalLightboxImage.value =
                                    item as GalleryItem;
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
                          onClick={async () => {
                            await dismissAll();
                            close();
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
        title={<h2>Task Queue</h2>}
        className="h-[520px] max-w-3xl"
      >
        <div className="max-h-[70vh] overflow-y-auto p-2">
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
                    <InProgressCard key={t.id} task={t} />
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
                          fullImage: t.thumbnailUrl || null,
                          createdAt: new Date().toISOString(),
                          mediaClass: "image",
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
      </Modal>
    </>
  );
};

export default TaskQueue;
