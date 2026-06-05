"use client";

import { useMemo, useState } from "react";
import { PanelView } from "./base-panel";
import { MediaDragOverlay } from "../drag-overlay";
import { DraggableItem } from "../draggable-item";
import { Button } from "../../../components/ui/button";
import { useEditorAdapters } from "../../../EditorProvider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../../components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { DEFAULT_NEW_ELEMENT_DURATION } from "../../../timeline/creation";
import { mediaTimeFromSeconds, type MediaTime } from "../../../wasm";
import { useEditor } from "../../../editor/use-editor";
import { useFileUpload } from "../../../media/use-file-upload";
import { processMediaAssets } from "../../../media/processing";
import { showMediaUploadToast } from "../../../media/upload-toast";
import { SelectableItem } from "../../../selection/selectable-item";
import { SelectableSurface } from "../../../selection/selectable-surface";
import { useSelection } from "../../../selection/context";
import { useSelectionScope } from "../../../selection/hooks/use-selection-scope";
import { buildElementFromMedia } from "../../../timeline/element-utils";
import {
  type MediaSortKey,
  type MediaSortOrder,
  type MediaViewMode,
  useAssetsPanelStore,
} from "../assets-panel-store";
import { MASKABLE_ELEMENT_TYPES } from "../../../timeline/types";
import type { MediaAsset } from "../../../media/types";
import { cn } from "../../../utils/ui";
import {
  CloudUploadIcon,
  FolderLibraryIcon,
  GridViewIcon,
  LeftToRightListDashIcon,
  Sorting19Icon,
  Image02Icon,
  MusicNote03Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function MediaView() {
  const editor = useEditor();
  const { toast, mediaSource, assetGallery } = useEditorAdapters();
  const mediaFiles = useEditor((e) => e.media.getAssets());
  const activeProject = useEditor((e) => e.project.getActive());

  const {
    mediaViewMode,
    setMediaViewMode,
    highlightMediaId,
    clearHighlight,
    mediaSortBy,
    mediaSortOrder,
    setMediaSort,
  } = useAssetsPanelStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processFiles = async ({ files }: { files: File[] }) => {
    if (!files || files.length === 0) return;
    if (!activeProject) {
      toast.error("No active project");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    try {
      await showMediaUploadToast({
        filesCount: files.length,
        toast,
        promise: async () => {
          const processedAssets = await processMediaAssets({
            files,
            toast,
            mediaSource,
            onProgress: ({ progress }) => setProgress(progress),
          });
          for (const asset of processedAssets) {
            await editor.media.addMediaAsset({
              projectId: activeProject.metadata.id,
              asset,
            });
          }
          return {
            uploadedCount: processedAssets.length,
            assetNames: processedAssets.map((asset) => asset.name),
          };
        },
      });
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const { isDragOver, dragProps, openFilePicker, fileInputProps } =
    useFileUpload({
      accept: "image/*,video/*,audio/*",
      multiple: true,
      onFilesSelected: (files) => processFiles({ files }),
    });

  const handleBrowseGallery = async () => {
    if (!assetGallery || !activeProject) return;
    let selections: Awaited<ReturnType<typeof assetGallery.openPicker>>;
    try {
      selections = await assetGallery.openPicker({
        kinds: ["video", "image", "audio"],
      });
    } catch (error) {
      console.error("Gallery picker failed:", error);
      toast.error("Couldn't open the gallery");
      return;
    }
    if (selections.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    const abort = new AbortController();
    try {
      await showMediaUploadToast({
        filesCount: selections.length,
        toast,
        promise: async () => {
          // Pre-resolved handles: fetch each CDN URL into a File so the
          // lib's downstream consumers (audio, scene-builder, retime)
          // that need a live Blob keep working. processMediaAssets
          // skips uploadLocalFile because `existingHandles` is set.
          //
          // Per-item try/catch so a single CORS/403/network failure
          // doesn't abort the whole batch. Run the fetches in parallel —
          // sequential awaits used to stall the toast progress bar for
          // the full pre-fetch loop.
          const fetched = await Promise.all(
            selections.map(async (selection) => {
              try {
                const resolved = await mediaSource.resolveMedia(
                  selection.handle,
                );
                const response = await fetch(resolved.url, {
                  signal: abort.signal,
                });
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }
                const blob = await response.blob();
                return {
                  file: new File([blob], selection.name, {
                    type: resolved.mime,
                  }),
                  handle: selection.handle,
                  resolved,
                };
              } catch (error) {
                console.error(
                  "Gallery import failed for",
                  selection.name,
                  error,
                );
                toast.error(`Couldn't import ${selection.name}`, {
                  description:
                    error instanceof Error ? error.message : undefined,
                });
                return null;
              }
            }),
          );
          const successes = fetched.filter(
            (entry): entry is NonNullable<typeof entry> => entry !== null,
          );
          if (successes.length === 0) {
            return { uploadedCount: 0, assetNames: [] };
          }
          const processedAssets = await processMediaAssets({
            files: successes.map((entry) => entry.file),
            toast,
            mediaSource,
            existingHandles: successes.map((entry) => entry.handle),
            // Pass the already-resolved ResolvedMedia through so
            // processMediaAssets doesn't re-call resolveMedia (which
            // for the webapp adapter is a GetMediaFileByToken HTTP
            // roundtrip per asset).
            existingResolved: successes.map((entry) => entry.resolved),
            onProgress: ({ progress }) => setProgress(progress),
          });
          for (const asset of processedAssets) {
            await editor.media.addMediaAsset({
              projectId: activeProject.metadata.id,
              asset,
            });
          }
          return {
            uploadedCount: processedAssets.length,
            assetNames: processedAssets.map((asset) => asset.name),
          };
        },
      });
    } catch (error) {
      console.error("Error importing from gallery:", error);
    } finally {
      abort.abort();
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleRemove = ({
    event,
    ids,
  }: {
    event: React.MouseEvent;
    ids: string[];
  }) => {
    event.stopPropagation();

    if (!activeProject) return;
    editor.media.removeMediaAssets({
      projectId: activeProject.metadata.id,
      ids,
    });
  };

  const handleSort = ({ key }: { key: MediaSortKey }) => {
    if (mediaSortBy === key) {
      setMediaSort({
        key,
        order: mediaSortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      setMediaSort({ key, order: "asc" });
    }
  };

  const filteredMediaItems = useMemo(() => {
    const filtered = mediaFiles.filter((item) => !item.ephemeral);

    filtered.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (mediaSortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "type":
          valueA = a.type;
          valueB = b.type;
          break;
        case "duration":
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
        case "size":
          valueA = a.file.size;
          valueB = b.file.size;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return mediaSortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return mediaSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mediaFiles, mediaSortBy, mediaSortOrder]);
  const orderedMediaIds = useMemo(() => {
    return filteredMediaItems.map((item) => item.id);
  }, [filteredMediaItems]);

  return (
    <>
      <input {...fileInputProps} />

      <PanelView
        title="Assets"
        actions={
          <MediaActions
            mediaViewMode={mediaViewMode}
            setMediaViewMode={setMediaViewMode}
            isProcessing={isProcessing}
            sortBy={mediaSortBy}
            sortOrder={mediaSortOrder}
            onSort={handleSort}
            onImport={openFilePicker}
            onBrowseGallery={assetGallery ? handleBrowseGallery : undefined}
          />
        }
        className={cn(isDragOver && "bg-accent/30")}
        contentClassName="h-full"
        {...dragProps}
      >
        {isDragOver || filteredMediaItems.length === 0 ? (
          <MediaDragOverlay
            isVisible={true}
            isProcessing={isProcessing}
            progress={progress}
            onClick={openFilePicker}
          />
        ) : (
          <SelectableSurface
            ariaLabel="Assets"
            orderedIds={orderedMediaIds}
            revealId={highlightMediaId}
            onRevealComplete={clearHighlight}
          >
            <MediaScopeRegistrar />
            <MediaItemList
              items={filteredMediaItems}
              mode={mediaViewMode}
              onRemove={handleRemove}
            />
          </SelectableSurface>
        )}
      </PanelView>
    </>
  );
}

function MediaScopeRegistrar() {
  useSelectionScope();
  return null;
}

function MediaAssetDraggable({
  item,
  preview,
  variant,
  isRounded,
}: {
  item: MediaAsset;
  preview: React.ReactNode;
  variant: "card" | "compact";
  isRounded?: boolean;
}) {
  const editor = useEditor();

  const addElementAtTime = ({
    asset,
    startTime,
  }: {
    asset: MediaAsset;
    startTime: MediaTime;
  }) => {
    const duration =
      asset.duration != null
        ? mediaTimeFromSeconds({ seconds: asset.duration })
        : DEFAULT_NEW_ELEMENT_DURATION;
    const element = buildElementFromMedia({
      mediaId: asset.id,
      mediaType: asset.type,
      name: asset.name,
      duration,
      startTime,
    });
    editor.timeline.insertElement({
      element,
      placement: { mode: "auto" },
    });
  };

  return (
    <DraggableItem
      name={item.name}
      preview={preview}
      dragData={{
        id: item.id,
        type: "media",
        mediaType: item.type,
        name: item.name,
        ...(item.type !== "audio" && {
          targetElementTypes: [...MASKABLE_ELEMENT_TYPES],
        }),
      }}
      shouldShowPlusOnDrag={false}
      onAddToTimeline={({ currentTime }) =>
        addElementAtTime({ asset: item, startTime: currentTime })
      }
      variant={variant}
      isRounded={isRounded}
    />
  );
}

function MediaItemWithContextMenu({
  item,
  children,
  onRemove,
}: {
  item: MediaAsset;
  children: React.ReactNode;
  onRemove: ({
    event,
    ids,
  }: {
    event: React.MouseEvent;
    ids: string[];
  }) => void;
}) {
  const { isSelected, selectedIds } = useSelection();
  const idsToDelete = isSelected(item.id) ? selectedIds : [item.id];
  const deleteLabel =
    idsToDelete.length > 1 ? `Delete ${idsToDelete.length} items` : "Delete";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          variant="destructive"
          onClick={(event: React.MouseEvent<HTMLDivElement>) =>
            onRemove({ event, ids: idsToDelete })
          }
        >
          {deleteLabel}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function MediaItemList({
  items,
  mode,
  onRemove,
}: {
  items: MediaAsset[];
  mode: MediaViewMode;
  onRemove: ({
    event,
    ids,
  }: {
    event: React.MouseEvent;
    ids: string[];
  }) => void;
}) {
  const isGrid = mode === "grid";

  return (
    <div
      className={cn(isGrid ? "grid gap-4" : "flex flex-col gap-1.5")}
      style={
        isGrid ? { gridTemplateColumns: "repeat(auto-fill, 7rem)" } : undefined
      }
    >
      {items.map((item) => (
        <MediaItemWithContextMenu item={item} onRemove={onRemove} key={item.id}>
          <SelectableItem className={cn(!isGrid && "w-full")} id={item.id}>
            <MediaAssetDraggable
              item={item}
              preview={
                <MediaPreview
                  item={item}
                  variant={isGrid ? "grid" : "compact"}
                />
              }
              variant={isGrid ? "card" : "compact"}
              isRounded={isGrid ? false : undefined}
            />
          </SelectableItem>
        </MediaItemWithContextMenu>
      ))}
    </div>
  );
}

function formatDuration({ duration }: { duration: number }) {
  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function MediaDurationBadge({ duration }: { duration?: number }) {
  if (!duration) return null;

  return (
    <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-xs text-white">
      {formatDuration({ duration })}
    </div>
  );
}

function MediaDurationLabel({ duration }: { duration?: number }) {
  if (!duration) return null;

  return (
    <span className="text-xs opacity-70">{formatDuration({ duration })}</span>
  );
}

function MediaTypePlaceholder({
  icon,
  label,
  duration,
  variant,
}: {
  icon: IconSvgElement;
  label: string;
  duration?: number;
  variant: "muted" | "bordered";
}) {
  const iconClassName = cn("size-6", variant === "bordered" && "mb-1");

  return (
    <div
      className={cn(
        "text-muted-foreground flex size-full flex-col items-center justify-center rounded",
        variant === "muted" ? "bg-muted/30" : "border",
      )}
    >
      <HugeiconsIcon icon={icon} className={iconClassName} />
      <span className="text-xs">{label}</span>
      <MediaDurationLabel duration={duration} />
    </div>
  );
}

function MediaPreview({
  item,
  variant = "grid",
}: {
  item: MediaAsset;
  variant?: "grid" | "compact";
}) {
  const shouldShowDurationBadge = variant === "grid";

  if (item.type === "image") {
    return (
      <div className="relative flex size-full items-center justify-center bg-muted">
        {/* next/image replaced by a plain <img> — the lib is host-agnostic
            and cannot assume Next's optimized image pipeline. */}
        <img
          src={item.url ?? ""}
          alt={item.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (item.type === "video") {
    if (item.thumbnailUrl) {
      return (
        <div className="relative size-full">
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="absolute inset-0 h-full w-full rounded object-cover"
            loading="lazy"
          />
          {shouldShowDurationBadge ? (
            <MediaDurationBadge duration={item.duration} />
          ) : null}
        </div>
      );
    }

    return (
      <MediaTypePlaceholder
        icon={Video01Icon}
        label="Video"
        duration={item.duration}
        variant="muted"
      />
    );
  }

  if (item.type === "audio") {
    return (
      <MediaTypePlaceholder
        icon={MusicNote03Icon}
        label="Audio"
        duration={item.duration}
        variant="bordered"
      />
    );
  }

  return (
    <MediaTypePlaceholder icon={Image02Icon} label="Unknown" variant="muted" />
  );
}

function MediaActions({
  mediaViewMode,
  setMediaViewMode,
  isProcessing,
  sortBy,
  sortOrder,
  onSort,
  onImport,
  onBrowseGallery,
}: {
  mediaViewMode: MediaViewMode;
  setMediaViewMode: (mode: MediaViewMode) => void;
  isProcessing: boolean;
  sortBy: MediaSortKey;
  sortOrder: MediaSortOrder;
  onSort: ({ key }: { key: MediaSortKey }) => void;
  onImport: () => void;
  // Optional: only rendered when the host wires an AssetGalleryAdapter.
  onBrowseGallery?: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                setMediaViewMode(mediaViewMode === "grid" ? "list" : "grid")
              }
              disabled={isProcessing}
              className="items-center justify-center"
            >
              {mediaViewMode === "grid" ? (
                <HugeiconsIcon icon={LeftToRightListDashIcon} />
              ) : (
                <HugeiconsIcon icon={GridViewIcon} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {mediaViewMode === "grid"
                ? "Switch to list view"
                : "Switch to grid view"}
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isProcessing}
                  className="items-center justify-center"
                >
                  <HugeiconsIcon icon={Sorting19Icon} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <DropdownMenuContent align="end">
              <SortMenuItem
                label="Name"
                sortKey="name"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortMenuItem
                label="Type"
                sortKey="type"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortMenuItem
                label="Duration"
                sortKey="duration"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
              <SortMenuItem
                label="File size"
                sortKey="size"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            <p>
              Sort by {sortBy} (
              {sortOrder === "asc" ? "ascending" : "descending"})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {onBrowseGallery ? (
        <Button
          variant="outline"
          onClick={onBrowseGallery}
          disabled={isProcessing}
          size="sm"
          className="items-center justify-center gap-1.5"
        >
          <HugeiconsIcon icon={FolderLibraryIcon} />
          Browse
        </Button>
      ) : null}
      <Button
        variant="outline"
        onClick={onImport}
        disabled={isProcessing}
        size="sm"
        className="items-center justify-center gap-1.5"
      >
        <HugeiconsIcon icon={CloudUploadIcon} />
        Import
      </Button>
    </div>
  );
}

function SortMenuItem({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
}: {
  label: string;
  sortKey: MediaSortKey;
  currentSortBy: MediaSortKey;
  currentSortOrder: MediaSortOrder;
  onSort: ({ key }: { key: MediaSortKey }) => void;
}) {
  const isActive = currentSortBy === sortKey;
  const arrow = isActive ? (currentSortOrder === "asc" ? "↑" : "↓") : "";

  return (
    <DropdownMenuItem onClick={() => onSort({ key: sortKey })}>
      {label} {arrow}
    </DropdownMenuItem>
  );
}
