import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import {
  UsersApi,
  GalleryModalApi,
  FilterMediaClasses,
  FilterMediaType,
} from "@storyteller/api";
import {
  GalleryDraggableItem,
  GalleryFolderChip,
  GalleryDragComponent,
  FolderColorRow,
  FolderNameDialog,
  compareFolders,
  promptFolderDrop,
  FOLDER_DROP_EVENT,
  type GalleryItem,
} from "@storyteller/ui-gallery-modal";
import { PLACEHOLDER_IMAGES } from "@storyteller/common";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBorderAll,
  faCube,
  faImage,
  faVideo,
  faPencil,
  faTrashCan,
  faFolderPlus,
  faFolder,
  faFolderOpen,
  faPlus,
  faXmark,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { Lightbox } from "../../components/lightbox/lightbox";
import {
  useLibraryFoldersStore,
  mapRawToGalleryItem,
  deleteLibraryMedia,
} from "./library-folders-store";

const PAGE_SIZE = 60;

const FILTERS = [
  { id: "all", label: "All", icon: faBorderAll, route: "/library" },
  { id: "image", label: "Images", icon: faImage, route: "/library/images" },
  { id: "video", label: "Videos", icon: faVideo, route: "/library/videos" },
  { id: "meshes", label: "Meshes", icon: faCube, route: "/library/meshes" },
];

const ROUTE_TO_FILTER: Record<string, string> = {
  images: "image",
  videos: "video",
  meshes: "meshes",
};

const getFilterMediaClass = (
  filter: string,
): FilterMediaClasses[] | undefined => {
  switch (filter) {
    case "image":
      return [FilterMediaClasses.IMAGE];
    case "video":
      return [FilterMediaClasses.VIDEO];
    case "meshes":
      return [FilterMediaClasses.DIMENSIONAL];
    default:
      return [
        FilterMediaClasses.IMAGE,
        FilterMediaClasses.VIDEO,
        FilterMediaClasses.DIMENSIONAL,
      ];
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

const groupByDate = (items: GalleryItem[]) => {
  const grouped: Record<string, GalleryItem[]> = {};
  for (const item of items) {
    const key = formatDate(item.createdAt);
    (grouped[key] ??= []).push(item);
  }
  return Object.entries(grouped).sort(
    (a, b) =>
      new Date(b[1][0].createdAt).getTime() -
      new Date(a[1][0].createdAt).getTime(),
  );
};

// Find the nearest scrollable ancestor (the layout scrolls inside SidebarInset,
// not the window) so infinite scroll fires no matter who owns the scrollbar.
const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
  let el = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === "auto" || oy === "scroll") return el;
    el = el.parentElement;
  }
  return null;
};

const GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3";

// ── Component ──────────────────────────────────────────────────────────────

export default function Library() {
  // `:slug` is either a media-class filter (images/videos/meshes) or a folder
  // token (prefixed `folder_`). `/library/folders` (static) has no slug.
  const { slug } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const folderToken = slug?.startsWith("folder_") ? slug : undefined;
  const filterParam = slug && !folderToken ? slug : undefined;
  const activeFilter = filterParam
    ? (ROUTE_TO_FILTER[filterParam] ?? "all")
    : "all";
  // Top-level tab derived from the route: All Assets (flat library) vs Folders.
  const onFoldersRoute = pathname === "/library/folders" || !!folderToken;
  const tab: "unsorted" | "folders" = onFoldersRoute ? "folders" : "unsorted";

  const [username, setUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Bulk selection state
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const bulkSelectionMode = bulkSelectedIds.size > 0;
  const [bulkFolderPopoverOpen, setBulkFolderPopoverOpen] = useState(false);

  const api = useMemo(() => new GalleryModalApi(), []);

  // ── Folder store ──────────────────────────────────────────────────────────
  const folders = useLibraryFoldersStore((s) => s.folders);
  const activeFolderId = useLibraryFoldersStore((s) => s.activeFolderId);
  const folderMediaItems = useLibraryFoldersStore((s) => s.folderMediaItems);
  const folderContentLoading = useLibraryFoldersStore(
    (s) => s.folderContentLoading,
  );
  const folderLoadingMore = useLibraryFoldersStore((s) => s.folderLoadingMore);
  const loadFolderMedia = useLibraryFoldersStore((s) => s.loadFolderMedia);
  const newFolderModal = useLibraryFoldersStore((s) => s.newFolderModal);
  const renameTarget = useLibraryFoldersStore((s) => s.renameTarget);
  const contextMenu = useLibraryFoldersStore((s) => s.contextMenu);
  const loadFolders = useLibraryFoldersStore((s) => s.loadFolders);
  const setActiveFolder = useLibraryFoldersStore((s) => s.setActiveFolder);
  const createFolder = useLibraryFoldersStore((s) => s.createFolder);
  const renameFolderAction = useLibraryFoldersStore((s) => s.renameFolder);
  const setFolderStar = useLibraryFoldersStore((s) => s.setFolderStar);
  const setFolderColor = useLibraryFoldersStore((s) => s.setFolderColor);
  const deleteFolderAction = useLibraryFoldersStore((s) => s.deleteFolder);
  const addMediaToFolder = useLibraryFoldersStore((s) => s.addMediaToFolder);
  const moveMediaToFolder = useLibraryFoldersStore((s) => s.moveMediaToFolder);
  const removeMediaFromFolder = useLibraryFoldersStore(
    (s) => s.removeMediaFromFolder,
  );
  const openNewFolderModal = useLibraryFoldersStore(
    (s) => s.openNewFolderModal,
  );
  const closeNewFolderModal = useLibraryFoldersStore(
    (s) => s.closeNewFolderModal,
  );
  const setRenameTarget = useLibraryFoldersStore((s) => s.setRenameTarget);
  const setContextMenu = useLibraryFoldersStore((s) => s.setContextMenu);

  const activeFolder = activeFolderId
    ? (folders.find((f) => f.id === activeFolderId) ?? null)
    : null;

  const currentSubfolders = useMemo(
    () =>
      folders
        .filter((f) => (f.parentId ?? null) === activeFolderId)
        .sort(compareFolders),
    [folders, activeFolderId],
  );

  // Folder navigation goes through the URL (so back/forward + deep-links work).
  const goToFolder = useCallback(
    (id: string | null) => navigate(id ? `/library/${id}` : "/library/folders"),
    [navigate],
  );

  const folderPath = useMemo(() => {
    if (!activeFolderId) return [] as { id: string; name: string }[];
    const byId = new Map(folders.map((f) => [f.id, f]));
    const path: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    let cursor = byId.get(activeFolderId);
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      path.unshift({ id: cursor.id, name: cursor.name });
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return path;
  }, [folders, activeFolderId]);

  const subfolderCount = useCallback(
    (folderId: string) => folders.filter((f) => f.parentId === folderId).length,
    [folders],
  );

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const usersApi = new UsersApi();
      const response = await usersApi.GetSession();
      if (response.success && response.data?.loggedIn && response.data.user) {
        setUsername(response.data.user.username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    })();
  }, []);

  // Load the folder tree once we know who the user is.
  useEffect(() => {
    if (username) loadFolders();
  }, [username, loadFolders]);

  // The URL owns *which* folder is open (`/library/:token`); mirror it into the
  // store. Read via getState() + inequality guard so this never loops.
  useEffect(() => {
    const target = folderToken ?? null;
    if (useLibraryFoldersStore.getState().activeFolderId !== target) {
      setActiveFolder(target);
    }
  }, [folderToken, setActiveFolder]);

  // ── Root media loading (library view, no folder open) ─────────────────────
  const loadItems = useCallback(
    async (reset = false) => {
      if (!username) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      try {
        const response = await api.listUserMediaFiles({
          username,
          filter_media_classes: getFilterMediaClass(activeFilter),
          include_user_uploads: true,
          page_index: reset ? 0 : pageIndex,
          page_size: PAGE_SIZE,
        });
        if (response.success && response.data) {
          const newItems = response.data
            .filter(
              (item: any) => item.media_type !== FilterMediaType.SCENE_JSON,
            )
            .map(mapRawToGalleryItem);
          setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          setHasMore(current + 1 < total);
        }
      } catch {
        // ignore
      }
      setLoading(false);
      setInitialLoading(false);
      isLoadingRef.current = false;
    },
    [username, activeFilter, pageIndex, api],
  );

  // Initial load + filter change
  useEffect(() => {
    if (!username) return;
    setAllItems([]);
    setPageIndex(0);
    setHasMore(true);
    setInitialLoading(true);
    isLoadingRef.current = false;
    loadItems(true);
  }, [username, activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — listens on the real scroll container. Paginates the open
  // folder's media when inside a folder, otherwise the root library list.
  // (The store guards folder loads against concurrent/no-more calls.)
  useEffect(() => {
    const scroller = getScrollParent(rootRef.current) ?? window;
    const handleScroll = () => {
      const el =
        scroller === window
          ? document.documentElement
          : (scroller as HTMLElement);
      const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (scrollBottom >= 500) return;
      if (activeFolderId) {
        loadFolderMedia(activeFolderId, false);
      } else if (tab === "unsorted" && hasMore && !isLoadingRef.current) {
        loadItems();
      }
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [activeFolderId, tab, hasMore, loadItems, loadFolderMedia]);

  // ── Drag media → folder ───────────────────────────────────────────────────
  const displayItems = activeFolderId
    ? (folderMediaItems[activeFolderId] ?? [])
    : allItems;
  const displayItemsRef = useRef(displayItems);
  displayItemsRef.current = displayItems;

  // Single entry point for drops + add-to-folder: prompt Move/Add when the
  // source is another folder, else add directly (root → always add).
  const requestFolderDrop = useCallback(
    (itemIds: string[], targetFolderId: string) => {
      if (itemIds.length === 0) return;
      const source = useLibraryFoldersStore.getState().activeFolderId;
      const known = displayItemsRef.current;
      if (source && source !== targetFolderId) {
        promptFolderDrop({
          count: itemIds.length,
          targetFolderName: folders.find((f) => f.id === targetFolderId)?.name,
          onMove: () =>
            moveMediaToFolder(itemIds, source, targetFolderId, known),
          onAdd: () => addMediaToFolder(itemIds, targetFolderId, known),
        });
      } else {
        addMediaToFolder(itemIds, targetFolderId, known);
      }
    },
    [folders, addMediaToFolder, moveMediaToFolder],
  );

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

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const bulkSelectedIdsRef = useRef(bulkSelectedIds);
  bulkSelectedIdsRef.current = bulkSelectedIds;

  const toggleBulkSelect = useCallback((id: string) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearBulkSelection = useCallback(() => {
    setBulkSelectedIds(new Set());
    setBulkFolderPopoverOpen(false);
  }, []);

  // Stable across renders — read live values from refs (only called on drag start).
  const getBulkDragItems = useCallback(
    () =>
      displayItemsRef.current.filter((it) =>
        bulkSelectedIdsRef.current.has(it.id),
      ),
    [],
  );

  const bulkSelectedItems = useMemo(
    () => displayItems.filter((it) => bulkSelectedIds.has(it.id)),
    [displayItems, bulkSelectedIds],
  );

  // Clear the selection whenever the view changes (filter or folder).
  useEffect(() => {
    setBulkSelectedIds(new Set());
    setBulkFolderPopoverOpen(false);
  }, [activeFilter, activeFolderId]);

  const handleBulkAddToFolder = useCallback(
    (folderId: string) => {
      requestFolderDrop(Array.from(bulkSelectedIdsRef.current), folderId);
      clearBulkSelection();
    },
    [requestFolderDrop, clearBulkSelection],
  );

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(bulkSelectedIdsRef.current);
    if (ids.length === 0) return;
    showActionReminder({
      reminderType: "default",
      title: `Delete ${ids.length} item${ids.length > 1 ? "s" : ""}?`,
      message: (
        <p className="text-sm text-white/70">
          This will permanently remove {ids.length} item
          {ids.length > 1 ? "s" : ""} from your library. This action cannot be
          undone.
        </p>
      ),
      primaryActionText: "Delete",
      secondaryActionText: "Cancel",
      primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
      onPrimaryAction: async () => {
        try {
          await Promise.allSettled(ids.map((id) => deleteLibraryMedia(id)));
          const idSet = new Set(ids);
          setAllItems((prev) => prev.filter((it) => !idSet.has(it.id)));
          clearBulkSelection();
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  }, [clearBulkSelection]);

  const groupedItems = useMemo(() => groupByDate(displayItems), [displayItems]);
  const flatItems = useMemo(
    () => groupedItems.flatMap(([, items]) => items),
    [groupedItems],
  );

  // ── Lightbox navigation ───────────────────────────────────────────────────
  const currentIndex = lightboxItem
    ? flatItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;
  const navigatePrev =
    currentIndex > 0
      ? () => setLightboxItem(flatItems[currentIndex - 1])
      : undefined;
  const navigateNext =
    currentIndex >= 0 && currentIndex < flatItems.length - 1
      ? () => setLightboxItem(flatItems[currentIndex + 1])
      : undefined;

  const handleItemDeleted = useCallback((id: string) => {
    setAllItems((prev) => prev.filter((item) => item.id !== id));
    // Also drop it from any cached folder views (e.g. deleted via the lightbox).
    useLibraryFoldersStore.setState((s) => {
      const next: Record<string, GalleryItem[]> = {};
      for (const [k, items] of Object.entries(s.folderMediaItems)) {
        next[k] = items.filter((it) => it.id !== id);
      }
      return { folderMediaItems: next };
    });
  }, []);

  const handleCardClick = useCallback(
    (item: GalleryItem) => {
      if (bulkSelectionMode) {
        toggleBulkSelect(item.id);
        return;
      }
      setLightboxItem(item);
      setLightboxOpen(true);
    },
    [bulkSelectionMode, toggleBulkSelect],
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = PLACEHOLDER_IMAGES.DEFAULT;
      e.currentTarget.style.opacity = "0.3";
    },
    [],
  );

  const refreshRoot = useCallback(() => {
    setAllItems([]);
    setPageIndex(0);
    setHasMore(true);
    setInitialLoading(true);
    isLoadingRef.current = false;
    loadItems(true);
  }, [loadItems]);

  // ── Folder dialog handlers ────────────────────────────────────────────────
  const submitNewFolder = (name: string) => {
    createFolder(name, newFolderModal.parentId);
    closeNewFolderModal();
  };

  const startRename = (folderId: string) => setRenameTarget(folderId);

  const submitRename = (name: string) => {
    if (renameTarget) renameFolderAction(renameTarget, name);
    setRenameTarget(null);
  };

  const confirmDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    showActionReminder({
      reminderType: "default",
      title: `Delete "${folder?.name ?? "folder"}"?`,
      message: (
        <p className="text-sm text-white/70">
          Subfolders move to the top level. Items stay in your library.
        </p>
      ),
      primaryActionText: "Delete",
      secondaryActionText: "Cancel",
      primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
      onPrimaryAction: async () => {
        try {
          await deleteFolderAction(folderId);
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  };

  // ── Not logged in / loading auth ──────────────────────────────────────────
  if (isLoggedIn === false) {
    return (
      <div className="relative min-h-full w-full bg-[#101014] flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-medium text-white">My Library</h1>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            Sign in to view your generated images and videos.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button
                variant="primary"
                className="rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold px-6 py-2.5"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="rounded-full text-sm font-semibold px-6 py-2.5"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn === null) {
    return (
      <div className="relative min-h-full w-full bg-[#101014] flex items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-white/60" />
      </div>
    );
  }

  const inFolder = !!activeFolderId;
  const rootEmpty =
    !inFolder && allItems.length === 0 && !loading && !initialLoading;
  const folderEmpty =
    inFolder &&
    displayItems.length === 0 &&
    currentSubfolders.length === 0 &&
    !folderContentLoading;

  // Shared date-grouped media grid (source items differ per mode via displayItems).
  const mediaGrid = (
    <>
      {groupedItems.map(([date, dateItems]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-white/50 mb-2">{date}</h3>
          <div className={GRID_CLASS}>
            {dateItems.map((item) => (
              <GalleryDraggableItem
                key={item.id}
                item={item}
                mode="view"
                activeFilter={activeFilter}
                selected={false}
                onClick={() => handleCardClick(item)}
                onImageError={handleImageError}
                imageFit="cover"
                onDeleted={handleItemDeleted}
                onDelete={deleteLibraryMedia}
                folders={folders}
                onAddToFolder={requestFolderDrop}
                onCreateFolderFromMenu={() =>
                  openNewFolderModal(activeFolderId)
                }
                onRemoveFromFolder={
                  activeFolderId
                    ? (ids) => removeMediaFromFolder(ids, activeFolderId)
                    : undefined
                }
                bulkSelected={bulkSelectedIds.has(item.id)}
                bulkSelectionMode={bulkSelectionMode}
                onBulkSelectToggle={() => toggleBulkSelect(item.id)}
                getBulkDragItems={getBulkDragItems}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div
      ref={rootRef}
      className="relative min-h-full w-full bg-[#101014] pb-8 px-3 sm:px-4 md:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Header — sticky below navbar */}
        <div className="sticky top-0 z-50 -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 px-3 sm:px-4 md:px-8 lg:px-12 pb-3 pt-3 bg-[#101014] mb-6">
          <div className="flex flex-col gap-6">
            {/* Tabs + actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-ui-controls/40 rounded-lg p-1">
                  <Link
                    to="/library"
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "unsorted"
                        ? "bg-ui-controls text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FontAwesomeIcon icon={faBorderAll} className="text-xs" />
                    <span>All Assets</span>
                  </Link>
                  <Link
                    to="/library/folders"
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "folders"
                        ? "bg-ui-controls text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FontAwesomeIcon icon={faFolder} className="text-xs" />
                    <span>Folders</span>
                  </Link>
                </div>
                {tab === "unsorted" && (
                  <button
                    onClick={refreshRoot}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-ui-controls/40 transition-colors"
                    title="Refresh library"
                  >
                    <FontAwesomeIcon
                      icon={faArrowsRotate}
                      className={`text-sm ${initialLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {tab === "unsorted" && (
                  <div className="flex items-center gap-1 bg-ui-controls/40 rounded-lg p-1 overflow-x-auto">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => navigate(filter.route)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          activeFilter === filter.id
                            ? "bg-ui-controls text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={filter.icon}
                          className="text-xs"
                        />
                        <span className="hidden sm:inline">{filter.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === "folders" && !inFolder && (
                  <Button
                    variant="primary"
                    icon={faFolderPlus}
                    onClick={() => openNewFolderModal(null)}
                    className="rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    New folder
                  </Button>
                )}
              </div>
            </div>

            {/* Breadcrumb (inside a folder) */}
            {tab === "folders" && inFolder && (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <button
                  onClick={() => goToFolder(null)}
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  Folders
                </button>
                {folderPath.slice(0, -1).map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-1.5">
                    <span className="text-white/30">/</span>
                    <button
                      onClick={() => goToFolder(crumb.id)}
                      className="text-white/50 hover:text-white text-sm transition-colors truncate max-w-[10rem]"
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
                <span className="text-white/30">/</span>
                <h1 className="text-lg sm:text-xl font-medium text-white truncate max-w-[16rem]">
                  {activeFolder?.name}
                </h1>
                <button
                  onClick={() => startRename(activeFolderId!)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-ui-controls/40 transition-colors"
                  title="Rename folder"
                >
                  <FontAwesomeIcon icon={faPencil} className="text-xs" />
                </button>
                <button
                  onClick={() => openNewFolderModal(activeFolderId)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-ui-controls/40 transition-colors"
                  title="New subfolder"
                >
                  <FontAwesomeIcon icon={faFolderPlus} className="text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Folder cards — Folders tab only */}
          {tab === "folders" && currentSubfolders.length > 0 && (
            <div>
              {inFolder && (
                <h3 className="text-sm font-medium text-white/50 mb-2">
                  Folders
                </h3>
              )}
              <div className={GRID_CLASS}>
                {currentSubfolders.map((folder) => (
                  <GalleryFolderChip
                    key={folder.id}
                    folder={folder}
                    childCount={subfolderCount(folder.id)}
                    onOpen={goToFolder}
                    onContextMenu={(folderId, x, y) =>
                      setContextMenu({ folderId, x, y })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "folders" && !inFolder ? (
            /* ── Folders tab, root: cards only (above) ── */
            currentSubfolders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ui-controls/30">
                  <FontAwesomeIcon
                    icon={faFolderOpen}
                    className="text-2xl text-white/40"
                  />
                </div>
                <p className="text-white/40 text-sm">No folders yet.</p>
                <Button
                  variant="primary"
                  icon={faFolderPlus}
                  onClick={() => openNewFolderModal(null)}
                  className="rounded-full text-sm px-4 py-2"
                >
                  New folder
                </Button>
              </div>
            )
          ) : tab === "folders" && inFolder ? (
            /* ── Inside a folder ── */
            folderContentLoading && displayItems.length === 0 ? (
              currentSubfolders.length === 0 ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner className="h-8 w-8 text-white/60" />
                </div>
              ) : null
            ) : folderEmpty ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-white/40 text-sm mb-4">
                  This folder is empty.
                </p>
                <div className="flex gap-3">
                  <Link to="/create-image">
                    <Button
                      variant="primary"
                      className="rounded-full text-sm px-4 py-2"
                    >
                      Create Image
                    </Button>
                  </Link>
                  <Link to="/create-video">
                    <Button
                      variant="secondary"
                      className="rounded-full text-sm px-4 py-2 border border-ui-panel-border"
                    >
                      Create Video
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {mediaGrid}
                {folderLoadingMore && (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner className="h-8 w-8 text-white/60" />
                  </div>
                )}
              </>
            )
          ) : /* ── Unsorted ── */ initialLoading && allItems.length === 0 ? (
            <div>
              <div className="h-4 w-24 rounded bg-white/[0.06] mb-3" />
              <div className={GRID_CLASS}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <div
                      className="h-full w-full bg-white/[0.06]"
                      style={{
                        animation: `pulse 1.8s ease-in-out ${i * 0.07}s infinite`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <style>{`@keyframes pulse {0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
            </div>
          ) : rootEmpty ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-white/40 text-sm mb-4">No items yet.</p>
              <div className="flex gap-3">
                <Link to="/create-image">
                  <Button
                    variant="primary"
                    className="rounded-full text-sm px-4 py-2"
                  >
                    Create Image
                  </Button>
                </Link>
                <Link to="/create-video">
                  <Button
                    variant="secondary"
                    className="rounded-full text-sm px-4 py-2 border border-ui-panel-border"
                  >
                    Create Video
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {mediaGrid}
              {loading && allItems.length > 0 && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner className="h-8 w-8 text-white/60" />
                </div>
              )}
              {!hasMore && allItems.length > 0 && (
                <div className="flex justify-center py-4 text-white/40 text-xs">
                  No more items
                </div>
              )}
            </>
          )}
        </div>

        {/* Bulk selection bar */}
        {bulkSelectionMode && (
          <div className="sticky bottom-20 sm:bottom-4 z-30 mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-ui-panel-border bg-ui-panel/95 px-2.5 py-2 shadow-xl backdrop-blur">
            <div className="hidden sm:flex pl-1">
              {bulkSelectedItems.slice(0, 4).map((si) => (
                <BulkThumb key={si.id} item={si} />
              ))}
              {bulkSelectedItems.length > 4 && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border-2 border-ui-panel bg-black/20">
                  <span className="text-[11px] text-white/70">
                    +{bulkSelectedItems.length - 4}
                  </span>
                </div>
              )}
            </div>
            <span className="px-1 text-sm font-medium text-white/80">
              {bulkSelectedIds.size} selected
            </span>

            {/* Add to folder */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBulkFolderPopoverOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-ui-controls/90 transition-colors"
              >
                <FontAwesomeIcon icon={faFolderPlus} className="text-xs" />
                Add to folder
              </button>
              {bulkFolderPopoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[59]"
                    onClick={() => setBulkFolderPopoverOpen(false)}
                  />
                  <div className="absolute bottom-full right-0 z-[60] mb-2 max-h-72 w-56 overflow-y-auto rounded-lg border border-ui-panel-border bg-ui-panel p-2 shadow-xl">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Folders
                    </div>
                    {folders.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs italic text-white/30">
                        No folders yet
                      </div>
                    ) : (
                      folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => handleBulkAddToFolder(folder.id)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-white hover:bg-ui-controls/50 transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faFolder}
                            className="text-xs text-primary"
                          />
                          <span className="truncate">{folder.name}</span>
                        </button>
                      ))
                    )}
                    <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFolderPopoverOpen(false);
                        openNewFolderModal(activeFolderId);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-ui-controls/50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-4 text-xs" />
                      <span>Create new folder</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-full bg-red/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red transition-colors"
            >
              <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearBulkSelection}
              aria-label="Clear selection"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-controls/60 text-white hover:bg-ui-controls/90 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}
      </div>

      {/* Floating drag preview (multi-select count chip) */}
      <GalleryDragComponent />

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxItem(null);
        }}
        mediaToken={lightboxItem?.id}
        cdnUrl={lightboxItem?.fullImage}
        mediaClass={lightboxItem?.mediaClass}
        batchImageToken={lightboxItem?.batchImageToken}
        showBatchCarousel={false}
        onNavigatePrev={navigatePrev}
        onNavigateNext={navigateNext}
        onDeleted={handleItemDeleted}
      />

      {/* New folder dialog */}
      <FolderNameDialog
        isOpen={newFolderModal.open}
        title="New folder"
        subtitle={
          newFolderModal.parentId
            ? `in ${folders.find((f) => f.id === newFolderModal.parentId)?.name ?? "My Library"}`
            : "in My Library"
        }
        initialValue="New Folder"
        confirmLabel="Create"
        onConfirm={submitNewFolder}
        onClose={closeNewFolderModal}
      />

      {/* Rename dialog */}
      <FolderNameDialog
        isOpen={!!renameTarget}
        title="Rename folder"
        initialValue={folders.find((f) => f.id === renameTarget)?.name ?? ""}
        confirmLabel="Rename"
        onConfirm={submitRename}
        onClose={() => setRenameTarget(null)}
      />

      {/* Folder context menu (portaled) */}
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
            <div
              className="fixed z-[9999] min-w-44 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {(() => {
                const menuFolder = folders.find(
                  (f) => f.id === contextMenu.folderId,
                );
                return (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
                      onClick={() => {
                        setFolderStar(
                          contextMenu.folderId,
                          !menuFolder?.hasStar,
                        );
                        setContextMenu(null);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faStar}
                        className={`w-4 ${menuFolder?.hasStar ? "text-amber-400" : "text-base-fg/40"}`}
                      />
                      <span>{menuFolder?.hasStar ? "Unstar" : "Star"}</span>
                    </button>
                    <FolderColorRow
                      colorCode={menuFolder?.colorCode}
                      onSetColor={(c) =>
                        setFolderColor(contextMenu.folderId, c)
                      }
                    />
                    <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
                  </>
                );
              })()}
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
                onClick={() => {
                  openNewFolderModal(contextMenu.folderId);
                }}
              >
                <FontAwesomeIcon icon={faFolderPlus} className="w-4" />
                <span>New subfolder</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
                onClick={() => startRename(contextMenu.folderId)}
              >
                <FontAwesomeIcon icon={faPencil} className="w-4" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-red"
                onClick={() => {
                  const folderId = contextMenu.folderId;
                  setContextMenu(null);
                  confirmDeleteFolder(folderId);
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} className="w-4" />
                <span>Delete folder</span>
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

// ── Bulk selection thumbnail ──────────────────────────────────────────────────

function BulkThumb({ item }: { item: GalleryItem }) {
  const [failed, setFailed] = useState(false);
  const placeholderIcon =
    item.mediaClass === "video"
      ? faVideo
      : item.mediaClass === "dimensional"
        ? faCube
        : faImage;
  const showImage = !!item.thumbnail && !failed;
  return (
    <div className="-ml-2 h-8 w-8 flex-shrink-0 overflow-hidden rounded border-2 border-ui-panel bg-black/30 first:ml-0">
      {showImage ? (
        <img
          src={item.thumbnail!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/50">
          <FontAwesomeIcon
            icon={placeholderIcon}
            className="text-xs text-white/50"
          />
        </div>
      )}
    </div>
  );
}

