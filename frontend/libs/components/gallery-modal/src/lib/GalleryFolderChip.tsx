import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faEllipsis } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { GalleryFolder } from "./GalleryDraggableItem";

interface GalleryFolderChipProps {
  folder: GalleryFolder;
  /** Direct subfolder count, shown as a subtitle. */
  childCount: number;
  onOpen: (folderId: string) => void;
  /** Opens the shared folder context menu (rename / delete / new subfolder). */
  onContextMenu: (folderId: string, x: number, y: number) => void;
}

/**
 * A folder tile rendered inside the gallery grid, sized like a gallery item
 * (aspect-square) so folders and files sit on the same grid — Google-Drive style.
 * Carries `data-folder-id` so the existing pointer drag-and-drop can drop media
 * onto it, and reuses the modal's portaled folder context menu via `onContextMenu`.
 */
export const GalleryFolderChip: React.FC<GalleryFolderChipProps> = ({
  folder,
  childCount,
  onOpen,
  onContextMenu,
}) => {
  const openMenuAt = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    onContextMenu(folder.id, rect.right, rect.bottom);
  };

  return (
    <button
      type="button"
      data-folder-id={folder.id}
      onClick={() => onOpen(folder.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(folder.id, e.clientX, e.clientY);
      }}
      className={twMerge(
        "group/chip relative flex w-full aspect-square flex-col items-center justify-center gap-2 rounded-md border-[3px] border-transparent bg-ui-controls/20 px-2 transition-colors cursor-pointer hover:border-primary/60 hover:bg-ui-controls/30",
        "[&.folder-drag-over]:border-primary/60 [&.folder-drag-over]:bg-primary/20",
      )}
      aria-label={folder.name}
    >
      <FontAwesomeIcon icon={faFolder} className="text-primary text-4xl" />
      <span className="line-clamp-2 break-words text-center text-xs font-medium text-base-fg/90">
        {folder.name}
      </span>
      {childCount > 0 && (
        <span className="text-[10px] text-base-fg/40">
          {childCount} folder{childCount === 1 ? "" : "s"}
        </span>
      )}
      <span
        role="button"
        tabIndex={-1}
        aria-label="Folder options"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          openMenuAt(e.currentTarget as HTMLElement);
        }}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ui-controls/60 text-base-fg opacity-0 transition-opacity hover:bg-ui-controls/90 group-hover/chip:opacity-100"
      >
        <FontAwesomeIcon icon={faEllipsis} className="text-sm" />
      </span>
    </button>
  );
};
