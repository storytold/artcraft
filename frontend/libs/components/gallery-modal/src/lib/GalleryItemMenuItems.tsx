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
import { GalleryItem } from "./gallery-modal";
import { GalleryFolder } from "./GalleryDraggableItem";

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
  "flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm";

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
          <span>Open</span>
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
          onMouseEnter={() => setFolderSubmenuOpen(true)}
          onMouseLeave={() => setFolderSubmenuOpen(false)}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm"
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
              className="text-[10px] text-base-fg/50"
            />
          </button>
          {folderSubmenuOpen && (
            <div className="absolute left-full top-0 -ml-1 pl-2 z-50">
              <div className="max-h-64 overflow-y-auto min-w-36 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ui-controls/60 text-base-fg text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToFolder([item.id], folder.id);
                      setFolderSubmenuOpen(false);
                      close();
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
                  className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ui-controls/60 text-base-fg/70 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderSubmenuOpen(false);
                    close();
                    onCreateFolderFromMenu?.();
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs w-4" />
                  <span>New Folder</span>
                </button>
              </div>
            </div>
          )}
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
          className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm"
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
