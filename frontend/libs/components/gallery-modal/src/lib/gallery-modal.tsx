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
import {
  FilterMediaClasses,
  FilterMediaType,
  GalleryModalApi,
  MediaFilesApi,
  UsersApi,
} from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { useSignals } from "@preact/signals-react/runtime";
import {
  getThumbnailUrl,
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
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
} from "@fortawesome/pro-solid-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
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

const FILTERS = [
  { id: "all", label: "All", icon: <FontAwesomeIcon icon={faBorderAll} /> },
  { id: "image", label: "Image", icon: <FontAwesomeIcon icon={faImage} /> },
  { id: "video", label: "Video", icon: <FontAwesomeIcon icon={faVideo} /> },
  { id: "3d", label: "3D Object", icon: <FontAwesomeIcon icon={faCube} /> },
  {
    id: "uploaded",
    label: "Uploaded",
    icon: <FontAwesomeIcon icon={faUpload} />,
  },
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
    const gridColumns = isNarrow
      ? 2
      : maxColumns - (sliderValue - minColumns);
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

    const handleImageError = useCallback((url: string) => {
      console.error(`Failed to load gallery modal image: ${url}`);
      failedImageUrls.current.add(url);
    }, []);

    // Ref to the latest refreshGallery so the async session-fetch effect can
    // call it without taking a dependency on it. refreshGallery itself is
    // defined lower in the file (it needs loadItems); we wire the ref via a
    // layout-time assignment below.
    const refreshGalleryRef = useRef<() => void>(() => { });

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
            setItemsLoadError(response.errorMessage || "Request failed (unknown error)");
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

    const handleItemDeleted = useCallback(
      (id: string) => {
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
      },
      [],
    );

    const clearBulkSelection = useCallback(() => {
      setBulkSelectedIds(new Set());
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
        if (
          scrollHeight - scrollTop - clientHeight < 100 &&
          hasMore &&
          !isLoadingRef.current
        ) {
          loadItems();
        }
      },
      [hasMore, loadItems],
    );

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
            "h-[620px] max-h-[90vh] w-full max-w-4xl rounded-xl",
            mode === "view" &&
            "h-[640px] min-h-[640px] min-w-[56rem] w-[56rem] max-w-none",
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
          <div className="flex h-full flex-col">
            <div className="border-b border-ui-panel-border p-4 py-3 bg-ui-panel rounded-t-xl">
              <div className="flex flex-wrap justify-between items-center gap-y-2">
                <div className="flex items-center gap-3 flex-wrap gap-y-1">
                  <h2 className="text-xl font-semibold">
                    {mode === "select"
                      ? activeFilter === "video"
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
                                : "Select Images"
                      : "My Library"}
                  </h2>
                  {mode === "view" && (
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
                  {activeFilter !== "uploaded" && (
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
                      tooltipContent={`${maxColumns - (sliderValue - minColumns)
                        } columns`}
                    />
                  </div>
                  {/* Filter popover */}
                  {!hideFilter && (
                    <Tooltip
                      position="top"
                      content={
                        forceFilter ? "Filter locked" : "Filter"
                      }
                      closeOnClick={true}
                    >
                      <PopoverMenu
                        panelTitle="Filter"
                        position="bottom"
                        align="end"
                        buttonClassName={`relative z-[51] mr-3 ${forceFilter
                          ? "opacity-70 pointer-events-none"
                          : ""
                          }`}
                        panelClassName="min-w-36"
                        items={FILTERS.map((f) => ({
                          label: f.label,
                          selected: activeFilter === f.id,
                          icon: f.icon,
                          // Use a custom property that will be passed through but not cause type errors
                          customProps: {
                            disabled: forceFilter !== undefined,
                          },
                        }))}
                        onSelect={(item) => {
                          // Only allow filter changes if no forceFilter was provided
                          if (!forceFilter) {
                            const filter = FILTERS.find(
                              (f) => f.label === item.label,
                            );
                            if (filter) setActiveFilter(filter.id);
                          }
                        }}
                        triggerIcon={<FontAwesomeIcon icon={faFilter} />}
                        triggerLabel={
                          FILTERS.find((f) => f.id === activeFilter)?.label
                        }
                        mode="toggle"
                        showIconsInList={true}
                      />
                    </Tooltip>
                  )}
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

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto bg-ui-panel"
              onScroll={handleScroll}
            >
              {usernameError && allItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-sm">
                    <div className="text-base-fg/60">Unable to load gallery. Please ensure you are logged in.</div>
                    <button
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                      onClick={() => { setUsernameError(false); setUsernameRetryCount(c => c + 1); }}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : itemsLoadError && allItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-sm max-w-xs text-center">
                    <div className="text-base-fg/60">Failed to load gallery.</div>
                    <div className="text-xs text-base-fg/40 font-mono break-all">{itemsLoadError}</div>
                    <div className="flex gap-3">
                      <button
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                        onClick={() => navigator.clipboard?.writeText(itemsLoadError!)}
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
              ) : (initialLoading || !username) && allItems.length === 0 ? (
                <SkeletonGrid columns={gridColumns} />
              ) : allItems.length === 0 && !loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-base-fg/40 text-sm">No items yet</div>
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
                                selected={selectedItemIds.includes(item.id)}
                                onClick={() => handleItemClick(item)}
                                onImageError={(e) => {
                                  e.currentTarget.src =
                                    PLACEHOLDER_IMAGES.DEFAULT;
                                  e.currentTarget.style.opacity = "0.3";
                                  // Set the `data-brokenurl` property for debugging the broken images:
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).dataset.brokenurl = item.thumbnail || "";
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
            </div>

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
            onNavigatePrev={galleryModalLightboxNavPrev.value ?? handleNavigatePrev}
            onNavigateNext={galleryModalLightboxNavNext.value ?? handleNavigateNext}
            onNavigateToMedia={handleNavigateToMedia}
          />
        )}
      </>
    );
  },
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
