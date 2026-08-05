import { useMemo } from "react";
import { useFeaturedObjects } from "./useFeaturedObjects";
import { useUserObjects } from "./useUserObjects";
import { FilterEngineCategories, FilterMediaType } from "../../../enums";
import type { FetchStatus } from "../../../enums";
import { demoAnimationItems } from "../../../signals/demoAssets";
import type { MediaItem } from "../../../models/assets";

// Skeletal animation clips for the library UIs (the AssetModal Animations tab
// and the standalone AnimationsModal). GLB/GLTF only — the timeline's clip
// loader (Scene.loadRawGlb) can't consume other formats (e.g. vmd).
//
// The user's own uploads lead, then the server-curated set; the hardcoded
// demo clips are only the fallback while the API has no featured animations
// (deliberately replace, not merge). The user fetch is silent since anonymous
// users legitimately 401, and it does NOT auto-fire — callers invoke
// fetchUserAnimations on modal open (and after uploads) to pick up new items.
export const useAnimationLibrary = (): {
  userAnimations: MediaItem[];
  defaultAnimations: MediaItem[];
  allAnimations: MediaItem[];
  fetchUserAnimations: () => void;
  fetchStatuses: FetchStatus[];
} => {
  const {
    featuredObjects: featuredAnimations,
    featuredFetchStatus: featuredAnimationsFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.ANIMATION],
    filterMediaTypes: [FilterMediaType.GLB, FilterMediaType.GLTF],
    defaultErrorMessage: "Error fetching featured animations",
  });

  const {
    userObjects: userAnimations,
    userFetchStatus: userAnimationsFetchStatus,
    fetchUserObjects: fetchUserAnimations,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.ANIMATION],
    filterMediaTypes: [FilterMediaType.GLB, FilterMediaType.GLTF],
    defaultErrorMessage: "Error fetching your animations",
    suppressErrorToast: true,
  });

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
    fetchStatuses: [featuredAnimationsFetchStatus, userAnimationsFetchStatus],
  };
};
