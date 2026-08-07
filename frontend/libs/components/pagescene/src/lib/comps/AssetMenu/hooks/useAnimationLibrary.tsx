import { useCallback, useContext, useMemo } from "react";
import { create } from "zustand";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import type { PageSceneAdapter } from "../../../adapter";
import {
  FetchStatus,
  FilterEngineCategories,
  FilterMediaType,
} from "../../../enums";
import {
  fetchFeaturedMediaItems,
  fetchUserMediaItems,
} from "../utilities/fetchMediaItems";
import { demoAnimationItems } from "../../../signals/demoAssets";
import type { MediaItem } from "../../../models/assets";
import type { Pagination } from "../../../models/pagination";

// Skeletal animation clips for the library UIs (the AssetModal Animations
// section and the standalone AnimationsModal). GLB/GLTF only — the timeline's
// clip loader (Scene.loadRawGlb) can't consume other formats (e.g. vmd).
//
// The state lives in ONE module-level store: both modals are mounted at the
// same time, and per-hook state meant two featured fetches on every pagescene
// load, two error toasts on a backend failure, and user-animation lists that
// could disagree between the modals. Fetching is also LAZY — nothing fires on
// mount; fetchUserAnimations (which both modals call on open and after an
// upload) refreshes the user list every time and triggers the featured fetch
// until it has succeeded once.
//
// The user's own uploads lead, then the server-curated set; the hardcoded
// demo clips are only the fallback while the API has no featured animations
// (deliberately replace, not merge). The user fetch is silent since anonymous
// users legitimately 401.
interface AnimationLibraryState {
  featuredAnimations?: MediaItem[];
  featuredFetchStatus: FetchStatus;
  userAnimations?: MediaItem[];
  userFetchStatus: FetchStatus;
  // Page-based pagination of the LAST user fetch (0-based `current` of
  // `total_page_count`) — drives load-more for libraries past page one.
  userNextPage?: Pagination;
}

const useAnimationLibraryStore = create<AnimationLibraryState>(() => ({
  featuredAnimations: undefined,
  featuredFetchStatus: FetchStatus.READY,
  userAnimations: undefined,
  userFetchStatus: FetchStatus.READY,
  userNextPage: undefined,
}));

const hasMorePages = (page: Pagination | undefined): boolean =>
  !!page && page.current + 1 < page.total_page_count;

const dedupeById = (items: MediaItem[]): MediaItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.media_id)) return false;
    seen.add(item.media_id);
    return true;
  });
};

const ANIMATION_FILTERS = {
  filterEngineCategories: [FilterEngineCategories.ANIMATION],
  filterMediaType: [FilterMediaType.GLB, FilterMediaType.GLTF],
};

// Featured animations rarely change: fetched once per session, retried on a
// later open only after a failure. One pipeline = one toast per attempt.
let featuredSucceeded = false;

const fetchFeaturedAnimations = async (
  adapter: PageSceneAdapter,
): Promise<void> => {
  const store = useAnimationLibraryStore;
  if (featuredSucceeded) return;
  if (store.getState().featuredFetchStatus === FetchStatus.IN_PROGRESS) return;
  store.setState({ featuredFetchStatus: FetchStatus.IN_PROGRESS });
  const result = await fetchFeaturedMediaItems(
    {
      ...ANIMATION_FILTERS,
      defaultErrorMessage: "Error fetching featured animations",
    },
    adapter,
  );
  if (result.status === FetchStatus.SUCCESS) featuredSucceeded = true;
  store.setState({
    featuredFetchStatus: result.status,
    ...(result.mediaItems ? { featuredAnimations: result.mediaItems } : {}),
  });
};

const fetchUserAnimationsShared = async (
  adapter: PageSceneAdapter,
  pageIndex = 0,
): Promise<void> => {
  const store = useAnimationLibraryStore;
  if (store.getState().userFetchStatus === FetchStatus.IN_PROGRESS) return;
  store.setState({ userFetchStatus: FetchStatus.IN_PROGRESS });
  const result = await fetchUserMediaItems(
    {
      ...ANIMATION_FILTERS,
      defaultErrorMessage: "Error fetching your animations",
      suppressErrorToast: true,
      nextPageIndex: pageIndex,
    },
    adapter,
  );
  store.setState((prev) => ({
    userFetchStatus: result.status,
    ...(result.mediaItems
      ? {
          // Page 0 = refresh (replace); later pages append, deduped by
          // media id in case a refresh raced a load-more.
          userAnimations:
            pageIndex > 0
              ? dedupeById([
                  ...(prev.userAnimations ?? []),
                  ...result.mediaItems,
                ])
              : result.mediaItems,
          userNextPage: result.nextPage,
        }
      : {}),
  }));
};

const loadMoreUserAnimationsShared = (adapter: PageSceneAdapter): void => {
  const { userFetchStatus, userNextPage } = useAnimationLibraryStore.getState();
  if (userFetchStatus === FetchStatus.IN_PROGRESS) return;
  if (!hasMorePages(userNextPage)) return;
  void fetchUserAnimationsShared(adapter, userNextPage!.current + 1);
};

export const useAnimationLibrary = (): {
  userAnimations: MediaItem[];
  defaultAnimations: MediaItem[];
  allAnimations: MediaItem[];
  fetchUserAnimations: () => void;
  // Scroll-driven pagination of the user's uploads (the featured list stays
  // a single page; user libraries are the unbounded ones).
  loadMoreUserAnimations: () => void;
  hasMoreUserAnimations: boolean;
  fetchStatuses: FetchStatus[];
} => {
  const editor = useContext(EngineContext);
  const {
    featuredAnimations,
    featuredFetchStatus,
    userAnimations,
    userFetchStatus,
    userNextPage,
  } = useAnimationLibraryStore();

  const fetchUserAnimations = useCallback(() => {
    const adapter = editor?.adapter;
    if (!adapter) return;
    void fetchFeaturedAnimations(adapter);
    void fetchUserAnimationsShared(adapter);
  }, [editor]);

  const loadMoreUserAnimations = useCallback(() => {
    const adapter = editor?.adapter;
    if (!adapter) return;
    loadMoreUserAnimationsShared(adapter);
  }, [editor]);

  const defaultAnimations = useMemo(
    () =>
      featuredAnimations?.length ? featuredAnimations : demoAnimationItems,
    [featuredAnimations],
  );

  const allAnimations = useMemo(
    () => [...(userAnimations ?? []), ...defaultAnimations],
    [userAnimations, defaultAnimations],
  );

  return {
    userAnimations: userAnimations ?? [],
    defaultAnimations,
    allAnimations,
    fetchUserAnimations,
    loadMoreUserAnimations,
    hasMoreUserAnimations: hasMorePages(userNextPage),
    fetchStatuses: [featuredFetchStatus, userFetchStatus],
  };
};
