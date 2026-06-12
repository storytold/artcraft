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
    case "dimensional":
      return "3D Mesh";
    default:
      return "Generation";
  }
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGalleryData(options: {
  username: string | null;
  filterMediaClasses: FilterMediaClasses[];
  excludeUploads?: boolean;
}) {
  const { username, filterMediaClasses, excludeUploads } = options;

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);

  const api = useMemo(() => new GalleryModalApi(), []);

  const mapApiItem = useCallback((item: any): GalleryItem => {
    const isDimensional = item.media_class === "dimensional";
    const thumbnail = isDimensional
      ? null
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
          const newItems = response.data
            .filter(
              (item: any) =>
                item.media_type !== FilterMediaType.SCENE_JSON &&
                !(excludeUploads && item.origin_category === "upload"),
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
    [username, filterMediaClasses, pageIndex, api, mapApiItem, excludeUploads],
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
  }, [username, JSON.stringify(filterMediaClasses)]); // eslint-disable-line react-hooks/exhaustive-deps

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
