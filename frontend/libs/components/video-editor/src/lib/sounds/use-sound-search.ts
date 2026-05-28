import { useEffect } from "react";
import { useSoundsStore } from "./sounds-store";
import { EditorCore } from "../core";

export function useSoundSearch({
  query,
  commercialOnly,
}: {
  query: string;
  commercialOnly: boolean;
}) {
  const {
    searchResults,
    isSearching,
    searchError,
    lastSearchQuery,
    currentPage,
    hasNextPage,
    isLoadingMore,
    totalCount,
    setSearchResults,
    setSearching,
    setSearchError,
    setLastSearchQuery,
    setCurrentPage,
    setHasNextPage,
    setTotalCount,
    setLoadingMore,
    appendSearchResults,
    appendTopSounds,
    resetPagination,
  } = useSoundsStore();

  const loadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    try {
      setLoadingMore({ loading: true });
      const nextPage = currentPage + 1;
      const adapter = EditorCore.getInstance().adapters.soundsAdapter;
      const data = await adapter.searchSounds({
        query: query.trim() ? query : "",
        page: nextPage,
        commercialOnly,
      });

      if (query.trim()) {
        appendSearchResults({ results: data.results });
      } else {
        appendTopSounds({ results: data.results });
      }

      setCurrentPage({ page: nextPage });
      setHasNextPage({ hasNext: data.hasNextPage });
      setTotalCount({ count: data.totalCount });
    } catch (err) {
      setSearchError({
        error: err instanceof Error ? err.message : "Load more failed",
      });
    } finally {
      setLoadingMore({ loading: false });
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults({ results: [] });
      setSearchError({ error: null });
      setLastSearchQuery({ query: "" });
      return undefined;
    }

    if (query === lastSearchQuery && searchResults.length > 0) {
      return undefined;
    }

    let ignore = false;

    const timeoutId = setTimeout(async () => {
      try {
        setSearching({ searching: true });
        setSearchError({ error: null });
        resetPagination();

        const adapter = EditorCore.getInstance().adapters.soundsAdapter;
        const data = await adapter.searchSounds({
          query,
          page: 1,
          commercialOnly,
        });

        if (!ignore) {
          setSearchResults({ results: data.results });
          setLastSearchQuery({ query: query });
          setHasNextPage({ hasNext: data.hasNextPage });
          setTotalCount({ count: data.totalCount });
          setCurrentPage({ page: 1 });
        }
      } catch (err) {
        if (!ignore) {
          setSearchError({
            error: err instanceof Error ? err.message : "Search failed",
          });
        }
      } finally {
        if (!ignore) {
          setSearching({ searching: false });
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      ignore = true;
    };
  }, [
    query,
    commercialOnly,
    lastSearchQuery,
    searchResults.length,
    setSearchResults,
    setSearching,
    setSearchError,
    setLastSearchQuery,
    setCurrentPage,
    setHasNextPage,
    setTotalCount,
    resetPagination,
  ]);

  return {
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    loadMore,
    hasNextPage,
    isLoadingMore,
    totalCount,
  };
}
