import { Modal } from "@storyteller/ui-modal";
import { LightboxModal } from "@storyteller/ui-lightbox-modal";
import { Button } from "@storyteller/ui-button";
import { CloseButton } from "@storyteller/ui-close-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import type { Prompts } from "@storyteller/api";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import {
  FilterMediaClasses,
  FilterMediaType,
  FoldersApi,
  GalleryModalApi,
  MediaFilesApi,
  UsersApi,
} from "@storyteller/api";
import type { FolderInfo, FolderMediaFileListItem } from "@storyteller/api";
import type { GalleryFolder } from "./GalleryDraggableItem";
import { compareFolders } from "./folderUtils";
import {
  mapFolderInfo,
  galleryItemToCollageUrl,
  mergeCollageUrls,
} from "./folderMapping";
import { promptFolderDrop } from "./promptFolderDrop";
import { FolderColorRow } from "./FolderColorRow";
import { FolderNameDialog } from "./FolderNameDialog";
import { toast } from "@storyteller/ui-toaster";
import { twMerge } from "tailwind-merge";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { GalleryFolderChip } from "./GalleryFolderChip";
import { useSignals } from "@preact/signals-react/runtime";
import {
  getThumbnailUrl,
  getMediaThumbnail,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
} from "@storyteller/common";
import {
  galleryModalVisibleDuringDrag,
  galleryReopenAfterDragSignal,
  galleryModalVisibleViewMode,
  galleryModalLightboxMediaId,
  galleryModalLightboxImage,
  galleryModalLightboxVisible,
  galleryModalLightboxNavPrev,
  galleryModalLightboxNavNext,
} from "./galleryModalSignals";
import { FOLDER_DROP_EVENT } from "./galleryDnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBorderAll,
  faImage,
  faVideo,
  faCube,
  faUpload,
  faExpand,
  faCompress,
  faArrowsRotate,
  faTrashCan,
  faXmark,
  faFolder,
  faPlus,
  faFolderPlus,
  faEllipsis,
  faPencil,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { Checkbox } from "@storyteller/ui-checkbox";

// ─── Module-level gallery cache ───────────────────────────────────────────────
// Persists gallery items across modal open/close so users see content instantly.
interface GalleryCacheEntry {
  items: GalleryItem[];
  pageIndex: number;
  hasMore: boolean;
  timestamp: number;
}

const galleryCacheMap = new Map<string, GalleryCacheEntry>();
const usersApiSingleton = new UsersApi();

/** Clear the module-level gallery item cache. Call on logout so the next user doesn't see stale items. */
export const clearGalleryCache = () => {
  galleryCacheMap.clear();
};

/** Fetch the current session's username fresh every time — the session may have changed (logout/login). */
async function fetchCurrentUsername(): Promise<string | null> {
  try {
    const session = await usersApiSingleton.GetSession();
    if (session.success && session.data?.user) {
      return session.data.user.username;
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Skeleton loader component ────────────────────────────────────────────────
const SKELETON_COUNT = 15;

const SkeletonGrid = ({ columns }: { columns: number }) => {
  const gapClass = columns <= 4 ? "gap-2" : columns <= 7 ? "gap-2" : "gap-0.5";
  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-200">
      {/* Fake date heading */}
      <div>
        <div className="h-4 w-24 rounded bg-white/[0.06] mb-3" />
        <div
          className={twMerge("grid", gapClass)}
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden">
              <div
                className="h-full w-full bg-white/[0.06]"
                style={{
                  animation: `pulse 1.8s ease-in-out ${i * 0.07}s infinite`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

// ─── Lazy date-group virtualization ───────────────────────────────────────────
// Bidirectional: mounts groups when they scroll within 800px of the viewport,
// and unmounts them when they scroll beyond that range. Measured heights are
// used for placeholders so scroll position stays rock-solid.

interface LazyDateGroupProps {
  /** If true the group renders on mount (use for first N visible groups). */
  eager: boolean;
  /** Estimated item count for placeholder height calculation. */
  itemCount: number;
  /** Current grid column count, used to estimate placeholder height. */
  gridColumns: number;
  /** The scroll container used as IntersectionObserver root. */
  scrollRoot: HTMLDivElement | null;
  children: React.ReactNode;
}

const LazyDateGroup = React.memo(
  ({
    eager,
    itemCount,
    gridColumns,
    scrollRoot,
    children,
  }: LazyDateGroupProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNearViewport, setIsNearViewport] = useState(eager);
    // Store the last measured height so placeholders match exactly
    const measuredHeightRef = useRef<number | null>(null);

    // Measure rendered height on every commit while visible
    useEffect(() => {
      if (isNearViewport && containerRef.current) {
        measuredHeightRef.current = containerRef.current.offsetHeight;
      }
    });

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsNearViewport(entry.isIntersecting);
        },
        {
          root: scrollRoot,
          rootMargin: "800px 0px", // mount/unmount buffer
        },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [scrollRoot]);

    if (!isNearViewport) {
      // Use measured height if available, otherwise estimate
      const height =
        measuredHeightRef.current ??
        Math.ceil(itemCount / gridColumns) * 120 + 36;
      return (
        <div
          ref={containerRef}
          style={{ height, minHeight: height }}
          aria-hidden
        />
      );
    }

    return <div ref={containerRef}>{children}</div>;
  },
);
LazyDateGroup.displayName = "LazyDateGroup";

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  // Thumbnail template is not a usable URL yet. It has some variables
  // like `{WIDTH}` which must be replaced downstream.
  thumbnailUrlTemplate?: string;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
  assetType?: string;
  isUpload?: boolean;
  batchImageToken?: string;
  mediaTokens?: string[];
  imageUrls?: string[];
}

interface GroupedItems {
  [date: string]: GalleryItem[];
}

type ModalMode = "select" | "view";

interface GalleryModalProps {
  onClose?: () => void;
  mode: ModalMode;
  selectedItemIds?: string[];
  onSelectItem?: (id: string) => void;
  maxSelections?: number;
  onUseSelected?: (selectedItems: GalleryItem[]) => void;
  useSelectedLoading?: boolean;
  onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined,
  ) => Promise<void>;
  isOpen?: boolean;
  forceFilter?: string;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  onTurnIntoVideoClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onRemoveBackgroundClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onMake3DObjectClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onMake3DWorldClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onRecreateClicked?: (data: {
    promptData: Prompts;
    mediaClass: string | undefined;
  }) => void;
  /** Hide the filter popover entirely. When unset, the filter button shows (optionally locked via forceFilter). */
  hideFilter?: boolean;
  /** Delete a media file by id. Required in view mode to show any delete UI. */
  onDeleteMedia?: (id: string) => Promise<unknown>;
  /** Wire external event sources (generation-complete, media-deleted). Returns an unsubscribe fn. */
  subscribeToMediaEvents?: (handlers: {
    onGenerationComplete: () => void;
    onMediaDeleted: (mediaId: string) => void;
  }) => () => void;
}

// --- Constants (never re-created) ---

const EMPTY_SELECTED_IDS: string[] = [];

const SIDEBAR_FILTERS = [
  { id: "all", label: "All Assets", icon: faBorderAll },
  { id: "image", label: "Image", icon: faImage },
  { id: "video", label: "Video", icon: faVideo },
  { id: "3d", label: "3D", icon: faCube },
  { id: "uploaded", label: "Uploaded", icon: faUpload },
];

const getFilterMediaClass = (filter: string) => {
  switch (filter) {
    case "image":
      return [FilterMediaClasses.IMAGE];
    case "video":
      return [FilterMediaClasses.VIDEO];
    case "3d":
      return [FilterMediaClasses.DIMENSIONAL];
    case "uploaded":
      return [
        FilterMediaClasses.IMAGE,
        FilterMediaClasses.VIDEO,
        FilterMediaClasses.DIMENSIONAL,
      ];
    default:
      return undefined;
  }
};

const getLabel = (item: any) => {
  if (!!item.maybe_title) {
    return item.maybe_title;
  }
  switch (item.media_class) {
    case "image":
      return "Image Generation";
    case "video":
      return "Video Generation";
    case "dimensional":
      return "3D Object Generation";
    default:
      return "Generation";
  }
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const PAGE_SIZE = 100;

// Folder media is paginated via cursor; one scroll page at a time.
const FOLDER_PAGE_SIZE = 60;

const SHOW_UPLOADS_STORAGE_KEY = "gallery-modal-show-uploads";

/** Small thumbnail used in the bulk-selection footer bar. */
const BulkThumb = ({
  thumbnail,
  placeholderIcon,
}: {
  thumbnail: string | null;
  placeholderIcon: any;
}) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!thumbnail && !failed;

  return (
    <div className="h-8 w-8 rounded overflow-hidden border-2 border-ui-panel bg-black/30 flex-shrink-0">
      {showImage ? (
        <img
          src={thumbnail}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-black/50">
          <FontAwesomeIcon
            icon={placeholderIcon}
            className="text-xs text-white/50"
          />
        </div>
      )}
    </div>
  );
};

/** Reusable folder context menu (star + color + new subfolder + rename + delete). */
const FolderContextMenuItems = ({
  folderId,
  hasStar,
  colorCode,
  onRename,
  onDelete,
  onNewSubfolder,
  onToggleStar,
  onSetColor,
  className,
  style,
}: {
  folderId: string;
  hasStar?: boolean;
  colorCode?: string | null;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onNewSubfolder: (parentId: string) => void;
  onToggleStar: (id: string, hasStar: boolean) => void;
  onSetColor: (id: string, color: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={twMerge(
      "min-w-44 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl z-[59]",
      className,
    )}
    style={style}
  >
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
      onClick={() => onToggleStar(folderId, !hasStar)}
    >
      <FontAwesomeIcon
        icon={faStar}
        className={twMerge(
          "w-4",
          hasStar ? "text-amber-400" : "text-base-fg/40",
        )}
      />
      <span>{hasStar ? "Unstar" : "Star"}</span>
    </button>
    <FolderColorRow
      colorCode={colorCode}
      onSetColor={(c) => onSetColor(folderId, c)}
    />
    <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
      onClick={() => onNewSubfolder(folderId)}
    >
      <FontAwesomeIcon icon={faFolderPlus} className="w-4" />
      <span>New subfolder</span>
    </button>
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
      onClick={() => onRename(folderId)}
    >
      <FontAwesomeIcon icon={faPencil} className="w-4" />
      <span>Rename</span>
    </button>
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-red"
      onClick={() => onDelete(folderId)}
    >
      <FontAwesomeIcon icon={faTrashCan} className="w-4" />
      <span>Delete folder</span>
    </button>
  </div>
);

export const GalleryModal = React.memo(
  ({
    onClose,
    mode = "view",
    selectedItemIds = EMPTY_SELECTED_IDS,
    onSelectItem,
    maxSelections = 4,
    onUseSelected,
    useSelectedLoading,
    onDownloadClicked,
    onAddToSceneClicked,
    isOpen,
    forceFilter,
    onEditClicked,
    onTurnIntoVideoClicked,
    onRemoveBackgroundClicked,
    onMake3DObjectClicked,
    onMake3DWorldClicked,
    onRecreateClicked,
    hideFilter,
    onDeleteMedia,
    subscribeToMediaEvents,
  }: GalleryModalProps) => {
    const [loading, setLoading] = useState(false);
    // Separate state for pagination spinner (bottom of list) — not shared with background refresh
    const [paginationLoading, setPaginationLoading] = useState(false);
    // Ref-based lock to prevent re-entrant loadItems calls
    const isLoadingRef = useRef(false);
    // Lightbox state is now handled via signals
    const lightboxImageSignal = galleryModalLightboxImage;
    const lightboxVisibleSignal = galleryModalLightboxVisible;
    const failedImageUrls = useRef<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [username, setUsername] = useState<string>("");
    const [usernameError, setUsernameError] = useState(false);
    const [usernameRetryCount, setUsernameRetryCount] = useState(0);
    const [activeFilter, setActiveFilter] = useState(forceFilter || "all");
    const minColumns = 3;
    const maxColumns = 12;
    // Default gridColumns to 5 on desktop; narrow screens are locked to 2 columns
    const defaultGridColumns = 5;
    const [isNarrow, setIsNarrow] = useState(
      () => typeof window !== "undefined" && window.innerWidth < 640,
    );
    useEffect(() => {
      const handler = () => setIsNarrow(window.innerWidth < 640);
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);
    const [sliderValue, setSliderValue] = useState(
      maxColumns - (defaultGridColumns - minColumns),
    );
    const gridColumns = isNarrow ? 2 : maxColumns - (sliderValue - minColumns);
    const [imageFit, setImageFit] = useState<"cover" | "contain">("contain");
    const [showUploads, setShowUploads] = useState<boolean>(() => {
      try {
        const stored = localStorage.getItem(SHOW_UPLOADS_STORAGE_KEY);
        return stored === null ? false : stored === "true";
      } catch {
        return false;
      }
    });
    useEffect(() => {
      try {
        localStorage.setItem(SHOW_UPLOADS_STORAGE_KEY, String(showUploads));
      } catch {
        // ignore
      }
    }, [showUploads]);
    const [allItems, setAllItems] = useState<GalleryItem[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Track whether this is the very first load (no cache, no items yet)
    const [initialLoading, setInitialLoading] = useState(false);

    // Error message from failed listUserMediaFiles call (null = no error)
    const [itemsLoadError, setItemsLoadError] = useState<string | null>(null);

    // Bulk selection state (view mode only)
    const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
      new Set(),
    );
    const bulkSelectionMode = bulkSelectedIds.size > 0;

    // Folders state. Folders nest via `parentId` (null = root) so the gallery
    // supports folders-inside-folders (Google-Drive style).
    const [folders, setFolders] = useState<GalleryFolder[]>([]);
    // Top-level view tab (view mode only): the flat library vs the folder browser.
    const [galleryTab, setGalleryTab] = useState<"unsorted" | "folders">(
      "unsorted",
    );
    const galleryTabRef = useRef(galleryTab);
    galleryTabRef.current = galleryTab;
    const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
    // Parent the next-created folder will be nested under (null = root).
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(
      null,
    );

    // Active folder view. Resolved media items are cached per folder so
    // reopening a folder shows instantly while a fresh fetch runs in the background.
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [folderMediaItems, setFolderMediaItems] = useState<
      Record<string, GalleryItem[]>
    >({});
    const [folderContentLoading, setFolderContentLoading] = useState(false);
    // Bottom spinner while paginating the open folder's media.
    const [folderLoadingMore, setFolderLoadingMore] = useState(false);
    // Per-folder cursor / has-more / in-flight guard for infinite scroll.
    const folderCursorRef = useRef<Record<string, string | undefined>>({});
    const folderHasMoreRef = useRef<Record<string, boolean>>({});
    const folderLoadingRef = useRef<Record<string, boolean>>({});
    // Rename state — shared by inline (header) and modal (sidebar) flows
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(
      null,
    );
    const [renameValue, setRenameValue] = useState("");
    const renameInputRef = useRef<HTMLInputElement>(null);
    // Whether rename was triggered from sidebar (show modal) vs header (inline)
    const [renameViaModal, setRenameViaModal] = useState(false);
    const [folderMenuOpen, setFolderMenuOpen] = useState(false);
    // Context menu for sidebar folder right-click
    const [contextMenu, setContextMenu] = useState<{
      folderId: string;
      x: number;
      y: number;
    } | null>(null);

    const activeFolder = activeFolderId
      ? (folders.find((f) => f.id === activeFolderId) ?? null)
      : null;

    // Subfolders of the current location (root when no folder is open).
    const currentSubfolders = useMemo(
      () =>
        folders
          .filter((f) => (f.parentId ?? null) === activeFolderId)
          .sort(compareFolders),
      [folders, activeFolderId],
    );

    // Breadcrumb trail from root → active folder (inclusive), guarded against
    // cycles so a corrupted parent chain can never loop forever.
    const folderPath = useMemo(() => {
      const path: { id: string; name: string }[] = [];
      if (!activeFolderId) return path;
      const byId = new Map(folders.map((f) => [f.id, f]));
      const seen = new Set<string>();
      let cursor = byId.get(activeFolderId);
      while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id);
        path.unshift({ id: cursor.id, name: cursor.name });
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
      }
      return path;
    }, [folders, activeFolderId]);

    // Direct subfolder count, shown as the chip subtitle. (The lean folder-media
    // list doesn't carry a total media count, so we only surface subfolders.)
    const folderChildCount = useCallback(
      (folderId: string) =>
        folders.filter((f) => f.parentId === folderId).length,
      [folders],
    );

    // Clear bulk selection when filter changes
    useEffect(() => {
      setBulkSelectedIds(new Set());
    }, [activeFilter]);

    // Use refs for values that loadItems needs but shouldn't trigger re-creation
    const pageIndexRef = useRef(pageIndex);
    pageIndexRef.current = pageIndex;
    const activeFilterRef = useRef(activeFilter);
    activeFilterRef.current = activeFilter;
    const usernameRef = useRef(username);
    usernameRef.current = username;

    const imageUrl = lightboxImageSignal.value?.fullImage || "";
    const imageUrls: string[] | undefined = (lightboxImageSignal.value as any)
      ?.imageUrls;
    const actionUrls: string[] | undefined = (lightboxImageSignal.value as any)
      ?.actionUrls;

    const api = useMemo(() => new GalleryModalApi(), []);
    const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
    const foldersApi = useMemo(() => new FoldersApi(), []);

    // Shared API-folder → UI-folder mapper (see folderMapping.ts).
    const mapFolder = mapFolderInfo;

    const groupItemsByDate = useCallback((items: GalleryItem[]) => {
      const grouped = items.reduce((acc: GroupedItems, item) => {
        const dateKey = formatDate(item.createdAt);
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
      }, {});

      // Sort dates in descending order
      return Object.fromEntries(
        Object.entries(grouped).sort(
          (a, b) =>
            new Date(b[1][0].createdAt).getTime() -
            new Date(a[1][0].createdAt).getTime(),
        ),
      );
    }, []);

    // Memoize the grouped result so we don't recompute on every render
    const groupedItems = useMemo(
      () => groupItemsByDate(allItems),
      [allItems, groupItemsByDate],
    );

    // Folder view memos — backed by the per-folder media cache.
    const activeFolderItems = useMemo(
      () => (activeFolderId ? (folderMediaItems[activeFolderId] ?? []) : []),
      [activeFolderId, folderMediaItems],
    );

    const folderGroupedItems = useMemo(
      () => groupItemsByDate(activeFolderItems),
      [activeFolderItems, groupItemsByDate],
    );

    const handleImageError = useCallback((url: string) => {
      console.error(`Failed to load gallery modal image: ${url}`);
      failedImageUrls.current.add(url);
    }, []);

    // Ref to the latest refreshGallery so the async session-fetch effect can
    // call it without taking a dependency on it. refreshGallery itself is
    // defined lower in the file (it needs loadItems); we wire the ref via a
    // layout-time assignment below.
    const refreshGalleryRef = useRef<() => void>(() => {});

    // Fetch the current session's username every time the modal opens.
    // The modal is permanently mounted in TopBar, so this component survives
    // logout → login. We re-verify who the backend considers the current user
    // on every open and, if it's a different user, wipe all stale state before
    // letting refreshGallery fire. This effect is the SOLE driver for refresh
    // on modal-open — the separate filter/username effect below intentionally
    // does NOT depend on modal-open signals, so it can't race this one.
    useEffect(() => {
      const modalIsOpen =
        isOpen || (mode === "view" && galleryModalVisibleViewMode.value);
      if (!modalIsOpen) return;
      let cancelled = false;
      (async () => {
        setUsernameError(false);
        const name = await fetchCurrentUsername();
        if (cancelled) return;
        if (!name) {
          setUsernameError(true);
          setInitialLoading(false);
          return;
        }
        if (name !== usernameRef.current) {
          // Different user than before — wipe everything from the previous
          // session. setUsername will trigger the filter/username effect
          // below, which calls refreshGallery with the new identity.
          galleryCacheMap.clear();
          setAllItems([]);
          setPageIndex(0);
          setHasMore(true);
          setInitialLoading(true);
          setUsername(name);
        } else {
          // Same user reopening — just refresh (shows cache + background refetch).
          refreshGalleryRef.current();
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [mode, galleryModalVisibleViewMode.value, isOpen, usernameRetryCount]);

    // Helper to build the cache key for the current filter
    const getCacheKey = useCallback(
      () => `gallery_${activeFilterRef.current}`,
      [],
    );

    // Map raw API item to GalleryItem
    const mapApiItem = useCallback(
      (item: any): GalleryItem => ({
        id: item.token,
        label: getLabel(item),
        thumbnail:
          item.media_class === "video"
            ? item.media_links.maybe_video_previews?.animated
            : item.media_class === "dimensional"
              ? item.cover_image?.maybe_cover_image_public_bucket_url
              : getThumbnailUrl(item.media_links.maybe_thumbnail_template, {
                  width: THUMBNAIL_SIZES.MEDIUM,
                }),
        thumbnailUrlTemplate: item.media_links.maybe_thumbnail_template,
        fullImage: item.media_links.cdn_url,
        createdAt: item.created_at,
        mediaClass:
          item.media_class ||
          (item.filter_media_classes ? item.filter_media_classes[0] : "image"),
        isUpload: item.origin_category === "upload",
        assetType:
          item.media_class === "dimensional"
            ? item.maybe_animation_type ||
              item.origin_product_category === "character" ||
              (item.origin && item.origin.product_category === "character")
              ? "character"
              : "object"
            : undefined,
      }),
      [],
    );

    // Map a folder media-file list item → GalleryItem. The list item already
    // carries media_links/cover, so no batch-get is needed (unlike `mapApiItem`,
    // which reads the raw user-media list shape: origin_category / no batch token).
    const mapFolderListItem = useCallback(
      (item: FolderMediaFileListItem): GalleryItem => ({
        id: item.token,
        label: getLabel(item),
        thumbnail:
          item.media_class === "dimensional"
            ? (item.cover_image?.maybe_cover_image_public_bucket_url ?? null)
            : getMediaThumbnail(item.media_links, item.media_class, {
                size: THUMBNAIL_SIZES.MEDIUM,
              }),
        thumbnailUrlTemplate:
          item.media_links?.maybe_thumbnail_template ?? undefined,
        fullImage: item.media_links?.cdn_url ?? null,
        createdAt: item.created_at,
        mediaClass: item.media_class || "image",
        isUpload: !!item.is_user_upload,
        batchImageToken: item.maybe_batch_token ?? undefined,
      }),
      [],
    );

    // Stable loadItems that reads from refs — never causes cascading re-renders
    const loadItems = useCallback(
      async (reset = false) => {
        const currentUsername = usernameRef.current;
        const currentFilter = activeFilterRef.current;
        if (!currentUsername) return;
        // Ref-based lock prevents concurrent/re-entrant calls
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setLoading(true);
        if (!reset) setPaginationLoading(true);
        try {
          const filterMediaClasses = getFilterMediaClass(currentFilter);
          const query = {
            filter_media_classes: filterMediaClasses,
            username: currentUsername,
            include_user_uploads:
              currentFilter === "uploaded" ||
              currentFilter === "all" ||
              currentFilter === "3d" ||
              currentFilter === "image" ||
              currentFilter === "video",
            user_uploads_only: currentFilter === "uploaded",
            page_index: reset ? 0 : pageIndexRef.current,
            page_size: PAGE_SIZE,
          };
          const response = await api.listUserMediaFiles(query);

          if (response.success && response.data) {
            setItemsLoadError(null);
            const newItems = response.data
              .filter(
                (item: any) => item.media_type !== FilterMediaType.SCENE_JSON,
              )
              .map(mapApiItem);

            if (reset) {
              // Smart merge: refresh existing items in place, prepend brand
              // new ones, and keep any items older than the fresh page
              // window (those live on later pages and aren't in this fetch).
              // NB: we can't blindly drop items missing from `newItems` —
              // that would evict everything loaded by infinite scroll.
              // Deletions are handled live via `media_file_deleted_event`.
              setAllItems((prev) => {
                if (prev.length === 0) return newItems;
                if (newItems.length === 0) return prev;
                const existingIds = new Set(prev.map((it) => it.id));
                const brandNew = newItems.filter(
                  (it: GalleryItem) => !existingIds.has(it.id),
                );
                const freshMap = new Map(
                  newItems.map((it: GalleryItem) => [it.id, it] as const),
                );
                // The server returns newest-first, so anything older than
                // the oldest item in this fresh page is on a later page.
                const oldestFreshTs = Math.min(
                  ...newItems.map((it: GalleryItem) =>
                    new Date(it.createdAt).getTime(),
                  ),
                );
                const updated = prev
                  .map((it) => {
                    const fresh = freshMap.get(it.id);
                    if (fresh) return fresh;
                    // Not in fresh window but older — came from a later
                    // page via infinite scroll; keep it.
                    if (new Date(it.createdAt).getTime() < oldestFreshTs) {
                      return it;
                    }
                    // In the fresh window and missing → server dropped it.
                    return undefined;
                  })
                  .filter((it): it is GalleryItem => it !== undefined);
                return [...brandNew, ...updated];
              });
            } else {
              setAllItems((prev) => [...prev, ...newItems]);
            }

            // Pagination logic
            const current = response.pagination?.current ?? 0;
            const total = response.pagination?.total_page_count ?? 1;
            setPageIndex(current + 1);
            setHasMore(current + 1 < total);

            // Update cache
            const cacheKey = getCacheKey();
            setAllItems((latest) => {
              galleryCacheMap.set(cacheKey, {
                items: latest,
                pageIndex: current + 1,
                hasMore: current + 1 < total,
                timestamp: Date.now(),
              });
              return latest;
            });
          } else {
            setItemsLoadError(
              response.errorMessage || "Request failed (unknown error)",
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error("Failed to fetch library items:", msg);
          setItemsLoadError(msg);
        }
        setLoading(false);
        setPaginationLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      },
      [api, mapApiItem, getCacheKey],
    );

    // refresh logic — shows cached items immediately, then background-refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const refreshGallery = useCallback(() => {
      setItemsLoadError(null);
      const cacheKey = `gallery_${activeFilterRef.current}`;
      const cached = galleryCacheMap.get(cacheKey);

      if (cached && cached.items.length > 0) {
        // Instantly show cached items — no loading indicator
        setAllItems(cached.items);
        setPageIndex(cached.pageIndex);
        setHasMore(cached.hasMore);
        setInitialLoading(false);
        // Background refresh — silently fetch page 0 and merge new items
        loadItems(true);
      } else {
        // No cache — show skeleton, then load
        setAllItems([]);
        setPageIndex(0);
        setHasMore(true);
        setInitialLoading(true);
        loadItems(true);
      }
    }, [loadItems]);

    // Keep the ref pointed at the latest refreshGallery so the session-fetch
    // effect can call it without taking it as a dep (avoids tearing).
    refreshGalleryRef.current = refreshGallery;

    // Refresh on username change (new user logged in via the session-fetch
    // effect) or on activeFilter change. This effect deliberately does NOT
    // depend on modal-open signals — the session-fetch effect above is the
    // sole driver for modal-open refreshes, which prevents a race where this
    // effect would otherwise fire synchronously with a stale `username` and
    // take the loading lock before the new session resolves.
    useEffect(() => {
      const modalIsOpen =
        mode === "view"
          ? galleryModalVisibleViewMode.value
          : typeof isOpen === "boolean"
            ? isOpen
            : true;
      if (modalIsOpen && username) {
        refreshGallery();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, activeFilter]);

    // Auto-refresh when a generation completes while the gallery is open
    const modalIsOpenRef = useRef(false);
    useEffect(() => {
      modalIsOpenRef.current =
        mode === "view"
          ? !!galleryModalVisibleViewMode.value
          : typeof isOpen === "boolean"
            ? isOpen
            : true;
    }, [mode, isOpen, galleryModalVisibleViewMode.value]);

    // External media-event subscription. Caller (typically the desktop app's
    // Tauri bindings) wires `subscribeToMediaEvents` to fire `onGenerationComplete`
    // when a generation finishes and `onMediaDeleted(id)` when any client deletes
    // an item, so the gallery refreshes and drops items live. When the prop is
    // absent (e.g. on the web), these behaviors just don't run.
    useEffect(() => {
      if (!subscribeToMediaEvents) return;
      const unsubscribe = subscribeToMediaEvents({
        onGenerationComplete: () => {
          if (modalIsOpenRef.current && username) {
            refreshGallery();
          }
        },
        onMediaDeleted: (token) => {
          if (!token) return;
          setAllItems((prev) => prev.filter((it) => it.id !== token));
          setBulkSelectedIds((prev) => {
            if (!prev.has(token)) return prev;
            const next = new Set(prev);
            next.delete(token);
            return next;
          });
          for (const [key, entry] of galleryCacheMap.entries()) {
            galleryCacheMap.set(key, {
              ...entry,
              items: entry.items.filter((it) => it.id !== token),
            });
          }
        },
      });
      return unsubscribe;
    }, [subscribeToMediaEvents, refreshGallery, username]);

    const toggleBulkSelect = useCallback((id: string) => {
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }, []);

    const handleItemClick = useCallback(
      (item: GalleryItem) => {
        if (mode === "select" && onSelectItem) {
          onSelectItem(item.id);
        } else if (bulkSelectionMode) {
          toggleBulkSelect(item.id);
        } else {
          lightboxImageSignal.value = item;
          lightboxVisibleSignal.value = true;
          galleryModalLightboxMediaId.value = item.id;
        }
      },
      [mode, onSelectItem, bulkSelectionMode, toggleBulkSelect],
    );

    const handleCloseLightbox = useCallback(() => {
      lightboxVisibleSignal.value = false;
      lightboxImageSignal.value = null;
      galleryModalLightboxMediaId.value = null;
      galleryModalLightboxNavPrev.value = null;
      galleryModalLightboxNavNext.value = null;
    }, []);

    const handleCloseGallery = useCallback(() => {
      galleryModalVisibleViewMode.value = false;
    }, []);

    const handleDeselectAll = useCallback(() => {
      selectedItemIds.forEach((id: any) => onSelectItem?.(id));
    }, [selectedItemIds, onSelectItem]);

    const handleUseSelected = useCallback(() => {
      const selectedItems = Object.values(groupedItems)
        .flat()
        .filter((item) => selectedItemIds.includes(item.id));
      onUseSelected?.(selectedItems);
    }, [groupedItems, selectedItemIds, onUseSelected]);

    const handleItemDeleted = useCallback((id: string) => {
      // Drop from local state (functional setter — must stay pure).
      setAllItems((prev) => prev.filter((it) => it.id !== id));
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // Drop from the module-level cache for every filter so reopening
      // the modal under any filter doesn't resurrect the item.
      for (const [key, entry] of galleryCacheMap.entries()) {
        galleryCacheMap.set(key, {
          ...entry,
          items: entry.items.filter((it) => it.id !== id),
        });
      }
    }, []);

    const clearBulkSelection = useCallback(() => {
      setBulkSelectedIds(new Set());
      setBulkFolderPopoverOpen(false);
    }, []);

    const bulkSelectedItems = useMemo(
      () => allItems.filter((item) => bulkSelectedIds.has(item.id)),
      [allItems, bulkSelectedIds],
    );

    const handleBulkDelete = useCallback(() => {
      if (!onDeleteMedia) return;
      const count = bulkSelectedIds.size;
      showActionReminder({
        reminderType: "default",
        title: `Delete ${count} item${count > 1 ? "s" : ""}?`,
        message: (
          <p className="text-sm text-white/70">
            This will permanently remove {count} item{count > 1 ? "s" : ""} from
            your library. This action cannot be undone.
          </p>
        ),
        primaryActionText: "Delete",
        secondaryActionText: "Cancel",
        primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
        onPrimaryAction: async () => {
          try {
            const ids = Array.from(bulkSelectedIds);
            await Promise.allSettled(ids.map((id) => onDeleteMedia(id)));
            const idSet = new Set(ids);
            setAllItems((prev) => prev.filter((it) => !idSet.has(it.id)));
            for (const [key, entry] of galleryCacheMap.entries()) {
              galleryCacheMap.set(key, {
                ...entry,
                items: entry.items.filter((it) => !idSet.has(it.id)),
              });
            }
            clearBulkSelection();
          } finally {
            isActionReminderOpen.value = false;
          }
        },
      });
    }, [bulkSelectedIds, clearBulkSelection, onDeleteMedia]);

    // Load the full folder tree (paginated, newest first).
    const loadFolders = useCallback(async () => {
      try {
        const all: FolderInfo[] = [];
        let cursor: string | undefined = undefined;
        // Safety cap so a misbehaving cursor can't loop forever.
        for (let page = 0; page < 50; page++) {
          const res = await foldersApi.ListAllFolders({ cursor });
          if (!res.success || !res.data) break;
          all.push(...res.data);
          const next = res.pagination?.maybe_cursor;
          if (!next) break;
          cursor = next;
        }
        setFolders(all.map(mapFolder));
      } catch (err) {
        console.error("Failed to load folders:", err);
      }
    }, [foldersApi, mapFolder]);

    // Resolve a folder's media one page at a time: list its (lean) members via
    // the cursor, then batch-fetch the full media files so we can reuse the
    // existing GalleryItem mapping. `reset` starts over from the first page.
    const loadFolderMedia = useCallback(
      async (folderId: string, reset = false) => {
        if (folderLoadingRef.current[folderId]) return;
        if (!reset && folderHasMoreRef.current[folderId] === false) return;
        folderLoadingRef.current[folderId] = true;
        if (reset) {
          folderCursorRef.current[folderId] = undefined;
          folderHasMoreRef.current[folderId] = true;
          setFolderContentLoading(true);
        } else {
          setFolderLoadingMore(true);
        }
        try {
          const listRes = await foldersApi.ListFolderMediaFiles({
            folderToken: folderId,
            query: {
              cursor: reset ? undefined : folderCursorRef.current[folderId],
              limit: FOLDER_PAGE_SIZE,
            },
          });
          if (!listRes.success || !listRes.data) return;
          const nextCursor = listRes.pagination?.maybe_cursor ?? undefined;
          folderCursorRef.current[folderId] = nextCursor;
          folderHasMoreRef.current[folderId] = !!nextCursor;
          // The list item already carries media_links/cover, so map directly —
          // no second batch-get. Server order is newest-added first.
          const ordered = listRes.data.map(mapFolderListItem);
          setFolderMediaItems((prev) => {
            const existing = reset ? [] : (prev[folderId] ?? []);
            const seen = new Set(existing.map((i) => i.id));
            const merged = [
              ...existing,
              ...ordered.filter((i) => !seen.has(i.id)),
            ];
            return { ...prev, [folderId]: merged };
          });
        } catch (err) {
          console.error("Failed to load folder media:", err);
        } finally {
          folderLoadingRef.current[folderId] = false;
          setFolderContentLoading(false);
          setFolderLoadingMore(false);
        }
      },
      [foldersApi],
    );

    // Folder creation — nests under `newFolderParentId` (null = root).
    const handleCreateFolder = useCallback(
      async (rawName: string) => {
        const name = rawName.trim();
        if (!name) return;
        const parentId = newFolderParentId;
        setNewFolderModalOpen(false);
        try {
          const res = await foldersApi.CreateFolder({
            name,
            maybe_parent_folder_token: parentId,
          });
          if (res.success && res.data) {
            setFolders((prev) => [...prev, mapFolder(res.data!)]);
          } else {
            toast.error(res.errorMessage || "Failed to create folder.");
          }
        } catch (err) {
          toast.error(
            `Failed to create folder: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      },
      [newFolderParentId, foldersApi, mapFolder],
    );

    // Open the new-folder modal. `parentId` undefined → create in the folder
    // currently being viewed; pass `null` to force a root folder.
    const handleOpenNewFolderModal = useCallback(
      (parentId?: string | null) => {
        setNewFolderParentId(
          parentId !== undefined ? parentId : activeFolderId,
        );
        setNewFolderModalOpen(true);
      },
      [activeFolderId],
    );

    // Navigate into a folder (null = back to the root library). Fetches the
    // folder's media; cached items (if any) stay visible until the fetch lands.
    const handleOpenFolder = useCallback(
      (folderId: string | null) => {
        setActiveFolderId(folderId);
        setRenamingFolderId(null);
        setBulkSelectedIds(new Set());
        setFolderMenuOpen(false);
        setContextMenu(null);
        if (folderId) loadFolderMedia(folderId, true);
      },
      [loadFolderMedia],
    );

    // Navigate back to main library
    const handleBackToLibrary = useCallback(() => {
      handleOpenFolder(null);
    }, [handleOpenFolder]);

    // Switch top-level tab; leaving the folder browser exits any open folder.
    const switchGalleryTab = useCallback((tab: "unsorted" | "folders") => {
      setGalleryTab(tab);
      setActiveFolderId(null);
      setBulkSelectedIds(new Set());
      setFolderMenuOpen(false);
      setContextMenu(null);
    }, []);

    // Close any open folder menus
    const closeFolderMenus = useCallback(() => {
      setFolderMenuOpen(false);
      setContextMenu(null);
    }, []);

    // Rename folder — modal=true for sidebar, false for header inline
    const handleStartRename = useCallback(
      (folderId: string, modal = false) => {
        const folder = folders.find((f) => f.id === folderId);
        if (!folder) return;
        setRenameValue(folder.name);
        setRenamingFolderId(folderId);
        setRenameViaModal(modal);
        closeFolderMenus();
        setTimeout(() => renameInputRef.current?.select(), 50);
      },
      [folders, closeFolderMenus],
    );

    const handleConfirmRename = useCallback(async (nameArg?: unknown) => {
      if (!renamingFolderId) return;
      // `nameArg` is a string from the rename dialog; the inline header rename's
      // onBlur passes a focus event, so fall back to `renameValue` for non-strings.
      const trimmed = (
        typeof nameArg === "string" ? nameArg : renameValue
      ).trim();
      if (!trimmed) return;
      const folderId = renamingFolderId;
      // Optimistic — the rename feels instant; reconcile on error.
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)),
      );
      setRenamingFolderId(null);
      setRenameViaModal(false);
      try {
        const res = await foldersApi.RenameFolder({
          folderToken: folderId,
          newName: trimmed,
        });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to rename folder.");
          loadFolders();
        }
      } catch (err) {
        toast.error(
          `Failed to rename folder: ${err instanceof Error ? err.message : String(err)}`,
        );
        loadFolders();
      }
    }, [renameValue, renamingFolderId, foldersApi, loadFolders]);

    // Star / unstar a folder (optimistic + reconcile).
    const handleSetFolderStar = useCallback(
      async (folderId: string, hasStar: boolean) => {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, hasStar } : f)),
        );
        closeFolderMenus();
        try {
          const res = await foldersApi.SetStar({
            folderToken: folderId,
            hasStar,
          });
          if (!res.success) {
            toast.error(res.errorMessage || "Failed to update folder.");
            loadFolders();
          }
        } catch (err) {
          toast.error(
            `Failed to update folder: ${err instanceof Error ? err.message : String(err)}`,
          );
          loadFolders();
        }
      },
      [foldersApi, loadFolders, closeFolderMenus],
    );

    // Set / clear a folder color (optimistic + reconcile).
    const handleSetFolderColor = useCallback(
      async (folderId: string, colorCode: string | null) => {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, colorCode } : f)),
        );
        try {
          const res = await foldersApi.SetColorCode({
            folderToken: folderId,
            colorCode,
          });
          if (!res.success) {
            toast.error(res.errorMessage || "Failed to update folder color.");
            loadFolders();
          }
        } catch (err) {
          toast.error(
            `Failed to update folder color: ${err instanceof Error ? err.message : String(err)}`,
          );
          loadFolders();
        }
      },
      [foldersApi, loadFolders],
    );

    // Delete folder (works for any folder). The server soft-deletes only this
    // folder; its subfolders keep their parent pointer and become "orphaned"
    // (we surface them at the top level). Media files stay in the library.
    const handleDeleteFolder = useCallback(
      (folderId: string) => {
        const folder = folders.find((f) => f.id === folderId);
        if (!folder) return;
        closeFolderMenus();
        const hasSubfolders = folders.some((f) => f.parentId === folderId);
        showActionReminder({
          reminderType: "default",
          title: `Delete "${folder.name}"?`,
          message: (
            <p className="text-sm text-white/70">
              {hasSubfolders
                ? "This folder will be deleted and its subfolders moved to the top level. "
                : "This folder will be deleted. "}
              Items inside stay in your library.
            </p>
          ),
          primaryActionText: "Delete",
          secondaryActionText: "Cancel",
          primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
          onPrimaryAction: async () => {
            // Optimistic: drop this folder and reparent its direct children to
            // root (mirrors the server orphaning them), and forget its media cache.
            setFolders((prev) =>
              prev
                .filter((f) => f.id !== folderId)
                .map((f) =>
                  f.parentId === folderId ? { ...f, parentId: null } : f,
                ),
            );
            setFolderMediaItems((prev) => {
              const next = { ...prev };
              delete next[folderId];
              return next;
            });
            if (activeFolderId === folderId) {
              setActiveFolderId(folder.parentId ?? null);
            }
            isActionReminderOpen.value = false;
            try {
              const res = await foldersApi.DeleteFolder({
                folderToken: folderId,
              });
              if (!res.success) {
                toast.error(res.errorMessage || "Failed to delete folder.");
              }
            } catch (err) {
              toast.error(
                `Failed to delete folder: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
            // Reconcile authoritative orphan flags / parent pointers.
            loadFolders();
          },
        });
      },
      [folders, activeFolderId, closeFolderMenus, foldersApi, loadFolders],
    );

    // Refs so the folder-drop listener stays stable while reading live state.
    const folderMediaItemsRef = useRef(folderMediaItems);
    folderMediaItemsRef.current = folderMediaItems;
    const activeFolderIdRef = useRef(activeFolderId);
    activeFolderIdRef.current = activeFolderId;

    // Resolve item ids → GalleryItems from anything we've loaded (root + any folder).
    const resolveItems = useCallback(
      (itemIds: string[]): GalleryItem[] => {
        const byId = new Map<string, GalleryItem>();
        for (const it of allItems) byId.set(it.id, it);
        for (const arr of Object.values(folderMediaItemsRef.current)) {
          for (const it of arr) if (!byId.has(it.id)) byId.set(it.id, it);
        }
        return itemIds
          .map((id) => byId.get(id))
          .filter((it): it is GalleryItem => !!it);
      },
      [allItems],
    );

    // Prepend added items' still-thumbnails to a folder's auto collage (optimistic).
    // Only `collageUrls` — `coverUrl` is the user's custom cover and must not be
    // derived from the collage (else the chip shows one image, not the 2×2 grid).
    const bumpFolderCollage = useCallback(
      (folderId: string, addItems: GalleryItem[]) =>
        setFolders((prev) =>
          prev.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  collageUrls: mergeCollageUrls(
                    f.collageUrls,
                    addItems.map(galleryItemToCollageUrl),
                  ),
                }
              : f,
          ),
        ),
      [],
    );

    // Add media files to a folder. Optimistic cache + cover, then persist.
    const handleAddToFolder = useCallback(
      async (itemIds: string[], folderId: string) => {
        if (itemIds.length === 0) return;
        const addedItems = resolveItems(itemIds);
        setFolderMediaItems((prev) => {
          const existing = prev[folderId];
          if (!existing) return prev; // fetched fresh when the folder opens
          const seen = new Set(existing.map((i) => i.id));
          const fresh = addedItems.filter((i) => !seen.has(i.id));
          if (fresh.length === 0) return prev;
          return { ...prev, [folderId]: [...fresh, ...existing] };
        });
        bumpFolderCollage(folderId, addedItems);
        try {
          const res = await foldersApi.AddMediaFiles({
            folderToken: folderId,
            mediaFileTokens: itemIds,
          });
          if (res.success) {
            const name = folders.find((f) => f.id === folderId)?.name ?? "folder";
            toast.success(
              `Added ${itemIds.length} item${itemIds.length === 1 ? "" : "s"} to ${name}`,
            );
          } else {
            toast.error(res.errorMessage || "Failed to add to folder.");
          }
        } catch (err) {
          toast.error(
            `Failed to add to folder: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      },
      [resolveItems, bumpFolderCollage, folders, foldersApi],
    );

    // Move media from one folder to another (atomic). Drops from source, adds to target.
    const handleMoveMedia = useCallback(
      async (itemIds: string[], source: string, target: string) => {
        if (itemIds.length === 0) return;
        const movedItems = resolveItems(itemIds);
        const idSet = new Set(itemIds);
        setFolderMediaItems((prev) => {
          const next = { ...prev };
          if (next[source]) next[source] = next[source].filter((it) => !idSet.has(it.id));
          if (next[target]) {
            const seen = new Set(next[target].map((i) => i.id));
            next[target] = [...movedItems.filter((i) => !seen.has(i.id)), ...next[target]];
          }
          return next;
        });
        bumpFolderCollage(target, movedItems);
        // Drop the moved stills from the source folder's collage.
        const movedUrls = new Set(
          movedItems.map(galleryItemToCollageUrl).filter((u): u is string => !!u),
        );
        setFolders((prev) =>
          prev.map((f) =>
            f.id === source
              ? {
                  ...f,
                  collageUrls: (f.collageUrls ?? []).filter(
                    (u) => !movedUrls.has(u),
                  ),
                }
              : f,
          ),
        );
        try {
          const res = await foldersApi.MoveMediaFiles({
            folderToken: target,
            sourceFolderToken: source,
            mediaFileTokens: itemIds,
          });
          if (res.success) {
            const name = folders.find((f) => f.id === target)?.name ?? "folder";
            toast.success(
              `Moved ${itemIds.length} item${itemIds.length === 1 ? "" : "s"} to ${name}`,
            );
          } else {
            toast.error(res.errorMessage || "Failed to move items.");
            loadFolders();
          }
        } catch (err) {
          toast.error(
            `Failed to move items: ${err instanceof Error ? err.message : String(err)}`,
          );
          loadFolders();
        }
      },
      [resolveItems, bumpFolderCollage, folders, foldersApi, loadFolders],
    );

    // Remove media from the folder currently being viewed.
    const handleRemoveFromFolder = useCallback(
      async (itemIds: string[]) => {
        const folderId = activeFolderIdRef.current;
        if (!folderId || itemIds.length === 0) return;
        const idSet = new Set(itemIds);
        const removedItems = resolveItems(itemIds);
        const removedUrls = new Set(
          removedItems.map(galleryItemToCollageUrl).filter((u): u is string => !!u),
        );
        setFolderMediaItems((prev) =>
          prev[folderId]
            ? { ...prev, [folderId]: prev[folderId].filter((it) => !idSet.has(it.id)) }
            : prev,
        );
        setFolders((prev) =>
          prev.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  collageUrls: (f.collageUrls ?? []).filter(
                    (u) => !removedUrls.has(u),
                  ),
                }
              : f,
          ),
        );
        try {
          const res = await foldersApi.RemoveMediaFiles({
            folderToken: folderId,
            mediaFileTokens: itemIds,
          });
          if (!res.success) {
            toast.error(res.errorMessage || "Failed to remove from folder.");
            loadFolders();
          }
        } catch (err) {
          toast.error(
            `Failed to remove from folder: ${err instanceof Error ? err.message : String(err)}`,
          );
          loadFolders();
        }
      },
      [resolveItems, foldersApi, loadFolders],
    );

    // Single entry point for drops + add-to-folder: prompt Move/Add when the
    // source is another folder, otherwise add directly (root → always add).
    const requestFolderDrop = useCallback(
      (itemIds: string[], targetFolderId: string) => {
        if (itemIds.length === 0) return;
        const source = activeFolderIdRef.current;
        if (source && source !== targetFolderId) {
          promptFolderDrop({
            count: itemIds.length,
            targetFolderName: folders.find((f) => f.id === targetFolderId)?.name,
            onMove: () => handleMoveMedia(itemIds, source, targetFolderId),
            onAdd: () => handleAddToFolder(itemIds, targetFolderId),
          });
        } else {
          handleAddToFolder(itemIds, targetFolderId);
        }
      },
      [folders, handleMoveMedia, handleAddToFolder],
    );

    // Bulk "Add to folder" popover
    const [bulkFolderPopoverOpen, setBulkFolderPopoverOpen] = useState(false);

    // Folder drop listener
    useEffect(() => {
      const handler = (e: Event) => {
        const { items, folderId } = (e as CustomEvent).detail;
        requestFolderDrop(
          items.map((i: GalleryItem) => i.id),
          folderId,
        );
      };
      window.addEventListener(FOLDER_DROP_EVENT, handler);
      return () => window.removeEventListener(FOLDER_DROP_EVENT, handler);
    }, [requestFolderDrop]);

    // Load the folder tree when the modal opens (both view and the select
    // picker show the Folders tab). Re-runs per user so a new session is fresh.
    useEffect(() => {
      const modalIsOpen =
        mode === "view"
          ? galleryModalVisibleViewMode.value
          : typeof isOpen === "boolean"
            ? isOpen
            : true;
      if (modalIsOpen && username) {
        loadFolders();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isOpen, galleryModalVisibleViewMode.value, username]);

    // Provide bulk-selected items for drag
    const getBulkDragItems = useCallback(
      () => allItems.filter((item) => bulkSelectedIds.has(item.id)),
      [allItems, bulkSelectedIds],
    );

    useSignals();

    // Synchronize lightbox image when external media id signal is set.
    // Skip if the signal already carries carousel data (imageUrls / batchImageToken)
    // set by the caller (e.g. TextToImage batch, TaskQueue) — overwriting it with
    // the plain gallery item would strip those fields and break the carousel.
    useEffect(() => {
      if (galleryModalLightboxMediaId.value && allItems.length > 0) {
        const current = lightboxImageSignal.value as any;
        if (current?.imageUrls?.length > 0 || current?.batchImageToken) return;
        const target = allItems.find(
          (it) => it.id === galleryModalLightboxMediaId.value,
        );
        if (target) {
          lightboxImageSignal.value = target;
        }
      }
    }, [galleryModalLightboxMediaId.value, allItems]);

    // Build a flat, ordered list of all visible items (matching the grid render order) for lightbox navigation
    const filterItem = useCallback(
      (item: GalleryItem) => {
        if ((item as any).mediaType === "scene_json") return false;
        if (!showUploads && activeFilter !== "uploaded" && item.isUpload)
          return false;
        if (activeFilter === "3d") return item.mediaClass === "dimensional";
        if (activeFilter === "image") return item.mediaClass === "image";
        if (activeFilter === "video") return item.mediaClass === "video";
        if (activeFilter === "all") {
          return (
            item.mediaClass !== "audio" &&
            (item as any).mediaType !== "scene_json"
          );
        }
        return true;
      },
      [activeFilter, showUploads],
    );

    const flatFilteredItems = useMemo(() => {
      const result: GalleryItem[] = [];
      for (const [, dateItems] of Object.entries(groupedItems)) {
        for (const item of dateItems) {
          if (filterItem(item)) result.push(item);
        }
      }
      return result;
    }, [groupedItems, filterItem]);

    const currentLightboxIndex = useMemo(() => {
      const currentId = lightboxImageSignal.value?.id;
      if (!currentId) return -1;
      return flatFilteredItems.findIndex((item) => item.id === currentId);
    }, [flatFilteredItems, lightboxImageSignal.value]);

    const handleNavigatePrev = useMemo(() => {
      if (currentLightboxIndex <= 0) return undefined;
      return () => {
        const prevItem = flatFilteredItems[currentLightboxIndex - 1];
        if (prevItem) {
          lightboxImageSignal.value = prevItem;
          lightboxVisibleSignal.value = true;
          galleryModalLightboxMediaId.value = prevItem.id;
        }
      };
    }, [currentLightboxIndex, flatFilteredItems]);

    const handleNavigateNext = useMemo(() => {
      if (
        currentLightboxIndex < 0 ||
        currentLightboxIndex >= flatFilteredItems.length - 1
      )
        return undefined;
      return () => {
        const nextItem = flatFilteredItems[currentLightboxIndex + 1];
        if (nextItem) {
          lightboxImageSignal.value = nextItem;
          lightboxVisibleSignal.value = true;
          galleryModalLightboxMediaId.value = nextItem.id;
        }
      };
    }, [currentLightboxIndex, flatFilteredItems]);

    const handleNavigateToMedia = useCallback(
      async (mediaToken: string) => {
        try {
          const response = await mediaFilesApi.GetMediaFileByToken({
            mediaFileToken: mediaToken,
          });
          if (response.success && response.data) {
            const file = response.data;
            const url = file.media_links?.cdn_url || null;
            const item: GalleryItem = {
              id: file.token || mediaToken,
              label: "",
              thumbnail:
                getThumbnailUrl(file.media_links?.thumbnail_template, {
                  width: THUMBNAIL_SIZES.MEDIUM,
                }) || url,
              thumbnailUrlTemplate:
                file.media_links?.thumbnail_template || undefined,
              fullImage: url,
              createdAt: file.created_at || new Date().toISOString(),
              mediaClass: file.media_class || "image",
            };
            lightboxImageSignal.value = item;
            galleryModalLightboxMediaId.value = item.id;
          }
        } catch (error) {
          console.error("Failed to navigate to reference media:", error);
        }
      },
      [mediaFilesApi],
    );

    // Compute gap class based on gridColumns
    const gapClass =
      gridColumns <= 4 ? "gap-1.5" : gridColumns <= 7 ? "gap-1" : "gap-0.5";

    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight >= 100) return;
        if (activeFolderId) {
          // Infinite-scroll the open folder's media.
          if (
            folderHasMoreRef.current[activeFolderId] !== false &&
            !folderLoadingRef.current[activeFolderId]
          ) {
            loadFolderMedia(activeFolderId, false);
          }
        } else if (
          galleryTabRef.current !== "folders" &&
          hasMore &&
          !isLoadingRef.current
        ) {
          loadItems();
        }
      },
      [activeFolderId, hasMore, loadItems, loadFolderMedia],
    );

    // Folder tiles for the current location, rendered on the same grid as media
    // items. View mode only — the picker (select mode) never shows folders.
    const folderChipsSection =
      galleryTab === "folders" && currentSubfolders.length > 0 ? (
        <div className="px-4 pt-4">
          {activeFolderId && (
            <h3 className="text-md mb-2 font-medium text-base-fg/60">
              Folders
            </h3>
          )}
          <div
            className={twMerge("grid", gapClass)}
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {currentSubfolders.map((folder) => (
              <GalleryFolderChip
                key={folder.id}
                folder={folder}
                childCount={folderChildCount(folder.id)}
                onOpen={handleOpenFolder}
                onContextMenu={(folderId, x, y) =>
                  setContextMenu({ folderId, x, y })
                }
              />
            ))}
          </div>
        </div>
      ) : null;

    return (
      <>
        <Modal
          resizable={mode === "view"}
          isOpen={
            mode === "view"
              ? galleryModalVisibleViewMode.value &&
                galleryModalVisibleDuringDrag.value
              : typeof isOpen === "boolean"
                ? isOpen
                : true
          }
          onClose={() => {
            if (mode === "view") {
              clearBulkSelection();
              onClose?.() || (galleryModalVisibleViewMode.value = false);
            } else {
              onClose?.();
            }
          }}
          className={twMerge(
            "h-[780px] max-h-[90vh] w-full max-w-5xl rounded-xl",
            mode === "view" &&
              "h-[780px] min-h-[640px] min-w-[66rem] w-[66rem] max-w-none",
          )}
          childPadding={false}
          showClose={false}
          draggable={mode === "view"}
          allowBackgroundInteraction={mode === "view" ? true : false}
          closeOnOutsideClick={mode === "view" ? false : true}
        >
          {mode === "view" && (
            <Modal.DragHandle>
              <div className="absolute left-0 top-0 z-[50] h-[60px] w-full cursor-move" />
            </Modal.DragHandle>
          )}
          <div className="relative flex h-full flex-col">
            <div className="border-b border-ui-panel-border p-4 py-3 bg-ui-panel rounded-t-xl">
              <div className="flex flex-wrap justify-between items-center gap-y-2">
                <div className="flex items-center gap-3 flex-wrap gap-y-1">
                  {(mode === "view" || mode === "select") && (
                    <div className="flex items-center gap-0.5 rounded-lg bg-ui-controls/40 p-0.5 relative z-[51]">
                      {(["unsorted", "folders"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => switchGalleryTab(t)}
                          className={twMerge(
                            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                            galleryTab === t
                              ? "bg-ui-controls text-base-fg"
                              : "text-base-fg/60 hover:text-base-fg",
                          )}
                        >
                          {t === "unsorted" ? "All Assets" : "Folders"}
                        </button>
                      ))}
                    </div>
                  )}
                  {mode === "view" && galleryTab === "folders" && !activeFolder && (
                    <button
                      type="button"
                      onClick={() => handleOpenNewFolderModal(null)}
                      className="flex items-center gap-2 rounded-lg bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-base-fg hover:bg-ui-controls/90 transition-colors relative z-[51]"
                    >
                      <FontAwesomeIcon
                        icon={faFolderPlus}
                        className="text-xs"
                      />
                      New folder
                    </button>
                  )}
                  {galleryTab === "folders" && activeFolder ? (
                    /* ── Folder header (breadcrumb trail) ── */
                    <div className="flex items-center gap-1.5 relative z-[51] flex-wrap">
                      <button
                        type="button"
                        onClick={handleBackToLibrary}
                        className="text-base-fg/50 hover:text-base-fg text-sm transition-colors"
                      >
                        Folders
                      </button>
                      {/* Ancestor crumbs (everything above the active folder) */}
                      {folderPath.slice(0, -1).map((crumb) => (
                        <React.Fragment key={crumb.id}>
                          <span className="text-base-fg/30">/</span>
                          <button
                            type="button"
                            onClick={() => handleOpenFolder(crumb.id)}
                            className="text-base-fg/50 hover:text-base-fg text-sm transition-colors truncate max-w-[10rem]"
                          >
                            {crumb.name}
                          </button>
                        </React.Fragment>
                      ))}
                      <span className="text-base-fg/30">/</span>
                      {renamingFolderId === activeFolderId &&
                      !renameViaModal ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename();
                            if (e.key === "Escape") setRenamingFolderId(null);
                          }}
                          onBlur={handleConfirmRename}
                          className="text-lg font-semibold bg-transparent rounded px-1.5 py-0 text-base-fg outline-none min-w-[6rem] caret-primary"
                          autoFocus
                        />
                      ) : (
                        <h2
                          className="text-lg font-semibold cursor-pointer hover:bg-ui-controls/30 rounded px-1.5 py-0 transition-colors truncate max-w-[20rem]"
                          onClick={() => handleStartRename(activeFolderId!)}
                        >
                          {activeFolder.name}
                        </h2>
                      )}
                      {/* Folder ... menu */}
                      <div
                        className={twMerge(
                          "relative",
                          renamingFolderId === activeFolderId &&
                            !renameViaModal &&
                            "hidden",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setFolderMenuOpen((v) => !v)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ui-controls/60 text-base-fg/60 hover:text-base-fg transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsis}
                            className="text-sm"
                          />
                        </button>
                        {folderMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-[58]"
                              onClick={() => setFolderMenuOpen(false)}
                            />
                            <FolderContextMenuItems
                              className="absolute left-0 top-full mt-1"
                              folderId={activeFolderId!}
                              hasStar={activeFolder?.hasStar}
                              colorCode={activeFolder?.colorCode}
                              onRename={(id) => handleStartRename(id, false)}
                              onDelete={handleDeleteFolder}
                              onNewSubfolder={(id) => {
                                setFolderMenuOpen(false);
                                handleOpenNewFolderModal(id);
                              }}
                              onToggleStar={handleSetFolderStar}
                              onSetColor={handleSetFolderColor}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── Normal header ── */
                    <>
                      {mode === "select" && galleryTab === "unsorted" && (
                        <h2 className="text-xl font-semibold">
                          {activeFilter === "video"
                            ? maxSelections === 1
                              ? "Select Video"
                              : "Select Videos"
                            : activeFilter === "3d"
                              ? maxSelections === 1
                                ? "Select 3D Object"
                                : "Select 3D Objects"
                              : activeFilter === "uploaded"
                                ? maxSelections === 1
                                  ? "Select Upload"
                                  : "Select Uploads"
                                : activeFilter === "all"
                                  ? "Select Media"
                                  : maxSelections === 1
                                    ? "Select Image"
                                    : "Select Images"}
                        </h2>
                      )}
                      {mode === "view" && galleryTab === "unsorted" && (
                        <div className="relative z-[51] flex items-center">
                          <Checkbox
                            id="gallery-reopen-after-drag"
                            checked={galleryReopenAfterDragSignal.value}
                            onChange={(e) =>
                              (galleryReopenAfterDragSignal.value =
                                e.target.checked)
                            }
                            label="Reopen after adding"
                          />
                        </div>
                      )}
                    </>
                  )}
                  {galleryTab === "unsorted" && activeFilter !== "uploaded" && (
                    <div className="relative z-[51] flex items-center">
                      <Checkbox
                        id="gallery-show-uploads"
                        checked={showUploads}
                        onChange={(e) => setShowUploads(e.target.checked)}
                        label="Show uploads"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 items-center flex-wrap ml-auto">
                  {/* Refresh button */}
                  <Tooltip
                    position="top"
                    content="Refresh list"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={refreshGallery}
                      className="relative z-[51] h-9 w-9"
                      disabled={loading}
                      aria-label="Refresh list"
                    >
                      <FontAwesomeIcon
                        icon={faArrowsRotate}
                        className={`text-lg text-base-fg ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </Tooltip>
                  {/* Image fit toggle button */}
                  <Tooltip
                    position="top"
                    content="Toggle image fit"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={() =>
                        setImageFit((fit) =>
                          fit === "cover" ? "contain" : "cover",
                        )
                      }
                      className="relative z-[51] h-9 w-9"
                    >
                      <FontAwesomeIcon
                        icon={imageFit === "cover" ? faExpand : faCompress}
                        className="text-lg text-base-fg"
                      />
                    </Button>
                  </Tooltip>

                  {/* Slider (hidden on narrow screens — grid is locked to 2 cols there) */}
                  <div className="hidden sm:flex w-32 mx-3 relative z-[51] items-center gap-2">
                    <SliderV2
                      min={minColumns}
                      max={maxColumns}
                      value={sliderValue}
                      onChange={setSliderValue}
                      step={1}
                      variant="classic"
                      showTooltip={false}
                      className="w-full"
                      showProgressBar={false}
                      tooltipContent={`${
                        maxColumns - (sliderValue - minColumns)
                      } columns`}
                    />
                  </div>
                  {mode === "view" && <Modal.ExpandButton />}
                  <CloseButton
                    onClick={() => {
                      if (mode === "view") {
                        clearBulkSelection();
                        galleryModalVisibleViewMode.value = false;
                      } else {
                        onClose?.();
                      }
                    }}
                    className="relative z-[51]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden" data-gallery-modal>
              {/* ── Filter sidebar ── (Unsorted tab / picker only; the Folders
                  tab is a full-width browser) */}
              {!hideFilter && galleryTab === "unsorted" && (
                <div className="w-52 min-w-[13rem] border-r border-ui-panel-border bg-ui-background flex flex-col overflow-y-auto">
                  {/* Filter items — hidden when the gallery is used as a constrained picker */}
                  {!hideFilter && (
                    <>
                      <div className="flex flex-col px-1.5 pt-2 pb-1">
                        {SIDEBAR_FILTERS.map((f) => {
                          const isActive = activeFilter === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                if (!forceFilter) {
                                  setActiveFilter(f.id);
                                  setActiveFolderId(null);
                                }
                              }}
                              className={twMerge(
                                "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                isActive && !activeFolderId
                                  ? "bg-ui-controls/60 text-base-fg font-medium"
                                  : "text-base-fg/70 hover:bg-ui-controls/30 hover:text-base-fg",
                                forceFilter &&
                                  f.id !== activeFilter &&
                                  "opacity-50 pointer-events-none",
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <FontAwesomeIcon
                                  icon={f.icon}
                                  className="text-xs w-4"
                                />
                                <span>{f.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Main content ── */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto bg-ui-panel"
                onScroll={handleScroll}
              >
                {/* Subfolder tiles for the current location (root or open folder) */}
                {folderChipsSection}
                {galleryTab === "folders" && !activeFolderId ? (
                  /* ── Folders tab, root: folder cards only (above) ── */
                  currentSubfolders.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <FontAwesomeIcon
                          icon={faFolder}
                          className="text-primary text-2xl"
                        />
                      </div>
                      <div className="text-base-fg font-semibold">
                        No folders yet
                      </div>
                      <div className="text-base-fg/40 text-sm text-center max-w-[16rem]">
                        Create a folder to organize your media.
                      </div>
                      {mode === "view" && (
                        <Button
                          variant="action"
                          icon={faFolderPlus}
                          onClick={() => handleOpenNewFolderModal(null)}
                          className="mt-1 px-3 py-1.5 text-sm"
                        >
                          New folder
                        </Button>
                      )}
                    </div>
                  ) : null
                ) : activeFolderId ? (
                  /* ── Folder view ── */
                  folderContentLoading && activeFolderItems.length === 0 ? (
                    currentSubfolders.length > 0 ? null : (
                      <div className="flex h-full items-center justify-center">
                        <LoadingSpinner className="h-8 w-8" />
                      </div>
                    )
                  ) : activeFolderItems.length === 0 ? (
                    currentSubfolders.length > 0 ? null : (
                      <div className="flex h-full flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          <FontAwesomeIcon
                            icon={faFolder}
                            className="text-primary text-2xl"
                          />
                        </div>
                        <div className="text-base-fg font-semibold">
                          This folder is empty
                        </div>
                        <div className="text-base-fg/40 text-sm text-center max-w-[16rem]">
                          {mode === "view"
                            ? "Drag images here, generate new ones, or create a subfolder."
                            : "There's nothing in this folder yet."}
                        </div>
                        {mode === "view" && (
                          <Button
                            variant="action"
                            icon={faFolderPlus}
                            onClick={() =>
                              handleOpenNewFolderModal(activeFolderId)
                            }
                            className="mt-1 px-3 py-1.5 text-sm"
                          >
                            New folder
                          </Button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-6 p-4">
                      {Object.entries(folderGroupedItems).map(
                        ([date, dateItems], groupIndex) => {
                          const filteredItems = dateItems.filter(filterItem);
                          if (filteredItems.length === 0) return null;
                          return (
                            <LazyDateGroup
                              key={date}
                              eager={groupIndex < 2}
                              itemCount={filteredItems.length}
                              gridColumns={gridColumns}
                              scrollRoot={scrollContainerRef.current}
                            >
                              <h3 className="text-md mb-2 font-medium text-base-fg/60">
                                {date}
                              </h3>
                              <div
                                className={twMerge("grid", gapClass)}
                                style={{
                                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                                }}
                              >
                                {filteredItems.map((item) => (
                                  <GalleryDraggableItem
                                    key={item.id}
                                    item={item}
                                    mode={mode}
                                    activeFilter={activeFilter}
                                    selected={selectedItemIds.includes(item.id)}
                                    onClick={() => handleItemClick(item)}
                                    onImageError={(e) => {
                                      e.currentTarget.src =
                                        PLACEHOLDER_IMAGES.DEFAULT;
                                      e.currentTarget.style.opacity = "0.3";
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).dataset.brokenurl =
                                        item.thumbnail || "";
                                      handleImageError(item.thumbnail!);
                                    }}
                                    disableTooltipAndBadge={mode === "select"}
                                    imageFit={imageFit}
                                    onDeleted={handleItemDeleted}
                                    onDelete={onDeleteMedia}
                                    onEditClicked={onEditClicked}
                                    maxSelections={maxSelections}
                                    bulkSelected={bulkSelectedIds.has(item.id)}
                                    onBulkSelectToggle={() =>
                                      toggleBulkSelect(item.id)
                                    }
                                    bulkSelectionMode={bulkSelectionMode}
                                    getBulkDragItems={getBulkDragItems}
                                    folders={folders}
                                    onAddToFolder={requestFolderDrop}
                                    onCreateFolderFromMenu={
                                      handleOpenNewFolderModal
                                    }
                                    onRemoveFromFolder={
                                      activeFolderId
                                        ? handleRemoveFromFolder
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            </LazyDateGroup>
                          );
                        },
                      )}
                      {folderLoadingMore && (
                        <div className="flex justify-center py-4">
                          <LoadingSpinner className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* ── Library view ── */
                  <>
                    {usernameError && allItems.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-sm">
                          <div className="text-base-fg/60">
                            Unable to load gallery. Please ensure you are logged
                            in.
                          </div>
                          <button
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                            onClick={() => {
                              setUsernameError(false);
                              setUsernameRetryCount((c) => c + 1);
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : itemsLoadError && allItems.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-sm max-w-xs text-center">
                          <div className="text-base-fg/60">
                            Failed to load gallery.
                          </div>
                          <div className="text-xs text-base-fg/40 font-mono break-all">
                            {itemsLoadError}
                          </div>
                          <div className="flex gap-3">
                            <button
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                              onClick={() =>
                                navigator.clipboard?.writeText(itemsLoadError!)
                              }
                            >
                              Copy error
                            </button>
                            <button
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                              onClick={() => refreshGallery()}
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (initialLoading || !username) &&
                      allItems.length === 0 ? (
                      <SkeletonGrid columns={gridColumns} />
                    ) : allItems.length === 0 &&
                      !loading &&
                      currentSubfolders.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-base-fg/40 text-sm">
                          No items yet
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 p-4">
                        {Object.entries(groupedItems).map(
                          ([date, dateItems], groupIndex) => {
                            const filteredItems = dateItems.filter(filterItem);
                            if (filteredItems.length === 0) return null;
                            return (
                              <LazyDateGroup
                                key={date}
                                eager={groupIndex < 2}
                                itemCount={filteredItems.length}
                                gridColumns={gridColumns}
                                scrollRoot={scrollContainerRef.current}
                              >
                                <h3 className="text-md mb-2 font-medium text-base-fg/60">
                                  {date}
                                </h3>
                                <div
                                  className={twMerge("grid", gapClass)}
                                  style={{
                                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {filteredItems.map((item) => (
                                    <GalleryDraggableItem
                                      key={item.id}
                                      item={item}
                                      mode={mode}
                                      activeFilter={activeFilter}
                                      selected={selectedItemIds.includes(
                                        item.id,
                                      )}
                                      onClick={() => handleItemClick(item)}
                                      onImageError={(e) => {
                                        e.currentTarget.src =
                                          PLACEHOLDER_IMAGES.DEFAULT;
                                        e.currentTarget.style.opacity = "0.3";
                                        (
                                          e.currentTarget as HTMLImageElement
                                        ).dataset.brokenurl =
                                          item.thumbnail || "";
                                        handleImageError(item.thumbnail!);
                                      }}
                                      disableTooltipAndBadge={mode === "select"}
                                      imageFit={imageFit}
                                      onDeleted={handleItemDeleted}
                                      onDelete={onDeleteMedia}
                                      onEditClicked={onEditClicked}
                                      maxSelections={maxSelections}
                                      bulkSelected={bulkSelectedIds.has(
                                        item.id,
                                      )}
                                      onBulkSelectToggle={() =>
                                        toggleBulkSelect(item.id)
                                      }
                                      bulkSelectionMode={bulkSelectionMode}
                                      getBulkDragItems={getBulkDragItems}
                                      folders={folders}
                                      onAddToFolder={handleAddToFolder}
                                      onCreateFolderFromMenu={
                                        handleOpenNewFolderModal
                                      }
                                    />
                                  ))}
                                </div>
                              </LazyDateGroup>
                            );
                          },
                        )}
                        {paginationLoading && allItems.length > 0 && (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner className="h-8 w-8" />
                          </div>
                        )}
                        {!hasMore && allItems.length > 0 && (
                          <div className="flex justify-center py-4 text-base-fg/40 text-xs">
                            No more items
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── New Folder dialog ── */}
            <FolderNameDialog
              isOpen={newFolderModalOpen}
              title="New folder"
              subtitle={`in ${
                newFolderParentId
                  ? (folders.find((f) => f.id === newFolderParentId)?.name ??
                    "My Library")
                  : "My Library"
              }`}
              initialValue="New Folder"
              confirmLabel="Create"
              onConfirm={handleCreateFolder}
              onClose={() => setNewFolderModalOpen(false)}
            />

            {/* ── Rename Folder dialog (sidebar context menu) ── */}
            <FolderNameDialog
              isOpen={!!(renameViaModal && renamingFolderId)}
              title="Rename folder"
              initialValue={
                folders.find((f) => f.id === renamingFolderId)?.name ?? ""
              }
              confirmLabel="Rename"
              onConfirm={handleConfirmRename}
              onClose={() => {
                setRenamingFolderId(null);
                setRenameViaModal(false);
              }}
            />

            {mode === "view" && bulkSelectionMode && (
              <div className="flex items-center justify-between border-t border-ui-panel-border bg-ui-background p-3 py-2 rounded-b-xl">
                <div className="flex items-center">
                  {/* Thumbnail previews of selected items */}
                  <div className="flex">
                    {bulkSelectedItems.slice(0, 4).map((si) => {
                      const placeholderIcon =
                        si.mediaClass === "video"
                          ? faVideo
                          : si.mediaClass === "dimensional"
                            ? faCube
                            : faImage;
                      return (
                        <BulkThumb
                          key={si.id}
                          thumbnail={si.thumbnail}
                          placeholderIcon={placeholderIcon}
                        />
                      );
                    })}
                  </div>
                  {bulkSelectedItems.length > 4 && (
                    <div className="h-8 w-8 rounded overflow-hidden border-2 border-ui-panel bg-black/20 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[11px] font-normal text-white/70">
                        +{bulkSelectedItems.length - 4}
                      </span>
                    </div>
                  )}
                  <span className="ms-2.5 text-sm font-medium text-base-fg/80">
                    {bulkSelectedIds.size} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Add to folder */}
                  <div className="relative">
                    <Button
                      variant="action"
                      onClick={() => setBulkFolderPopoverOpen((v) => !v)}
                      className="px-3 bg-ui-controls/60 hover:bg-ui-controls/90"
                      icon={faFolderPlus}
                    >
                      Add to folder
                    </Button>
                    {bulkFolderPopoverOpen && (
                      <>
                        {/* Backdrop to close */}
                        <div
                          className="fixed inset-0 z-[59]"
                          onClick={() => setBulkFolderPopoverOpen(false)}
                        />
                        <div className="absolute bottom-full mb-2 right-0 w-56 rounded-lg border border-ui-panel-border bg-ui-panel p-2 shadow-xl z-[60]">
                          {/* Folders */}
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-fg/40 px-2 py-1">
                            Folders
                          </div>
                          {folders.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-base-fg/30 italic">
                              No folders yet
                            </div>
                          ) : (
                            folders.map((folder) => (
                              <button
                                key={folder.id}
                                type="button"
                                className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-ui-controls/50 text-sm text-base-fg transition-colors"
                                onClick={() => {
                                  const ids = Array.from(bulkSelectedIds);
                                  requestFolderDrop(ids, folder.id);
                                  setBulkFolderPopoverOpen(false);
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faFolder}
                                  className="text-primary text-xs"
                                />
                                <span className="truncate">{folder.name}</span>
                              </button>
                            ))
                          )}
                          <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
                          <button
                            type="button"
                            className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-ui-controls/50 text-sm text-base-fg/70 transition-colors"
                            onClick={() => {
                              setBulkFolderPopoverOpen(false);
                              handleOpenNewFolderModal();
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className="text-xs w-4"
                            />
                            <span>Create new folder</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {onDeleteMedia && (
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="px-3"
                      icon={faTrashCan}
                    >
                      Delete
                    </Button>
                  )}
                  <button
                    onClick={clearBulkSelection}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-ui-controls/60 hover:bg-ui-controls/90 text-base-fg transition-colors"
                    aria-label="Clear selection"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-base" />
                  </button>
                </div>
              </div>
            )}

            {mode === "select" && (
              <div className="flex items-center justify-between border-t border-ui-panel-border bg-ui-panel p-4 rounded-b-xl">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-base-fg/80">
                    {selectedItemIds.length}/{maxSelections} selected
                  </div>
                  {selectedItemIds.length > 0 && (
                    <span className="text-base-fg/10">|</span>
                  )}
                  {selectedItemIds.length > 0 && (
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-base-fg/60 hover:text-base-fg"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleUseSelected}
                  disabled={selectedItemIds.length === 0 || useSelectedLoading}
                  loading={useSelectedLoading}
                >
                  Use selected
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {mode === "view" && (
          <LightboxModal
            isOpen={lightboxVisibleSignal.value}
            onClose={handleCloseLightbox}
            onCloseGallery={handleCloseGallery}
            imageUrl={imageUrl}
            // pass multiple images if present
            imageUrls={imageUrls}
            actionUrls={actionUrls}
            mediaTokens={(lightboxImageSignal.value as any)?.mediaTokens}
            initialIndex={(lightboxImageSignal.value as any)?.initialIndex}
            batchImageToken={
              (lightboxImageSignal.value as any)?.batchImageToken
            }
            imageAlt={lightboxImageSignal.value?.label || ""}
            onImageError={() => imageUrl && handleImageError(imageUrl)}
            title={lightboxImageSignal.value?.label}
            createdAt={lightboxImageSignal.value?.createdAt}
            downloadUrl={imageUrl}
            mediaId={lightboxImageSignal.value?.id}
            onDownloadClicked={onDownloadClicked}
            onAddToSceneClicked={onAddToSceneClicked}
            mediaClass={lightboxImageSignal.value?.mediaClass}
            onEditClicked={onEditClicked}
            onTurnIntoVideoClicked={onTurnIntoVideoClicked}
            onRemoveBackgroundClicked={onRemoveBackgroundClicked}
            onMake3DObjectClicked={onMake3DObjectClicked}
            onMake3DWorldClicked={onMake3DWorldClicked}
            onRecreateClicked={onRecreateClicked}
            onNavigatePrev={
              galleryModalLightboxNavPrev.value ?? handleNavigatePrev
            }
            onNavigateNext={
              galleryModalLightboxNavNext.value ?? handleNavigateNext
            }
            onNavigateToMedia={handleNavigateToMedia}
          />
        )}

        {/* Right-click context menu for sidebar folders — portaled to body to avoid transform issues */}
        {contextMenu &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setContextMenu(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu(null);
                }}
              />
              <FolderContextMenuItems
                className="fixed z-[9999]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                folderId={contextMenu.folderId}
                hasStar={
                  folders.find((f) => f.id === contextMenu.folderId)?.hasStar
                }
                colorCode={
                  folders.find((f) => f.id === contextMenu.folderId)?.colorCode
                }
                onRename={(id) => handleStartRename(id, true)}
                onDelete={handleDeleteFolder}
                onNewSubfolder={(id) => {
                  setContextMenu(null);
                  handleOpenNewFolderModal(id);
                }}
                onToggleStar={handleSetFolderStar}
                onSetColor={handleSetFolderColor}
              />
            </>,
            document.body,
          )}
      </>
    );
  },
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
