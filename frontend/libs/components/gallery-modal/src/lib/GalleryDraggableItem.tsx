import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEllipsis, faUpload } from "@fortawesome/pro-solid-svg-icons";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { twMerge } from "tailwind-merge";
import galleryDnd from "./galleryDnd";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryItem } from "./gallery-modal";
import { PopoverMenu } from "@storyteller/ui-popover";
import { GalleryItemMenuItems } from "./GalleryItemMenuItems";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { toast } from "@storyteller/ui-toaster";

type ModalMode = "select" | "view";

export interface GalleryFolder {
  id: string;
  name: string;
  /** Parent folder id, or null/undefined for a root-level folder. */
  parentId?: string | null;
  hasStar?: boolean;
  /** Arbitrary color string (hex / named). Applied via inline style, never a class. */
  colorCode?: string | null;
  /** Resolved url of the user-chosen cover image, when set. */
  coverUrl?: string | null;
  /** Up to four resolved thumbnail urls for an auto cover collage. */
  collageUrls?: string[];
}

interface GalleryDraggableItemProps {
  item: GalleryItem;
  mode: ModalMode;
  activeFilter: string;
  selected: boolean;
  onClick: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  disableTooltipAndBadge?: boolean;
  imageFit?: "cover" | "contain";
  onDeleted?: (id: string) => void;
  /** Performs the actual delete. When absent, the delete menu item is hidden. */
  onDelete?: (id: string) => Promise<unknown>;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  maxSelections?: number;
  bulkSelected?: boolean;
  onBulkSelectToggle?: () => void;
  bulkSelectionMode?: boolean;
  getBulkDragItems?: () => GalleryItem[];
  folders?: GalleryFolder[];
  onAddToFolder?: (itemIds: string[], folderId: string) => void;
  onCreateFolderFromMenu?: () => void;
  /** Remove from the folder currently being viewed. Presence = inside a folder. */
  onRemoveFromFolder?: (itemIds: string[]) => void;
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
  onDelete,
  onEditClicked,
  maxSelections,
  bulkSelected = false,
  onBulkSelectToggle,
  bulkSelectionMode = false,
  getBulkDragItems,
  folders = [],
  onAddToFolder,
  onCreateFolderFromMenu,
  onRemoveFromFolder,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStarted = useRef(false);
  // Right-click context menu position (null = closed).
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  // For freshly-completed videos the backend may still be generating the
  // preview GIF, so the thumbnail URL 404s for a while. Show a spinner and
  // refresh the image every 5s until it loads.
  const isVideo = item.mediaClass === "video";
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setRetryAttempt(0);
    setVideoLoaded(false);
  }, [item.thumbnail]);

  useEffect(() => {
    if (!isVideo || videoLoaded || !item.thumbnail) return;
    const t = setInterval(() => setRetryAttempt((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [isVideo, videoLoaded, item.thumbnail]);

  const imgSrc =
    isVideo && item.thumbnail && retryAttempt > 0
      ? `${item.thumbnail}${item.thumbnail.includes("?") ? "&" : "?"}_r=${retryAttempt}`
      : (item.thumbnail ?? undefined);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (isVideo) return;
    onImageError(e);
  };

  const handleDelete = () => {
    if (!onDelete) return;
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
          const result = await onDelete(item.id);
          if (
            result &&
            typeof result === "object" &&
            "status" in result &&
            (result as any).status !== "success"
          ) {
            const msg =
              (result as any).error_message || "Failed to delete media.";
            console.error("Delete failed:", result);
            toast.error(msg);
            return;
          }
          onDeleted?.(item.id);
        } catch (err) {
          console.error("Delete threw:", err);
          toast.error(
            `Failed to delete media: ${err instanceof Error ? err.message : String(err)}`,
          );
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  };

  // Right-click context menu: clamp into the viewport + close on Escape.
  const ctxPanelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ctxMenu || !ctxPanelRef.current) return;
    const el = ctxPanelRef.current;
    const rect = el.getBoundingClientRect();
    const x =
      ctxMenu.x + rect.width > window.innerWidth
        ? Math.max(8, window.innerWidth - rect.width - 8)
        : ctxMenu.x;
    const y =
      ctxMenu.y + rect.height > window.innerHeight
        ? Math.max(8, window.innerHeight - rect.height - 8)
        : ctxMenu.y;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [ctxMenu]);
  useEffect(() => {
    if (!ctxMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctxMenu]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Left button only — right/middle click must not trigger the click→lightbox
    // (right-click opens the context menu via onContextMenu instead).
    if (event.button !== 0) return;
    dragStarted.current = false;
    const moveListener = (moveEvent: PointerEvent) => {
      const dx = moveEvent.pageX - event.pageX;
      const dy = moveEvent.pageY - event.pageY;
      if (!dragStarted.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragStarted.current = true;
        if (galleryDnd && !disableTooltipAndBadge) {
          const bulkItems =
            bulkSelectionMode && bulkSelected && getBulkDragItems
              ? getBulkDragItems()
              : undefined;
          galleryDnd.onPointerDown(event, item, bulkItems);
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
    if (event.button !== 0) return; // right/middle click → context menu, not lightbox
    if (bulkSelectionMode) return;
    const globalDrag = galleryDnd.getDragState();
    if (globalDrag.isDragging) return;
    if (
      !dragStarted.current &&
      (mode === "select" || !disableTooltipAndBadge)
    ) {
      onClick();
    }
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    if (dragStarted.current) return;
    const globalDrag = galleryDnd.getDragState();
    if (globalDrag.isDragging) return;
    if (mode === "select" || !disableTooltipAndBadge || bulkSelectionMode) {
      onClick();
    }
  };

  const showTooltip = !disableTooltipAndBadge && !bulkSelectionMode;

  const itemButton = (
    <button
      type="button"
      tabIndex={-1}
      className={twMerge(
        "w-full group relative overflow-visible rounded-md border-[3px] transition-colors outline-none focus:outline-none focus-visible:outline-none active:outline-none aspect-square",
        selected || bulkSelected
          ? "border-primary"
          : disableTooltipAndBadge
            ? "border-transparent hover:border-primary/80"
            : "border-transparent hover:border-primary",
        mode === "select"
          ? "cursor-pointer"
          : disableTooltipAndBadge && !bulkSelectionMode
            ? "cursor-pointer"
            : "cursor-grab hover:cursor-grab active:cursor-grabbing",
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
          <>
            <img
              data-gallery-draggable-1="true"
              // NB: "loading=lazy" is necessary to prevent loading GIGABYTES of images!
              // It is a bit finnicky, too: you must include this attribute
              // BEFORE the `src` attribute, or it won't work.
              loading="lazy"
              ref={imgRef}
              src={imgSrc}
              alt={item.label}
              className={twMerge(
                "h-full w-full bg-black/30",
                imageFit === "contain" ? "object-contain" : "object-cover",
                isVideo && !videoLoaded ? "opacity-0" : "",
              )}
              draggable={false}
              onLoad={() => {
                if (isVideo) setVideoLoaded(true);
              }}
              onError={handleImgError}
            />
            {isVideo && !videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <LoadingSpinner className="h-6 w-6" />
              </div>
            )}
          </>
        )}
        {selected && (
          <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <FontAwesomeIcon icon={faCheck} className="text-sm" />
          </div>
        )}
      </div>
    </button>
  );

  return (
    <div
      className="group relative w-full aspect-square"
      onContextMenu={(e) => {
        if (mode === "select") return;
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* dropdown menu */}
      {mode !== "select" && (
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
            panelClassName="min-w-36 p-1"
            closeOnUnhover
          >
            {(close) => (
              <GalleryItemMenuItems
                item={item}
                folders={folders}
                onEditClicked={onEditClicked}
                onAddToFolder={onAddToFolder}
                onCreateFolderFromMenu={onCreateFolderFromMenu}
                onRemoveFromFolder={onRemoveFromFolder}
                onDelete={onDelete ? handleDelete : undefined}
                close={close}
              />
            )}
          </PopoverMenu>
        </div>
      )}

      {/* Right-click context menu (portaled to body, positioned at cursor) */}
      {ctxMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setCtxMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu(null);
              }}
            />
            <div
              ref={ctxPanelRef}
              className="fixed z-[9999] min-w-44 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
            >
              <GalleryItemMenuItems
                item={item}
                folders={folders}
                onOpen={onClick}
                onEditClicked={onEditClicked}
                onAddToFolder={onAddToFolder}
                onCreateFolderFromMenu={onCreateFolderFromMenu}
                onRemoveFromFolder={onRemoveFromFolder}
                onDelete={onDelete ? handleDelete : undefined}
                close={() => setCtxMenu(null)}
              />
            </div>
          </>,
          document.body,
        )}

      {/* legacy delete button placeholder (kept conditional below) */}
      {/* Bulk selection checkbox — top-left (only when a bulk handler is wired) */}
      {mode !== "select" && onBulkSelectToggle && (
        <div
          className={twMerge(
            "absolute left-2 top-2 z-30 flex h-5 w-5 items-center justify-center rounded border-2 cursor-pointer transition-all duration-100",
            bulkSelected
              ? "bg-primary border-primary"
              : "border-white/60 bg-black/40 hover:border-white",
            bulkSelectionMode
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onBulkSelectToggle?.();
          }}
        >
          {bulkSelected && (
            <FontAwesomeIcon
              icon={faCheck}
              className="text-[10px] text-white"
            />
          )}
        </div>
      )}
      {/* Media class badge on hover — bottom-left */}
      {!disableTooltipAndBadge && item.mediaClass && (
        <div className="pointer-events-none absolute left-2 bottom-2 z-20 rounded-full bg-black/50 backdrop-blur-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {item.mediaClass === "dimensional" ? "3D" : item.mediaClass}
        </div>
      )}
      {/* Upload badge — bottom-right (always visible, even in select mode) */}
      {item.isUpload && (
        <div className="pointer-events-none absolute right-2 bottom-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 backdrop-blur-lg text-white">
          <FontAwesomeIcon icon={faUpload} className="text-[10px]" />
        </div>
      )}
      {/* Conditionally wrap with Tooltip — hidden when selecting or in bulk mode */}
      {showTooltip ? (
        <Tooltip
          position="bottom"
          delay={200}
          className="-mt-3 bg-ui-controls text-base-fg border border-ui-panel-border"
          content={
            <div className="flex flex-col items-center text-xs whitespace-nowrap">
              <span>
                <span className="font-bold">Drag</span>
                <span className="opacity-50">
                  {item.mediaClass === "dimensional"
                    ? " to add to scene"
                    : " to add"}
                </span>
              </span>
              <span>
                <span className="font-bold">Click</span>
                <span className="opacity-50"> to view</span>
              </span>
            </div>
          }
        >
          {itemButton}
        </Tooltip>
      ) : (
        itemButton
      )}
    </div>
  );
};
