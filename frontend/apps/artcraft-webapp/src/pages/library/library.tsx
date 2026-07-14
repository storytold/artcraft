import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { EASE_EMPHASIS } from "../../lib/motion";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import {
  UsersApi,
  GalleryModalApi,
  MediaFilesApi,
  FoldersApi,
  FilterMediaClasses,
  FilterMediaType,
} from "@storyteller/api";
import {
  GalleryDraggableItem,
  GalleryFolderChip,
  GalleryDragComponent,
  FolderColorRow,
  FolderNameDialog,
  LazyDateGroup,
  compareFolders,
  promptFolderDrop,
  FOLDER_DROP_EVENT,
  type GalleryItem,
} from "@storyteller/ui-gallery-modal";
import { PLACEHOLDER_IMAGES, is3DModelUrl } from "@storyteller/common";
import { is3DMediaClass } from "@storyteller/ui-generation-list";
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
  faMusic,
  faVideo,
  faPencil,
  faTrashCan,
  faFolderPlus,
  faFolder,
  faFolderOpen,
  faGlobe,
  faPlus,
  faXmark,
  faStar,
  faTag,
  faTags,
  faEllipsis,
} from "@fortawesome/pro-solid-svg-icons";
import { Lightbox } from "../../components/lightbox/lightbox";
import {
  useLibraryFoldersStore,
  useLibrarySelectionStore,
  deleteLibraryMedia,
  type UiFolder,
} from "./library-folders-store";
import { mapRawToGalleryItem } from "./library-media-map";
import {
  compareTagsByUseCount,
  useLibraryTagsStore,
} from "./library-tags-store";

const PAGE_SIZE = 60;

const FILTERS = [
  { id: "all", label: "All", icon: faBorderAll, route: "/library" },
  { id: "image", label: "Images", icon: faImage, route: "/library/images" },
  { id: "video", label: "Videos", icon: faVideo, route: "/library/videos" },
  { id: "audio", label: "Audio", icon: faMusic, route: "/library/audio" },
  { id: "meshes", label: "Meshes", icon: faCube, route: "/library/meshes" },
  { id: "splats", label: "Splats", icon: faGlobe, route: "/library/splats" },
];

// Class scopes for the Unfoldered tab. Local state (not routes): the tab is
// one page and the filter maps to the endpoint's `filter_media_class` param.
const FOLDERLESS_CLASS_FILTERS = [
  { id: "all", label: "All", icon: faBorderAll },
  { id: "image", label: "Images", icon: faImage },
  { id: "video", label: "Videos", icon: faVideo },
  { id: "audio", label: "Audio", icon: faMusic },
  { id: "mesh", label: "Meshes", icon: faCube },
  { id: "splat", label: "Splats", icon: faGlobe },
];

const ROUTE_TO_FILTER: Record<string, string> = {
  images: "image",
  videos: "video",
  audio: "audio",
  meshes: "meshes",
  splats: "splats",
};

// Media classes for the user-list endpoint. The Meshes and Splats tabs don't
// use it — they call the session mesh/splat list endpoints instead.
const getFilterMediaClass = (
  filter: string,
): FilterMediaClasses[] | undefined => {
  switch (filter) {
    case "image":
      return [FilterMediaClasses.IMAGE];
    case "video":
      return [FilterMediaClasses.VIDEO];
    case "audio":
      return [FilterMediaClasses.AUDIO];
    default:
      return [
        FilterMediaClasses.IMAGE,
        FilterMediaClasses.VIDEO,
        FilterMediaClasses.AUDIO,
        FilterMediaClasses.DIMENSIONAL,
        FilterMediaClasses.MESH,
        FilterMediaClasses.SPLAT,
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
  // `:slug` is either a media-class filter (images/videos/meshes), a folder
  // token (prefixed `folder_`), the static `tags` tab, or a tag token
  // (prefixed `tag_`). `/library/folders` (static) has no slug.
  const { slug } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const folderToken = slug?.startsWith("folder_") ? slug : undefined;
  const tagToken = slug?.startsWith("tag_") ? slug : undefined;
  const onTagsRoute = slug === "tags" || !!tagToken;
  const filterParam = slug && !folderToken && !onTagsRoute ? slug : undefined;
  const activeFilter = filterParam
    ? (ROUTE_TO_FILTER[filterParam] ?? "all")
    : "all";
  // Top-level tab derived from the route: All Assets (flat library), Folders,
  // Unfoldered (files in no folder at all), or Tags.
  const onFoldersRoute = pathname === "/library/folders" || !!folderToken;
  const onFolderlessRoute = slug === "folderless";
  const tab: "unsorted" | "folders" | "folderless" | "tags" = onFoldersRoute
    ? "folders"
    : onFolderlessRoute
      ? "folderless"
      : onTagsRoute
        ? "tags"
        : "unsorted";

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

  // Bulk selection lives in `useLibrarySelectionStore` (module store) so each
  // tile subscribes to its own membership and the page itself never re-renders
  // on selection changes. The page reads it via getState() in callbacks only.
  // Clear it when leaving the library area.
  useEffect(() => () => useLibrarySelectionStore.getState().clear(), []);

  const api = useMemo(() => new GalleryModalApi(), []);
  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
  const foldersApi = useMemo(() => new FoldersApi(), []);
  // Keyset cursor for the Meshes / Splats tabs (their endpoints paginate by
  // cursor, not page index).
  const meshSplatCursorRef = useRef<string | undefined>(undefined);

  // ── Unfoldered tab ──
  // Optional media-class scope for the folderless list ("all" = unfiltered).
  const [folderlessClass, setFolderlessClass] = useState<string>("all");
  // Keyset cursor for the folderless endpoint.
  const folderlessCursorRef = useRef<string | undefined>(undefined);
  // Current tab, readable from stable callbacks without re-binding them.
  const tabRef = useRef(tab);
  tabRef.current = tab;

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

  // ── Tags store ────────────────────────────────────────────────────────────
  const tags = useLibraryTagsStore((s) => s.tags);
  const tagsLoaded = useLibraryTagsStore((s) => s.tagsLoaded);
  const activeTagToken = useLibraryTagsStore((s) => s.activeTagToken);
  const tagMediaItems = useLibraryTagsStore((s) => s.tagMediaItems);
  const tagContentLoading = useLibraryTagsStore((s) => s.tagContentLoading);
  const tagLoadingMore = useLibraryTagsStore((s) => s.tagLoadingMore);
  const loadTags = useLibraryTagsStore((s) => s.loadTags);
  const setActiveTag = useLibraryTagsStore((s) => s.setActiveTag);
  const loadTagMedia = useLibraryTagsStore((s) => s.loadTagMedia);
  const renameTagAction = useLibraryTagsStore((s) => s.renameTag);
  const deleteTagAction = useLibraryTagsStore((s) => s.deleteTag);
  const tagRenameTarget = useLibraryTagsStore((s) => s.renameTarget);
  const tagContextMenu = useLibraryTagsStore((s) => s.contextMenu);
  const setTagRenameTarget = useLibraryTagsStore((s) => s.setRenameTarget);
  const setTagContextMenu = useLibraryTagsStore((s) => s.setContextMenu);

  const activeTag = activeTagToken
    ? (tags.find((t) => t.token === activeTagToken) ?? null)
    : null;

  // Sort for the all-tags view; local state, not a route.
  const [tagSort, setTagSort] = useState<"count" | "name">("count");
  const sortedTags = useMemo(
    () =>
      tagSort === "count"
        ? [...tags].sort(compareTagsByUseCount)
        : [...tags].sort((a, b) => a.valueLower.localeCompare(b.valueLower)),
    [tags, tagSort],
  );

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

  // Load the folder tree + tag list once we know who the user is (the tag
  // list also feeds the sidebar nav and the editor's autocomplete).
  useEffect(() => {
    if (username) {
      loadFolders();
      loadTags();
    }
  }, [username, loadFolders, loadTags]);

  // The URL owns *which* folder is open (`/library/:token`); mirror it into the
  // store. Read via getState() + inequality guard so this never loops.
  useEffect(() => {
    const target = folderToken ?? null;
    if (useLibraryFoldersStore.getState().activeFolderId !== target) {
      setActiveFolder(target);
    }
  }, [folderToken, setActiveFolder]);

  // Same for the open tag (`/library/tag_…`).
  useEffect(() => {
    const target = tagToken ?? null;
    if (useLibraryTagsStore.getState().activeTagToken !== target) {
      setActiveTag(target);
    }
  }, [tagToken, setActiveTag]);

  // ── Root media loading (library view, no folder open) ─────────────────────
  const loadItems = useCallback(
    async (reset = false) => {
      if (!username) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);
      try {
        if (tabRef.current === "folderless") {
          // The Unfoldered tab lists files in no folder at all via the
          // dedicated endpoint (server-scoped, cursor-paginated). The server
          // only returns a cursor when the page was full, so its presence
          // doubles as the has-more signal.
          const cursor = reset ? undefined : folderlessCursorRef.current;
          const response = await foldersApi.ListMediaFilesWithoutFolder({
            cursor,
            limit: PAGE_SIZE,
            filterMediaClass:
              folderlessClass === "all" ? undefined : folderlessClass,
          });
          if (response.success && response.data) {
            const newItems = response.data.map(mapRawToGalleryItem);
            setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
            const nextCursor = response.pagination?.maybe_cursor ?? undefined;
            folderlessCursorRef.current = nextCursor;
            setHasMore(!!nextCursor);
          }
          setLoading(false);
          setInitialLoading(false);
          isLoadingRef.current = false;
          return;
        }

        if (activeFilter === "meshes" || activeFilter === "splats") {
          // The Meshes / Splats tabs use the session by-class list endpoints
          // (server-scoped, cursor-paginated) instead of the user list.
          const cursor = reset ? undefined : meshSplatCursorRef.current;
          const response =
            activeFilter === "splats"
              ? await mediaFilesApi.ListSessionSplatMediaFiles({
                  cursor,
                  page_size: PAGE_SIZE,
                })
              : await mediaFilesApi.ListSessionMeshMediaFiles({
                  cursor,
                  page_size: PAGE_SIZE,
                });
          if (response.success && response.data) {
            const newItems = response.data.map(mapRawToGalleryItem);
            setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
            meshSplatCursorRef.current =
              response.pagination?.maybe_next ?? undefined;
            setHasMore(
              newItems.length >= PAGE_SIZE && !!response.pagination?.maybe_next,
            );
          }
        } else {
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
                (item: any) =>
                  item.media_type !== FilterMediaType.SCENE_JSON &&
                  // Drop 3D-model cover screenshots the backend surfaces as
                  // 3D-classed items (mesh/splat, or legacy pre-split
                  // "dimensional") whose asset is actually a .png.
                  !(
                    (item.media_class === "dimensional" ||
                      item.media_class === "mesh" ||
                      item.media_class === "splat") &&
                    !is3DModelUrl(item.media_links?.cdn_url)
                  ),
              )
              .map(mapRawToGalleryItem);
            setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
            const current = response.pagination?.current ?? 0;
            const total = response.pagination?.total_page_count ?? 1;
            setPageIndex(current + 1);
            setHasMore(current + 1 < total);
          }
        }
      } catch {
        // ignore
      }
      setLoading(false);
      setInitialLoading(false);
      isLoadingRef.current = false;
    },
    [
      username,
      activeFilter,
      pageIndex,
      api,
      mediaFilesApi,
      foldersApi,
      folderlessClass,
    ],
  );

  // Initial load + filter / tab change
  useEffect(() => {
    if (!username) return;
    // Folder / tag views load via their own stores.
    if (tab === "folders" || tab === "tags") return;
    setAllItems([]);
    setPageIndex(0);
    meshSplatCursorRef.current = undefined;
    folderlessCursorRef.current = undefined;
    setHasMore(true);
    setInitialLoading(true);
    isLoadingRef.current = false;
    loadItems(true);
  }, [username, activeFilter, tab, folderlessClass]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (activeTagToken) {
        loadTagMedia(activeTagToken, false);
      } else if (activeFolderId) {
        loadFolderMedia(activeFolderId, false);
      } else if (
        (tab === "unsorted" || tab === "folderless") &&
        hasMore &&
        !isLoadingRef.current
      ) {
        loadItems();
      }
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [
    activeFolderId,
    activeTagToken,
    tab,
    hasMore,
    loadItems,
    loadFolderMedia,
    loadTagMedia,
  ]);

  // ── Drag media → folder ───────────────────────────────────────────────────
  const displayItems = activeTagToken
    ? (tagMediaItems[activeTagToken] ?? [])
    : activeFolderId
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
      // On the Unfoldered tab, items that just landed in a folder no longer
      // belong in the list — drop them (and their selection) once the add
      // settles.
      const pruneIfFolderless = () => {
        if (tabRef.current !== "folderless") return;
        const removed = new Set(itemIds);
        setAllItems((prev) => prev.filter((it) => !removed.has(it.id)));
        useLibrarySelectionStore.getState().removeIds(itemIds);
      };
      if (source && source !== targetFolderId) {
        promptFolderDrop({
          count: itemIds.length,
          targetFolderName: folders.find((f) => f.id === targetFolderId)?.name,
          onMove: () =>
            moveMediaToFolder(itemIds, source, targetFolderId, known),
          onAdd: () =>
            addMediaToFolder(itemIds, targetFolderId, known).then(
              pruneIfFolderless,
            ),
        });
      } else {
        void addMediaToFolder(itemIds, targetFolderId, known).then(
          pruneIfFolderless,
        );
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
  // Stable across renders — reads live values at call time (only on drag start).
  const getBulkDragItems = useCallback(
    () =>
      displayItemsRef.current.filter((it) =>
        useLibrarySelectionStore.getState().ids.has(it.id),
      ),
    [],
  );

  // ── Marquee (drag) selection ────────────────────────────────────────────────
  // Dragging from blank background draws a selection rectangle; tiles it covers
  // are added to the bulk selection (additive to whatever was selected on start).
  // Perf-sensitive: the rectangle is positioned imperatively (no React state per
  // frame), tile rects are cached at drag start, and selection state only commits
  // when the covered set actually changes.
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeRaf = useRef(0);

  const handleMarqueePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || lightboxOpen) return;
      const target = e.target as HTMLElement;
      // Start only on blank background — never from tiles, folder cards,
      // controls, or opted-out chrome (header / bulk bar).
      if (
        target.closest(
          "[data-media-id], [data-folder-id], button, a, input, [data-no-marquee]",
        )
      ) {
        return;
      }
      // Blank-background press: suppress the browser's native text-selection /
      // focus default so it can't hijack the marquee drag (the cause of the
      // drag "dying" once the viewport fills with content after scrolling).
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      // No marquee on touch — a finger drag should scroll. A still tap on
      // blank space still clears the selection below.
      const isTouch = e.pointerType !== "mouse";
      const base = new Set(useLibrarySelectionStore.getState().ids);
      let applied = base;
      let active = false;

      // Edge auto-scroll runs the list under a held cursor, so tile rects move
      // on screen — read them in viewport space and re-cache on every scroll.
      const scroller = getScrollParent(rootRef.current);
      const readScrollTop = () =>
        scroller ? scroller.scrollTop : window.scrollY;
      const readScrollLeft = () =>
        scroller ? scroller.scrollLeft : window.scrollX;
      // The anchor is pinned in content space; scrolling shifts it on screen,
      // so compensate by the scroll delta since the drag began.
      const startScrollTop = readScrollTop();
      const startScrollLeft = readScrollLeft();
      let lastCx = startX;
      let lastCy = startY;
      let edgeRaf = 0;

      let tiles: {
        id: string;
        left: number;
        top: number;
        right: number;
        bottom: number;
      }[] = [];
      const cacheTiles = () => {
        tiles = [];
        rootRef.current
          ?.querySelectorAll<HTMLElement>("[data-media-id]")
          .forEach((el) => {
            const id = el.dataset.mediaId;
            if (!id) return;
            const r = el.getBoundingClientRect();
            tiles.push({
              id,
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            });
          });
      };
      if (!isTouch) cacheTiles();

      const applyMarquee = (cx: number, cy: number) => {
        // Compensate the anchor for scrolling since drag start so the rectangle
        // keeps growing in content space, not viewport space.
        const ax = startX - (readScrollLeft() - startScrollLeft);
        const ay = startY - (readScrollTop() - startScrollTop);
        const left = Math.min(ax, cx);
        const top = Math.min(ay, cy);
        const width = Math.abs(cx - ax);
        const height = Math.abs(cy - ay);
        const right = left + width;
        const bottom = top + height;
        const box = marqueeRef.current;
        if (box) {
          // Clamp the *visible* rectangle to the scroll viewport so it never
          // paints over the top bar / breadcrumb chrome above the gallery.
          // Selection math below still uses the unclamped rect, so tiles
          // scrolled above the fold stay selected.
          const vr = scroller?.getBoundingClientRect();
          const vTop = vr ? vr.top : 0;
          const vBottom = vr ? vr.bottom : window.innerHeight;
          const dispTop = Math.max(top, vTop);
          const dispBottom = Math.min(bottom, vBottom);
          box.style.display = "block";
          box.style.left = `${left}px`;
          box.style.top = `${dispTop}px`;
          box.style.width = `${width}px`;
          box.style.height = `${Math.max(0, dispBottom - dispTop)}px`;
        }
        const mounted = new Set(tiles.map((t) => t.id));
        const next = new Set(base);
        // Tiles swept over earlier may have unmounted (virtualized list) once
        // scrolled far away — keep them selected since we can't re-test them.
        for (const id of applied) {
          if (!base.has(id) && !mounted.has(id)) next.add(id);
        }
        for (const t of tiles) {
          if (
            t.left < right &&
            t.right > left &&
            t.top < bottom &&
            t.bottom > top
          ) {
            next.add(t.id);
          }
        }
        // Commit only when coverage changed — most frames it hasn't.
        let changed = next.size !== applied.size;
        if (!changed) {
          for (const id of next) {
            if (!applied.has(id)) {
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          applied = next;
          useLibrarySelectionStore.getState().setIds(next);
        }
      };

      // Auto-scroll while the cursor sits within EDGE px of the viewport's top
      // or bottom; speed ramps up nearer the edge. Self-perpetuating via rAF
      // until the cursor leaves the zone or the drag ends.
      const EDGE = 64;
      const MAX_SPEED = 24;
      const edgeBounds = () => {
        if (scroller) {
          const r = scroller.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }
        return { top: 0, bottom: window.innerHeight };
      };
      const autoScrollTick = () => {
        edgeRaf = 0;
        if (!active || isTouch) return;
        const { top, bottom } = edgeBounds();
        let dy = 0;
        if (lastCy < top + EDGE) {
          dy = -Math.min(MAX_SPEED, Math.ceil((top + EDGE - lastCy) / 3));
        } else if (lastCy > bottom - EDGE) {
          dy = Math.min(MAX_SPEED, Math.ceil((lastCy - (bottom - EDGE)) / 3));
        }
        if (dy === 0) return;
        if (scroller) scroller.scrollTop += dy;
        else window.scrollBy(0, dy);
        cacheTiles();
        applyMarquee(lastCx, lastCy);
        edgeRaf = requestAnimationFrame(autoScrollTick);
      };
      const ensureAutoScroll = () => {
        if (!edgeRaf) edgeRaf = requestAnimationFrame(autoScrollTick);
      };

      const handleMove = (ev: PointerEvent) => {
        if (isTouch) {
          // Track movement only so a scroll gesture doesn't count as a
          // "blank tap" (which would clear the selection on pointerup).
          if (
            Math.abs(ev.clientX - startX) > 10 ||
            Math.abs(ev.clientY - startY) > 10
          ) {
            active = true;
          }
          return;
        }
        if (!active) {
          // Small threshold so plain background clicks don't flash a marquee.
          if (
            Math.abs(ev.clientX - startX) < 5 &&
            Math.abs(ev.clientY - startY) < 5
          ) {
            return;
          }
          active = true;
          document.body.style.userSelect = "none";
        }
        lastCx = ev.clientX;
        lastCy = ev.clientY;
        ensureAutoScroll();
        cancelAnimationFrame(marqueeRaf.current);
        marqueeRaf.current = requestAnimationFrame(() =>
          applyMarquee(ev.clientX, ev.clientY),
        );
      };
      const handleScroll = () => {
        if (active && !isTouch) {
          cacheTiles();
          applyMarquee(lastCx, lastCy);
        }
      };
      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("scroll", handleScroll, true);
        cancelAnimationFrame(marqueeRaf.current);
        cancelAnimationFrame(edgeRaf);
        document.body.style.userSelect = "";
        if (marqueeRef.current) marqueeRef.current.style.display = "none";
        // Plain click on blank background (no marquee drawn) clears the
        // selection, like clicking the desktop on an OS.
        if (!active) {
          useLibrarySelectionStore.getState().clear();
        }
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("scroll", handleScroll, true);
    },
    [lightboxOpen],
  );

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(useLibrarySelectionStore.getState().ids);
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
          useLibrarySelectionStore.getState().clear();
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  }, []);

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
    useLibrarySelectionStore.getState().removeIds([id]);
    // Also drop it from any cached folder/tag views (e.g. deleted via the lightbox).
    useLibraryFoldersStore.setState((s) => {
      const next: Record<string, GalleryItem[]> = {};
      for (const [k, items] of Object.entries(s.folderMediaItems)) {
        next[k] = items.filter((it) => it.id !== id);
      }
      return { folderMediaItems: next };
    });
    useLibraryTagsStore.setState((s) => {
      const next: Record<string, GalleryItem[]> = {};
      for (const [k, items] of Object.entries(s.tagMediaItems)) {
        next[k] = items.filter((it) => it.id !== id);
      }
      return { tagMediaItems: next };
    });
  }, []);

  const handleCardClick = useCallback((item: GalleryItem) => {
    const selection = useLibrarySelectionStore.getState();
    if (selection.ids.size > 0) {
      selection.toggle(item.id);
      return;
    }
    setLightboxItem(item);
    setLightboxOpen(true);
  }, []);

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
    meshSplatCursorRef.current = undefined;
    folderlessCursorRef.current = undefined;
    setHasMore(true);
    setInitialLoading(true);
    isLoadingRef.current = false;
    loadItems(true);
  }, [loadItems]);

  // ── Folder dialog handlers ────────────────────────────────────────────────
  const submitNewFolder = async (name: string) => {
    // Capture before closing — `closeNewFolderModal` resets these fields.
    const { parentId, addItemIds } = newFolderModal;
    closeNewFolderModal();
    const folder = await createFolder(name, parentId);
    if (folder && addItemIds.length > 0) {
      // The selection can span the root library and folder caches, so resolve
      // known items from both (incomplete `known` only weakens the optimistic
      // preview — the server add still uses the ids and reconciles on open).
      const fmi = useLibraryFoldersStore.getState().folderMediaItems;
      const known = [...allItems, ...Object.values(fmi).flat()];
      addMediaToFolder(addItemIds, folder.id, known);
      useLibrarySelectionStore.getState().clear();
    }
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

  // ── Tag dialog handlers ───────────────────────────────────────────────────
  const submitTagRename = (name: string) => {
    if (tagRenameTarget) renameTagAction(tagRenameTarget, name);
    setTagRenameTarget(null);
  };

  const confirmDeleteTag = (tagTokenToDelete: string) => {
    const tag = tags.find((t) => t.token === tagTokenToDelete);
    const count = tag?.useCount ?? 0;
    showActionReminder({
      reminderType: "default",
      title: `Delete tag "${tag?.value ?? "tag"}"?`,
      message: (
        <p className="text-sm text-white/70">
          Removes this tag from {count} file{count === 1 ? "" : "s"}. Files stay
          in your library.
        </p>
      ),
      primaryActionText: "Delete",
      secondaryActionText: "Cancel",
      primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
      onPrimaryAction: async () => {
        try {
          await deleteTagAction(tagTokenToDelete);
          if (tagToken === tagTokenToDelete) navigate("/library/tags");
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

  // Shared date-grouped media grid (source items differ per mode via
  // displayItems). Each date group is virtualized: groups outside the
  // viewport (+800px) unmount behind a measured-height placeholder, keeping
  // scrolling smooth for large libraries (same component the desktop modal uses).
  const mediaGrid = (
    <>
      {groupedItems.map(([date, dateItems], groupIndex) => (
        <LazyDateGroup
          key={date}
          eager={groupIndex < 2}
          itemCount={dateItems.length}
          gridColumns={4}
          scrollRoot={null}
        >
          <h3 className="text-sm font-medium text-white/50 mb-2">{date}</h3>
          <div className={GRID_CLASS}>
            {dateItems.map((item) => (
              <LibraryTile
                key={item.id}
                item={item}
                activeFilter={activeFilter}
                activeFolderId={activeFolderId}
                folders={folders}
                onCardClick={handleCardClick}
                onImageError={handleImageError}
                onDeleted={handleItemDeleted}
                onAddToFolder={requestFolderDrop}
                onNewFolder={openNewFolderModal}
                onRemoveFromFolder={removeMediaFromFolder}
                getBulkDragItems={getBulkDragItems}
              />
            ))}
          </div>
        </LazyDateGroup>
      ))}
    </>
  );

  return (
    <div
      ref={rootRef}
      // `shrink-0` is critical: the scroll parent (`SidebarInset`) is a flex
      // column, so without it the flex algorithm shrinks this box down to one
      // viewport while the tall grid overflows below it — leaving the lower
      // page outside this element, so the marquee handler (and its padding
      // gutters) never receive pointer events there. `min-h-full` then only
      // fills the background when content is shorter than the viewport.
      // `select-none` blocks the blue text/image highlight when sweeping a
      // marquee or fat-fingering a click; native selection would otherwise also
      // hijack the drag. Form fields opt back in so dialog inputs stay editable.
      className="relative min-h-full w-full shrink-0 select-none [&_input]:select-text [&_textarea]:select-text bg-[#101014] pb-8 px-3 sm:px-4 md:px-8 lg:px-12"
      onPointerDown={handleMarqueePointerDown}
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Header — sticky below navbar */}
        <div
          data-no-marquee
          className="sticky top-0 z-50 -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 px-3 sm:px-4 md:px-8 lg:px-12 pb-3 pt-3 bg-[#101014] mb-4 sm:mb-6"
        >
          <div className="flex flex-col gap-6">
            {/* Tabs + actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-ui-controls/40 rounded-xl p-1">
                  <Link
                    to="/library"
                    className={`relative flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "unsorted"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab === "unsorted" && (
                      <motion.span
                        layoutId="library-tab-indicator"
                        className="absolute inset-0 rounded-md bg-ui-controls"
                        transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={faBorderAll}
                      className="relative z-10 text-xs"
                    />
                    <span className="relative z-10">All Assets</span>
                  </Link>
                  <Link
                    to="/library/folders"
                    className={`relative flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "folders"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab === "folders" && (
                      <motion.span
                        layoutId="library-tab-indicator"
                        className="absolute inset-0 rounded-md bg-ui-controls"
                        transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={faFolder}
                      className="relative z-10 text-xs"
                    />
                    <span className="relative z-10">Folders</span>
                  </Link>
                  <Link
                    to="/library/folderless"
                    className={`relative flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "folderless"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab === "folderless" && (
                      <motion.span
                        layoutId="library-tab-indicator"
                        className="absolute inset-0 rounded-md bg-ui-controls"
                        transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={faFolderOpen}
                      className="relative z-10 text-xs"
                    />
                    <span className="relative z-10">Unfoldered</span>
                  </Link>
                  <Link
                    to="/library/tags"
                    className={`relative flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      tab === "tags"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab === "tags" && (
                      <motion.span
                        layoutId="library-tab-indicator"
                        className="absolute inset-0 rounded-md bg-ui-controls"
                        transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                      />
                    )}
                    <FontAwesomeIcon
                      icon={faTag}
                      className="relative z-10 text-xs"
                    />
                    <span className="relative z-10">Tags</span>
                  </Link>
                </div>
                {(tab === "unsorted" || tab === "folderless") && (
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
                {tab === "folderless" && (
                  <div className="flex items-center gap-1 bg-ui-controls/40 rounded-xl p-1 overflow-x-auto">
                    {FOLDERLESS_CLASS_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setFolderlessClass(filter.id)}
                        className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          folderlessClass === filter.id
                            ? "text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {folderlessClass === filter.id && (
                          <motion.span
                            layoutId="library-folderless-filter-indicator"
                            className="absolute inset-0 rounded-md bg-ui-controls"
                            transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                          />
                        )}
                        <FontAwesomeIcon
                          icon={filter.icon}
                          className="relative z-10 text-xs"
                        />
                        <span className="relative z-10 hidden sm:inline">
                          {filter.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === "unsorted" && (
                  <div className="flex items-center gap-1 bg-ui-controls/40 rounded-xl p-1 overflow-x-auto">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => navigate(filter.route)}
                        className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          activeFilter === filter.id
                            ? "text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {activeFilter === filter.id && (
                          <motion.span
                            layoutId="library-filter-indicator"
                            className="absolute inset-0 rounded-md bg-ui-controls"
                            transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                          />
                        )}
                        <FontAwesomeIcon
                          icon={filter.icon}
                          className="relative z-10 text-xs"
                        />
                        <span className="relative z-10 hidden sm:inline">
                          {filter.label}
                        </span>
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
                {tab === "tags" && !activeTagToken && tags.length > 0 && (
                  <div className="flex items-center gap-1 bg-ui-controls/40 rounded-xl p-1">
                    {(
                      [
                        ["count", "Most used"],
                        ["name", "Name"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setTagSort(id)}
                        className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          tagSort === id
                            ? "text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {tagSort === id && (
                          <motion.span
                            layoutId="library-tag-sort-indicator"
                            className="absolute inset-0 rounded-md bg-ui-controls"
                            transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
                          />
                        )}
                        <span className="relative z-10">{label}</span>
                      </button>
                    ))}
                  </div>
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

            {/* Breadcrumb (inside a tag) */}
            {tab === "tags" && activeTagToken && (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <button
                  onClick={() => navigate("/library/tags")}
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  Tags
                </button>
                <span className="text-white/30">/</span>
                <h1 className="text-lg sm:text-xl font-medium text-white truncate max-w-[16rem]">
                  {activeTag?.value ?? "Tag"}
                </h1>
                {activeTag && (
                  <span className="text-white/40 text-sm pt-1 ps-1.5">
                    {activeTag.useCount} file
                    {activeTag.useCount === 1 ? "" : "s"}
                  </span>
                )}
                <button
                  onClick={() => setTagRenameTarget(activeTagToken)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-ui-controls/40 transition-colors"
                  title="Rename tag"
                >
                  <FontAwesomeIcon icon={faPencil} className="text-xs" />
                </button>
                <button
                  onClick={() => confirmDeleteTag(activeTagToken)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-red hover:bg-ui-controls/40 transition-colors"
                  title="Delete tag"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
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
          ) : tab === "tags" && !activeTagToken ? (
            /* ── Tags tab: all tags ── */
            !tagsLoaded ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner className="h-8 w-8 text-white/60" />
              </div>
            ) : tags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ui-controls/30">
                  <FontAwesomeIcon
                    icon={faTags}
                    className="text-2xl text-white/40"
                  />
                </div>
                <p className="text-white/40 text-sm">No tags yet.</p>
                <p className="text-white/30 text-xs max-w-xs text-center">
                  Open any image or video and add tags in the details panel —
                  they'll show up here.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedTags.map((t) => (
                  <div
                    key={t.token}
                    className="flex items-center rounded-full bg-ui-controls/40 hover:bg-ui-controls/70 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/library/${t.token}`)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setTagContextMenu({
                          tagToken: t.token,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="flex items-center gap-2 pl-4 pr-1 py-2 text-sm font-medium text-white"
                    >
                      <FontAwesomeIcon
                        icon={faTag}
                        className="text-xs text-violet-400"
                      />
                      <span className="max-w-[14rem] truncate">{t.value}</span>
                      <span className="text-xs text-white/40">
                        {t.useCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTagContextMenu({
                          tagToken: t.token,
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
                      }}
                      aria-label={`Options for tag "${t.value}"`}
                      title="Rename or delete"
                      className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faEllipsis} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : tab === "tags" && activeTagToken ? (
            /* ── Inside a tag ── */
            tagContentLoading && displayItems.length === 0 ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner className="h-8 w-8 text-white/60" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-white/40 text-sm">
                  No files carry this tag.
                </p>
              </div>
            ) : (
              <>
                {mediaGrid}
                {tagLoadingMore && (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner className="h-8 w-8 text-white/60" />
                  </div>
                )}
              </>
            )
          ) : /* ── Unsorted ── */ initialLoading && allItems.length === 0 ? (
            <div>
              <div
                className="h-4 w-24 rounded mb-3"
                style={{
                  background:
                    "linear-gradient(100deg, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 70%)",
                  backgroundSize: "200% 100%",
                  animation: "lib-shimmer 1.6s ease-in-out infinite",
                }}
              />
              <div className={GRID_CLASS}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(100deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 70%)",
                        backgroundSize: "200% 100%",
                        animation: `lib-shimmer 1.6s ease-in-out ${i * 0.08}s infinite`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <style>{`@keyframes lib-shimmer {0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : rootEmpty ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-white/40 text-sm mb-4">
                {tab === "folderless"
                  ? folderlessClass === "all"
                    ? "Everything is in a folder — nothing to organize."
                    : "No unfoldered files of this type."
                  : "No items yet."}
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

        {/* Marquee selection rectangle — always mounted, positioned imperatively
            during the drag so sweeping doesn't re-render the page */}
        <div
          ref={marqueeRef}
          style={{ display: "none" }}
          className="pointer-events-none fixed z-40 rounded-sm border border-primary/60 bg-primary/10"
        />

        {/* Bulk selection bar — subscribes to the selection store itself so
            the page doesn't re-render as the selection changes */}
        <BulkSelectionBar
          allItems={allItems}
          folders={folders}
          activeFolderId={activeFolderId}
          onAddToFolder={requestFolderDrop}
          onDeleteSelected={handleBulkDelete}
          onNewFolder={openNewFolderModal}
        />
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

      {/* Rename tag dialog */}
      <FolderNameDialog
        isOpen={!!tagRenameTarget}
        title="Rename tag"
        initialValue={
          tags.find((t) => t.token === tagRenameTarget)?.value ?? ""
        }
        confirmLabel="Rename"
        onConfirm={submitTagRename}
        onClose={() => setTagRenameTarget(null)}
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

      {/* Tag context menu (portaled) */}
      {tagContextMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setTagContextMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setTagContextMenu(null);
              }}
            />
            <div
              className="fixed z-[9999] min-w-44 rounded-lg border border-ui-panel-border bg-ui-panel p-1 shadow-xl"
              style={{ left: tagContextMenu.x, top: tagContextMenu.y }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-base-fg"
                onClick={() => setTagRenameTarget(tagContextMenu.tagToken)}
              >
                <FontAwesomeIcon icon={faPencil} className="w-4" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-ui-controls/60 text-sm text-red"
                onClick={() => {
                  const token = tagContextMenu.tagToken;
                  setTagContextMenu(null);
                  confirmDeleteTag(token);
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} className="w-4" />
                <span>Delete tag</span>
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

// ── Memoized gallery tile ─────────────────────────────────────────────────────
// Keeps the per-item closures out of the page render, and subscribes to its OWN
// slice of the selection store: a marquee/selection commit re-renders only the
// tiles whose checked state flipped — the page itself doesn't render at all.

interface LibraryTileProps {
  item: GalleryItem;
  activeFilter: string;
  activeFolderId: string | null;
  folders: UiFolder[];
  onCardClick: (item: GalleryItem) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onDeleted: (id: string) => void;
  onAddToFolder: (itemIds: string[], folderId: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onRemoveFromFolder: (itemIds: string[], folderId: string) => void;
  getBulkDragItems: () => GalleryItem[];
}

const LibraryTile = memo(function LibraryTile({
  item,
  activeFilter,
  activeFolderId,
  folders,
  onCardClick,
  onImageError,
  onDeleted,
  onAddToFolder,
  onNewFolder,
  onRemoveFromFolder,
  getBulkDragItems,
}: LibraryTileProps) {
  const bulkSelected = useLibrarySelectionStore((s) => s.ids.has(item.id));
  const bulkSelectionMode = useLibrarySelectionStore((s) => s.ids.size > 0);
  return (
    <GalleryDraggableItem
      item={item}
      mode="view"
      activeFilter={activeFilter}
      selected={false}
      onClick={() => onCardClick(item)}
      onImageError={onImageError}
      imageFit="cover"
      onDeleted={onDeleted}
      onDelete={deleteLibraryMedia}
      folders={folders}
      onAddToFolder={onAddToFolder}
      onCreateFolderFromMenu={() => onNewFolder(activeFolderId)}
      onRemoveFromFolder={
        activeFolderId
          ? (ids) => onRemoveFromFolder(ids, activeFolderId)
          : undefined
      }
      bulkSelected={bulkSelected}
      bulkSelectionMode={bulkSelectionMode}
      onBulkSelectToggle={() =>
        useLibrarySelectionStore.getState().toggle(item.id)
      }
      getBulkDragItems={getBulkDragItems}
    />
  );
});

// ── Bulk selection bar ────────────────────────────────────────────────────────
// Owns its own subscription to the selection store (and the folder popover
// state), so selection changes re-render only this small bar, never the page.

interface BulkSelectionBarProps {
  allItems: GalleryItem[];
  folders: UiFolder[];
  activeFolderId: string | null;
  onAddToFolder: (itemIds: string[], folderId: string) => void;
  onDeleteSelected: () => void;
  onNewFolder: (parentId: string | null, addItemIds?: string[]) => void;
}

function BulkSelectionBar({
  allItems,
  folders,
  activeFolderId,
  onAddToFolder,
  onDeleteSelected,
  onNewFolder,
}: BulkSelectionBarProps) {
  const ids = useLibrarySelectionStore((s) => s.ids);
  const folderMediaItems = useLibraryFoldersStore((s) => s.folderMediaItems);
  const tagMediaItems = useLibraryTagsStore((s) => s.tagMediaItems);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Same ordering as the sidebar / folder cards: starred first, then
  // alphabetical (the store list arrives in API order).
  const sortedFolders = useMemo(
    () => [...folders].sort(compareFolders),
    [folders],
  );

  // Close the popover when navigating so it doesn't dangle over the new view.
  useEffect(() => {
    setPopoverOpen(false);
  }, [activeFolderId]);

  // Resolve selected items from everything loaded (root library + folder/tag
  // caches) — the selection survives navigation, so selected items may not be
  // part of the currently displayed view.
  const selectedItems = useMemo(() => {
    const byId = new Map(allItems.map((it) => [it.id, it] as const));
    for (const arr of [
      ...Object.values(folderMediaItems),
      ...Object.values(tagMediaItems),
    ]) {
      for (const it of arr) {
        if (!byId.has(it.id)) byId.set(it.id, it);
      }
    }
    return Array.from(ids)
      .map((id) => byId.get(id))
      .filter((it): it is GalleryItem => !!it);
  }, [allItems, folderMediaItems, tagMediaItems, ids]);

  if (ids.size === 0) return null;
  const clear = () => useLibrarySelectionStore.getState().clear();

  return (
    <div
      data-no-marquee
      className="fixed bottom-20 sm:bottom-4 z-30 flex w-fit -translate-x-1/2 items-center gap-2 rounded-full border border-ui-panel-border bg-ui-panel/95 px-2.5 py-2 shadow-xl backdrop-blur"
      style={{
        // Center within the content area (viewport minus the app sidebar).
        left: "calc(50% + var(--ac-sidebar-offset, 0px) / 2)",
      }}
    >
      <div className="hidden sm:flex pl-1">
        {selectedItems.slice(0, 4).map((si) => (
          <BulkThumb key={si.id} item={si} />
        ))}
        {selectedItems.length > 4 && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border-2 border-ui-panel bg-black/20">
            <span className="text-[11px] text-white/70">
              +{selectedItems.length - 4}
            </span>
          </div>
        )}
      </div>
      <span className="px-1 text-sm font-medium text-white/80">
        {ids.size} selected
      </span>

      {/* Add to folder */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-ui-controls/90 transition-colors"
        >
          <FontAwesomeIcon icon={faFolderPlus} className="text-xs" />
          Add to folder
        </button>
        {popoverOpen && (
          <>
            <div
              className="fixed inset-0 z-[59]"
              onClick={() => setPopoverOpen(false)}
            />
            <div className="absolute bottom-full right-0 z-[60] mb-2 max-h-72 w-56 overflow-y-auto rounded-lg border border-ui-panel-border bg-ui-panel p-2 shadow-xl">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Folders
              </div>
              {sortedFolders.length === 0 ? (
                <div className="px-2 py-1.5 text-xs italic text-white/30">
                  No folders yet
                </div>
              ) : (
                sortedFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      onAddToFolder(Array.from(ids), folder.id);
                      setPopoverOpen(false);
                      clear();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-white hover:bg-ui-controls/50 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faFolder}
                      className={
                        folder.colorCode ? "text-xs" : "text-xs text-primary"
                      }
                      style={
                        folder.colorCode
                          ? { color: folder.colorCode }
                          : undefined
                      }
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))
              )}
              <div className="mx-1.5 my-1 border-t border-ui-panel-border" />
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  onNewFolder(activeFolderId, Array.from(ids));
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
        onClick={onDeleteSelected}
        className="flex items-center gap-2 rounded-full bg-red/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red transition-colors"
      >
        <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
        Delete
      </button>
      <button
        type="button"
        onClick={clear}
        aria-label="Clear selection"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-ui-controls/60 text-white hover:bg-ui-controls/90 transition-colors"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

// ── Bulk selection thumbnail ──────────────────────────────────────────────────

function BulkThumb({ item }: { item: GalleryItem }) {
  const [failed, setFailed] = useState(false);
  const placeholderIcon =
    item.mediaClass === "video"
      ? faVideo
      : is3DMediaClass(item.mediaClass)
        ? faCube
        : item.mediaClass === "audio"
          ? faMusic
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
