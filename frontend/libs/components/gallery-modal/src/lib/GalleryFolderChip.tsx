import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faEllipsis, faStar } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { GalleryFolder } from "./GalleryDraggableItem";

interface GalleryFolderChipProps {
  folder: GalleryFolder;
  /** Direct subfolder count, shown as a subtitle. */
  childCount: number;
  onOpen: (folderId: string) => void;
  /** Opens the shared folder context menu (rename / delete / color / star / new subfolder). */
  onContextMenu: (folderId: string, x: number, y: number) => void;
}

/** A folder thumbnail that removes itself on error so a fallback can show. */
const ChipImg = ({ src, className }: { src: string; className: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed)
    return <div className={twMerge(className, "bg-ui-controls/30")} />;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * A folder tile rendered inside the gallery grid, sized like a gallery item
 * (aspect-square). Shows, in priority: a custom cover, an auto 2×2 collage of
 * recent media, or a folder icon. Carries `data-folder-id` so pointer drag-drop
 * can drop media onto it; the ellipsis / right-click opens the shared menu.
 */
export const GalleryFolderChip: React.FC<GalleryFolderChipProps> = ({
  folder,
  childCount,
  onOpen,
  onContextMenu,
}) => {
  const { colorCode, hasStar, name } = folder;
  const coverUrl = folder.coverUrl;
  const collageUrls = folder.collageUrls ?? [];
  const hasCover = !!coverUrl;
  const hasCollage = !hasCover && collageUrls.length > 0;
  const hasArt = hasCover || hasCollage;

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
      style={colorCode ? { borderColor: colorCode } : undefined}
      className={twMerge(
        "group/chip relative w-full aspect-square overflow-hidden rounded-md border-2 border-ui-controls/40 bg-ui-controls/20 transition-colors cursor-pointer hover:border-primary/60",
        "[&.folder-drag-over]:border-primary/60 [&.folder-drag-over]:bg-primary/20",
      )}
      aria-label={name}
    >
      {/* ── Background art ── */}
      {hasCover ? (
        <ChipImg
          src={coverUrl!}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : hasCollage && collageUrls.length === 1 ? (
        <ChipImg
          src={collageUrls[0]}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : hasCollage ? (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-black/20">
          {Array.from({ length: 4 }).map((_, i) =>
            collageUrls[i] ? (
              <ChipImg
                key={i}
                src={collageUrls[i]}
                className="h-full w-full object-cover"
              />
            ) : (
              <div key={i} className="bg-ui-controls/30" />
            ),
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faFolder}
            className={colorCode ? "text-4xl" : "text-4xl text-primary"}
            style={colorCode ? { color: colorCode } : undefined}
          />
        </div>
      )}

      {/* Legibility scrim for the label over cover/collage art */}
      {hasArt && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent" />
      )}

      {/* Star (favorite) */}
      {hasStar && (
        <FontAwesomeIcon
          icon={faStar}
          className="absolute left-2 top-2 text-sm text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        />
      )}

      {/* Name + subfolder count */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 p-2 text-center">
        <div className="flex items-center gap-1.5 min-w-0 max-w-full">
          {/* Folder marker (with the folder color) so a covered/collaged tile
              still reads as a folder. */}
          {hasArt && (
            <FontAwesomeIcon
              icon={faFolder}
              className={twMerge(
                "flex-shrink-0 text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]",
                colorCode ? "" : "text-primary",
              )}
              style={colorCode ? { color: colorCode } : undefined}
            />
          )}
          <span
            className={twMerge(
              "line-clamp-2 break-words text-left text-sm font-medium",
              hasArt
                ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                : "text-base-fg/90",
            )}
          >
            {name}
          </span>
        </div>
        {childCount > 0 && (
          <span
            className={twMerge(
              "text-left text-[10px]",
              hasArt ? "text-white/70" : "text-base-fg/40",
            )}
          >
            {childCount} folder{childCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Options menu */}
      <span
        role="button"
        tabIndex={-1}
        aria-label="Folder options"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          openMenuAt(e.currentTarget as HTMLElement);
        }}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover/chip:opacity-100"
      >
        <FontAwesomeIcon icon={faEllipsis} className="text-sm" />
      </span>
    </button>
  );
};
