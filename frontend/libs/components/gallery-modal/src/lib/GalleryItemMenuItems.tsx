import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPencil,
  faTrashCan,
  faFolderPlus,
  faFolderMinus,
  faChevronRight,
  faFolder,
  faPlus,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { GalleryItem } from "./gallery-modal";
import { GalleryFolder } from "./GalleryDraggableItem";

// Touch-first devices have no hover and narrow viewports — the folder submenu
// expands inline (accordion) instead of flying out past the screen edge.
const COARSE_POINTER =
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: coarse)").matches === true;

export interface GalleryItemMenuItemsProps {
  item: GalleryItem;
  folders: GalleryFolder[];
  /** Open the lightbox (shown as "Open"). Omitted by the hover menu. */
  onOpen?: () => void;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  onAddToFolder?: (itemIds: string[], folderId: string) => void;
  onCreateFolderFromMenu?: () => void;
  /** Remove from the folder being viewed. Presence = we're inside a folder. */
  onRemoveFromFolder?: (itemIds: string[]) => void;
  /** Pre-wired delete (confirm flow lives in the host tile). */
  onDelete?: () => void;
  /** Closes the containing menu. */
  close: () => void;
}

const ROW =
  "flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm whitespace-nowrap";

/**
 * The gallery-tile menu body (Open / Edit / Add to Folder ▸ / Remove from
 * folder / Delete), shared by the hover ellipsis popover and the right-click
 * context menu. Each item renders only when its handler is provided.
 */
export const GalleryItemMenuItems: React.FC<GalleryItemMenuItemsProps> = ({
  item,
  folders,
  onOpen,
  onEditClicked,
  onAddToFolder,
  onCreateFolderFromMenu,
  onRemoveFromFolder,
  onDelete,
  close,
}) => {
  const [folderSubmenuOpen, setFolderSubmenuOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {onOpen && (
        <button
          type="button"
          className={ROW}
          onClick={(e) => {
            e.stopPropagation();
            close();
            onOpen();
          }}
        >
          <FontAwesomeIcon icon={faEye} className="text-base-fg w-4" />
          <span>
            {item.mediaClass === "video"
              ? "View video"
              : item.mediaClass === "dimensional"
                ? "View 3D"
                : "View image"}
          </span>
        </button>
      )}

      {item.mediaClass === "image" && onEditClicked && (
        <button
          type="button"
          className={ROW}
          onClick={async (e) => {
            e.stopPropagation();
            if (item.fullImage || item.thumbnail) {
              await onEditClicked(item.fullImage || item.thumbnail!, item.id);
            }
            close();
          }}
        >
          <FontAwesomeIcon icon={faPencil} className="text-base-fg w-4" />
          <span>Edit image</span>
        </button>
      )}

      {/* Add to Folder — with submenu */}
      {onAddToFolder && (
        <div
          className="relative"
          onMouseEnter={
            COARSE_POINTER ? undefined : () => setFolderSubmenuOpen(true)
          }
          onMouseLeave={
            COARSE_POINTER ? undefined : () => setFolderSubmenuOpen(false)
          }
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setFolderSubmenuOpen((v) => !v);
            }}
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFolderPlus} className="text-base-fg w-4" />
              <span>Add to Folder</span>
            </div>
            <FontAwesomeIcon
              icon={faChevronRight}
              className={twMerge(
                "text-[10px] text-base-fg/50 transition-transform",
                COARSE_POINTER && folderSubmenuOpen && "rotate-90",
              )}
            />
          </button>
          {folderSubmenuOpen &&
            (COARSE_POINTER ? (
              // Touch: expand inline (accordion) — a fly-out would overflow
              // the screen edge on narrow viewports.
              <div className="mb-1 max-h-48 overflow-y-auto rounded-md bg-ui-controls/20 p-1">
                <FolderList
                  item={item}
                  folders={folders}
                  onAddToFolder={onAddToFolder}
                  onCreateFolderFromMenu={onCreateFolderFromMenu}
                  closeAll={() => {
                    setFolderSubmenuOpen(false);
                    close();
                  }}
                />
              </div>
            ) : (
              <div className="absolute left-full top-0 -ml-1 pl-2 z-50">
                <div className="max-h-64 overflow-y-auto w-max min-w-36 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl">
                  <FolderList
                    item={item}
                    folders={folders}
                    onAddToFolder={onAddToFolder}
                    onCreateFolderFromMenu={onCreateFolderFromMenu}
                    closeAll={() => {
                      setFolderSubmenuOpen(false);
                      close();
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {onRemoveFromFolder && (
        <button
          type="button"
          className={ROW}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromFolder([item.id]);
            close();
          }}
        >
          <FontAwesomeIcon icon={faFolderMinus} className="text-base-fg w-4" />
          <span>Remove from folder</span>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            close();
            onDelete();
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} className="text-red w-4" />
          <span className="text-red">Delete</span>
        </button>
      )}
    </div>
  );
};

/** The folder target list inside "Add to Folder" (shared by the fly-out and the inline accordion). */
const FolderList = ({
  item,
  folders,
  onAddToFolder,
  onCreateFolderFromMenu,
  closeAll,
}: {
  item: GalleryItem;
  folders: GalleryFolder[];
  onAddToFolder?: (itemIds: string[], folderId: string) => void;
  onCreateFolderFromMenu?: () => void;
  closeAll: () => void;
}) => (
  <>
    {folders.map((folder) => (
      <button
        key={folder.id}
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm"
        onClick={(e) => {
          e.stopPropagation();
          onAddToFolder?.([item.id], folder.id);
          closeAll();
        }}
      >
        <FontAwesomeIcon
          icon={faFolder}
          className={folder.colorCode ? "text-xs" : "text-primary text-xs"}
          style={folder.colorCode ? { color: folder.colorCode } : undefined}
        />
        <span className="truncate">{folder.name}</span>
      </button>
    ))}
    {folders.length > 0 && (
      <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
    )}
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ui-controls/60 text-base-fg/70 text-sm whitespace-nowrap"
      onClick={(e) => {
        e.stopPropagation();
        closeAll();
        onCreateFolderFromMenu?.();
      }}
    >
      <FontAwesomeIcon icon={faPlus} className="text-xs w-4" />
      <span>New Folder</span>
    </button>
  </>
);
