import React, { useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEllipsis,
  faPencil,
  faTrashCan,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import galleryDnd from "./galleryDnd";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryItem } from "./gallery-modal";
import { PopoverMenu } from "@storyteller/ui-popover";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { MediaFilesApi } from "@storyteller/api";

type ModalMode = "select" | "view";

interface GalleryDraggableItemProps {
  item: GalleryItem;
  mode: ModalMode;
  activeFilter: string;
  selected: boolean;
  onClick: () => void;
  onImageError: () => void;
  disableTooltipAndBadge?: boolean;
  imageFit?: "cover" | "contain";
  onDeleted?: (id: string) => void;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
}

export const GalleryDraggableItem: React.FC<GalleryDraggableItemProps> = ({
  item,
  mode,
  activeFilter,
  selected,
  onClick,
  onImageError,
  disableTooltipAndBadge = false,
  imageFit = "cover",
  onDeleted,
  onEditClicked,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStarted = useRef(false);
  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);

  const handleDelete = () => {
    showActionReminder({
      reminderType: "default",
      title: "Delete this media?",
      message: (
        <p className="text-sm text-white/70">
          This will permanently remove the media from your library. This action
          cannot be undone.
        </p>
      ),
      primaryActionText: "Delete",
      secondaryActionText: "Cancel",
      primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
      onPrimaryAction: async () => {
        try {
          const res = await mediaFilesApi.DeleteMediaFileByToken({
            mediaFileToken: item.id,
          });
          if (res.success) {
            onDeleted?.(item.id);
          }
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Disable dragging for video items
    if (item.mediaClass === "video") return;
    dragStarted.current = false;
    const moveListener = (moveEvent: PointerEvent) => {
      const dx = moveEvent.pageX - event.pageX;
      const dy = moveEvent.pageY - event.pageY;
      if (!dragStarted.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragStarted.current = true;
        if (galleryDnd && !disableTooltipAndBadge) {
          galleryDnd.onPointerDown(event, item);
        }
        window.removeEventListener("pointermove", moveListener);
      }
    };
    window.addEventListener("pointermove", moveListener);
    const upListener = () => {
      window.removeEventListener("pointermove", moveListener);
      window.removeEventListener("pointerup", upListener);
      if (!dragStarted.current) {
        onClick();
      }
    };
    window.addEventListener("pointerup", upListener);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!dragStarted.current && !disableTooltipAndBadge) {
      onClick();
    }
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    if (!disableTooltipAndBadge) {
      onClick();
    }
  };

  return (
    <div
      className={twMerge(
        "group relative w-full",
        activeFilter === "video" ? "aspect-square" : "aspect-square"
      )}
    >
      {/* dropdown menu */}
      <div
        className="absolute right-2 top-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-75"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <PopoverMenu
          position="bottom"
          align="end"
          mode="default"
          triggerIcon={
            <FontAwesomeIcon icon={faEllipsis} className="text-base-fg" />
          }
          buttonClassName="h-7 w-7 p-0 rounded-full bg-ui-controls/60 hover:bg-ui-controls/90 text-base-fg border border-ui-controls-border"
          panelClassName="min-w-28 p-1"
          closeOnUnhover
        >
          {(close) => (
            <div className="flex flex-col">
              {item.mediaClass === "image" && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (onEditClicked && (item.fullImage || item.thumbnail)) {
                      await onEditClicked(
                        item.fullImage || item.thumbnail!,
                        item.id
                      );
                    }
                    close();
                  }}
                >
                  <FontAwesomeIcon icon={faPencil} className="text-base-fg" />
                  <span>Edit image</span>
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  close();
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-red" />
                <span className="text-red">Delete</span>
              </button>
            </div>
          )}
        </PopoverMenu>
      </div>
      {/* Media class badge on hover */}
      {!disableTooltipAndBadge && item.mediaClass && (
        <div className="pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-black/50 backdrop-blur-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {item.mediaClass === "dimensional" ? "3D" : item.mediaClass}
        </div>
      )}
      {/* Tooltip on hover */}
      {disableTooltipAndBadge ? (
        <button
          type="button"
          tabIndex={0}
          className={twMerge(
            "w-full group relative overflow-visible rounded-md border-transparent border-[3px] transition-all",
            activeFilter === "video" ? "aspect-square" : "aspect-square",
            selected
              ? "border-primary"
              : "border-transparent hover:border-primary/80",
            mode === "select" || item.mediaClass === "video"
              ? "cursor-pointer"
              : "cursor-grab hover:cursor-grab active:cursor-grabbing"
          )}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={handleButtonClick}
          aria-label={item.label}
        >
          <div className="relative h-full w-full">
            {!item.thumbnail ? (
              <div className="flex h-full w-full items-center justify-center bg-black/30">
                <span className="text-white/60">Image not available</span>
              </div>
            ) : (
              <img
                data-gallery-draggable-1="true"
                // NB: "loading=lazy" is necessary to prevent loading GIGABYTES of images!
                // It is a bit finnicky, too: you must include this attribute
                // BEFORE the `src` attribute, or it won't work.
                loading="lazy"
                ref={imgRef}
                src={item.thumbnail}
                alt={item.label}
                className={twMerge(
                  "h-full w-full bg-black/30",
                  imageFit === "contain" ? "object-contain" : "object-cover"
                )}
                draggable={false}
                onError={onImageError}
              />
            )}
            {selected && (
              <div className="absolute right-8 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <FontAwesomeIcon icon={faCheck} className="text-sm" />
              </div>
            )}
          </div>
        </button>
      ) : (
        <Tooltip
          position="bottom"
          delay={200}
          className="-mt-3 bg-ui-controls text-base-fg border border-ui-panel-border"
          content={
            <div className="flex flex-col items-center text-xs whitespace-nowrap">
              {item.mediaClass !== "video" && (
                <span>
                  <span className="font-bold">Drag</span>
                  <span className="opacity-50">
                    {item.mediaClass === "dimensional"
                      ? " to add to scene"
                      : " to add"}
                  </span>
                </span>
              )}
              <span>
                <span className="font-bold">Click</span>
                <span className="opacity-50"> to view</span>
              </span>
            </div>
          }
        >
          <button
            type="button"
            tabIndex={0}
            className={twMerge(
              "w-full group relative overflow-visible rounded-md border-[3px] transition-all focus:outline-none focus:ring-2 focus:ring-primary",
              activeFilter === "video" ? "aspect-square" : "aspect-square",
              selected
                ? "border-primary"
                : "border-transparent hover:border-primary",
              mode === "select" || item.mediaClass === "video"
                ? "cursor-pointer"
                : "cursor-grab hover:cursor-grab active:cursor-grabbing"
            )}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={handleButtonClick}
            aria-label={item.label}
          >
            <div className="relative h-full w-full">
              {!item.thumbnail ? (
                <div className="flex h-full w-full items-center justify-center bg-black/30">
                  <span className="text-white/60">Image not available</span>
                </div>
              ) : (
                <img
                  data-gallery-draggable-2="true"
                  // NB: "loading=lazy" is necessary to prevent loading GIGABYTES of images!
                  // It is a bit finnicky, too: you must include this attribute
                  // BEFORE the `src` attribute, or it won't work.
                  loading="lazy"
                  ref={imgRef}
                  src={item.thumbnail}
                  alt={item.label}
                  className={twMerge(
                    "h-full w-full bg-black/30",
                    imageFit === "contain" ? "object-contain" : "object-cover"
                  )}
                  draggable={false}
                  onError={onImageError}
                />
              )}
              {selected && (
                <div className="absolute right-8 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                </div>
              )}
            </div>
          </button>
        </Tooltip>
      )}
    </div>
  );
};
