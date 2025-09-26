import { Tooltip } from "@storyteller/ui-tooltip";
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import {
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxImage,
} from "@storyteller/ui-gallery-modal";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { useMemo, useState } from "react";

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
};

const InProgressCard = ({ task }: { task: InProgressTask }) => {
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
      </div>
    </div>
  );
};

const CompletedCard = ({
  task,
  onClick,
}: {
  task: CompletedTask;
  onClick?: () => void;
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
    </div>
  );
};

export const TaskQueue = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [inProgress] = useState<InProgressTask[]>([
    {
      id: "1",
      title: "Midjourney image",
      progress: 42,
      updatedAt: "Just now",
    },
  ]);
  const [completed] = useState<CompletedTask[]>([
    {
      id: "2",
      title: "Midjourney image",
      thumbnailUrl: "https://picsum.photos/seed/portrait/80",
      completedAt: "2m ago",
    },
  ]);

  const hasNothing = useMemo(
    () => inProgress.length === 0 && completed.length === 0,
    [inProgress.length, completed.length],
  );

  return (
    <>
      <Tooltip content="Task Queue" position="bottom" closeOnClick={true}>
        <div className="relative">
          <div className="absolute -right-1 -top-1 z-20 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-brand-primary-400 text-[13px] font-medium text-white">
            1
          </div>
          <PopoverMenu
            mode="default"
            buttonClassName="h-[38px] w-[38px] !p-0 relative"
            panelClassName="w-[360px] p-2 bg-ui-panel mt-2.5"
            position="bottom"
            align="end"
            triggerIcon={<FontAwesomeIcon icon={faListCheck} />}
          >
            {(close) => (
              <>
                <div className="flex max-h-[480px] flex-col">
                  <div className="max-h-[420px] overflow-y-auto p-1">
                    {hasNothing ? (
                      <div className="text-base-fg/60 flex h-40 w-full flex-col items-center justify-center">
                        <div className="text-sm">No tasks yet</div>
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
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <button
                      className="border-ui-controls-border text-base-fg w-full rounded-md border bg-ui-controls py-2 text-sm hover:brightness-110"
                      onClick={() => {
                        setModalOpen(true);
                        close();
                      }}
                    >
                      Show all
                    </button>
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
            <div className="text-base-fg/60 flex h-40 w-full flex-col items-center justify-center">
              <div className="text-sm">No tasks yet</div>
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
