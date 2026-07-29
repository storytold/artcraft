import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MediaFilesApi } from "@storyteller/api";
import type { GalleryItem } from "./types";

const PAGE_SIZE = 40;

// Pull the cover image / screenshot URL off a 3D library item. The item's own
// cdn_url is the .glb/.obj/.ply asset, so 3D cards render the separate cover
// image the backend attaches instead. Mirrors the gallery-modal logic.
function getCoverThumbnail(item: any): string | null {
  const cover = item?.cover_image;
  if (!cover) return null;
  return (
    cover.maybe_links?.maybe_thumbnail_template?.replace("{WIDTH}", "512") ??
    cover.maybe_links?.cdn_url ??
    cover.maybe_cover_image_public_bucket_url ??
    null
  );
}

/**
 * Session-scoped, cursor-paginated feed of the user's 3D media of one class:
 * "mesh" (`/v1/media_files/mesh/list`) or "splat" (`/v1/media_files/splat/list`).
 *
 * Successor to `useGalleryData` + `filterMediaClasses: ["dimensional"]` for
 * the 3D create pages: the class scoping happens server-side (the deprecated
 * "dimensional" class is no longer written), cover screenshots can't leak in
 * as their own entries, and mesh vs splat feeds can't see each other.
 * Returns the same surface as `useGalleryData`.
 */
export function useSessionMediaByClass(options: {
  mediaClass: "mesh" | "splat";
  enabled: boolean;
}) {
  const { mediaClass, enabled } = options;

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);

  const api = useMemo(() => new MediaFilesApi(), []);

  const mapApiItem = useCallback(
    (item: any): GalleryItem => ({
      id: item.token,
      label:
        item.maybe_title ?? (mediaClass === "splat" ? "3D World" : "3D Mesh"),
      thumbnail: getCoverThumbnail(item),
      fullImage: item.media_links?.cdn_url || null,
      createdAt: item.created_at,
      mediaClass: item.media_class || mediaClass,
      promptToken: item.maybe_prompt_token || undefined,
    }),
    [mediaClass],
  );

  const loadItems = useCallback(
    async (reset = false) => {
      if (!enabled) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const cursor = reset ? undefined : cursorRef.current;
        const response =
          mediaClass === "splat"
            ? await api.ListSessionSplatMediaFiles({
                cursor,
                page_size: PAGE_SIZE,
              })
            : await api.ListSessionMeshMediaFiles({
                cursor,
                page_size: PAGE_SIZE,
              });

        if (response.success && response.data) {
          const newItems = response.data.map(mapApiItem);

          if (reset) {
            setItems(newItems);
          } else {
            setItems((prev) => [...prev, ...newItems]);
          }

          // Keyset pagination: a full page implies there may be more; the
          // next cursor continues where this page ended.
          cursorRef.current = response.pagination?.maybe_next ?? undefined;
          setHasMore(
            newItems.length >= PAGE_SIZE && !!response.pagination?.maybe_next,
          );
        }
      } catch {
        // ignore
      }

      setIsLoading(false);
      setIsInitialLoading(false);
      isLoadingRef.current = false;
    },
    [enabled, mediaClass, api, mapApiItem],
  );

  // Initial load + class / login change. When logged out, clear the loading
  // flag so the shell renders the empty state instead of a spinner.
  useEffect(() => {
    setItems([]);
    cursorRef.current = undefined;
    isLoadingRef.current = false;
    if (!enabled) {
      setHasMore(false);
      setIsInitialLoading(false);
      return;
    }
    setHasMore(true);
    setIsInitialLoading(true);
    loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, mediaClass]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadItems();
    }
  }, [hasMore, loadItems]);

  const refresh = useCallback(() => {
    setItems([]);
    cursorRef.current = undefined;
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
