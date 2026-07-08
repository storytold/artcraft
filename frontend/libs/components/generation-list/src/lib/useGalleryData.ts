import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GalleryModalApi,
  FilterMediaClasses,
  FilterMediaType,
} from "@storyteller/api";
import { getMediaThumbnail, THUMBNAIL_SIZES } from "@storyteller/common";
import type { GalleryItem } from "./types";

const PAGE_SIZE = 40;

const getLabel = (item: any) => {
  if (item.maybe_title) return item.maybe_title;
  switch (item.media_class) {
    case "image":
      return "Image Generation";
    case "video":
      return "Video Generation";
    case "audio":
      return "Audio Generation";
    case "dimensional":
      return "3D Mesh";
    default:
      return "Generation";
  }
};

// ── Hook ───────────────────────────────────────────────────────────────────

// Pull a cover image / screenshot URL off a dimensional (3D) library item. The
// item's own cdn_url is the .glb/.spz asset, so 3D cards render the separate
// cover image the backend attaches instead. Mirrors the gallery-modal logic.
function get3DCoverThumbnail(item: any): string | null {
  const cover = item?.cover_image;
  if (!cover) return null;
  return (
    cover.maybe_links?.maybe_thumbnail_template?.replace("{WIDTH}", "512") ??
    cover.maybe_links?.cdn_url ??
    cover.maybe_cover_image_public_bucket_url ??
    null
  );
}

export function useGalleryData(options: {
  username: string | null;
  filterMediaClasses: FilterMediaClasses[];
  excludeUploads?: boolean;
  // When set, dimensional (3D) items are kept only if their model belongs to
  // this list. The library API filters by media class ("dimensional") but can't
  // tell mesh objects from splat worlds apart, so the two 3D create pages pass
  // their own model ids to keep each feed showing only its own product.
  filterModelIds?: string[];
}) {
  const { username, filterMediaClasses, excludeUploads, filterModelIds } =
    options;

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);

  const api = useMemo(() => new GalleryModalApi(), []);

  const mapApiItem = useCallback((item: any): GalleryItem => {
    // 3D uses the cover image / screenshot; audio has no thumbnail (its card
    // renders a waveform player); everything else uses the media thumbnail.
    const thumbnail =
      item.media_class === "audio"
        ? null
        : item.media_class === "dimensional"
          ? get3DCoverThumbnail(item)
          : getMediaThumbnail(item.media_links, item.media_class, {
              size: THUMBNAIL_SIZES.LARGE,
            });

    return {
      id: item.token,
      label: getLabel(item),
      thumbnail,
      fullImage: item.media_links?.cdn_url || null,
      createdAt: item.created_at,
      mediaClass: item.media_class || "image",
      modelId: item.maybe_model_type || undefined,
      batchImageToken: item.maybe_batch_token,
      promptToken: item.maybe_prompt_token || undefined,
      durationMillis: item.maybe_duration_millis ?? undefined,
    };
  }, []);

  const loadItems = useCallback(
    async (reset = false) => {
      if (!username) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const response = await api.listUserMediaFiles({
          username,
          filter_media_classes: filterMediaClasses,
          include_user_uploads: !excludeUploads,
          page_index: reset ? 0 : pageIndex,
          page_size: PAGE_SIZE,
        });

        if (response.success && response.data) {
          const modelIdSet =
            filterModelIds && filterModelIds.length
              ? new Set(filterModelIds)
              : null;

          const newItems = response.data
            .filter(
              (item: any) =>
                item.media_type !== FilterMediaType.SCENE_JSON &&
                !(excludeUploads && item.origin_category === "upload") &&
                // Split 3D history by model so the object and world pages don't
                // show each other's generations. Non-dimensional items and items
                // without a known model are left untouched.
                !(
                  modelIdSet &&
                  item.media_class === "dimensional" &&
                  item.maybe_model_type &&
                  !modelIdSet.has(item.maybe_model_type)
                ),
            )
            .map(mapApiItem);

          if (reset) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
          }

          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          setHasMore(current + 1 < total);
        }
      } catch {
        // ignore
      }

      setIsLoading(false);
      setIsInitialLoading(false);
      isLoadingRef.current = false;
    },
    [
      username,
      filterMediaClasses,
      pageIndex,
      api,
      mapApiItem,
      excludeUploads,
      filterModelIds,
    ],
  );

  // Initial load + filter change. When logged out (no username), clear the
  // loading flag so the shell renders the empty state instead of a spinner.
  useEffect(() => {
    setItems([]);
    setPageIndex(0);
    isLoadingRef.current = false;
    if (!username) {
      setHasMore(false);
      setIsInitialLoading(false);
      return;
    }
    setHasMore(true);
    setIsInitialLoading(true);
    loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, JSON.stringify(filterMediaClasses), JSON.stringify(filterModelIds)]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadItems();
    }
  }, [hasMore, loadItems]);

  const refresh = useCallback(() => {
    setItems([]);
    setPageIndex(0);
    setHasMore(true);
    isLoadingRef.current = false;
    loadItems(true);
  }, [loadItems]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    items,
    isLoading,
    isInitialLoading,
    hasMore,
    loadMore,
    refresh,
    removeItem,
  };
}
