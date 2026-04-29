import { useCallback, useEffect, useRef, useState } from "react";
import { FetchStatus } from "~/pages/PageScene/enums";
import {
  FetchMediaItemStates,
  fetchFeaturedMediaItemsSearchResults,
} from "../utilities";
import { FilterEngineCategories, FilterMediaType } from "~/enums";
import { MediaItem } from "~/pages/PageScene/models";
import deepEqual from "deep-equal";

interface useSearchFeaturedObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  demoFeaturedObjects?: MediaItem[];
  filterMediaTypes?: FilterMediaType[];
}

export const useSearchFeaturedObjects = ({
  demoFeaturedObjects,
  ...props
}: useSearchFeaturedObjectsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const lastSearchTerm = useRef(searchTerm);
  const updateSearchTermForFeaturedObjects = (newTerm: string) => {
    setSearchTerm(newTerm);
  };

  const [
    {
      mediaItems: featuredObjectsSearchResults,
      status: featuredObjectsSearchFetchStatus,
    },
    setFeaturedSearchFetch,
  ] = useState<FetchMediaItemStates>({
    mediaItems: undefined,
    status: FetchStatus.READY,
  });

  const demoItemsRef = useRef<MediaItem[]>([]);
  if (
    demoFeaturedObjects &&
    !deepEqual(demoItemsRef.current, demoFeaturedObjects)
  ) {
    demoItemsRef.current = demoFeaturedObjects;
  }

  const fetchFeaturedObjectSearchResults = useCallback(
    async (term: string) => {
      const filteredObjectItems = demoItemsRef.current.filter((item) =>
        item.name.toLowerCase().includes(term.toLowerCase()),
      );

      if (!term || !term.trim()) {
        //if after trim it's empty, do nothing
        return;
      }

      let breakFlag = false;
      setFeaturedSearchFetch((curr) => {
        if (curr.status === FetchStatus.IN_PROGRESS) {
          breakFlag = true;
          return curr;
        }
        return {
          ...curr,
          status: FetchStatus.IN_PROGRESS,
        };
      });
      if (breakFlag) {
        return;
      }

      const { filterEngineCategories, filterMediaTypes, defaultErrorMessage } =
        props;
      const result = await fetchFeaturedMediaItemsSearchResults({
        filterEngineCategories: filterEngineCategories,
        filterMediaType: filterMediaTypes,
        defaultErrorMessage: defaultErrorMessage,
        searchTerm: term,
      });

      setFeaturedSearchFetch({
        status: result.status,
        mediaItems: [...filteredObjectItems, ...(result.mediaItems ?? [])],
      });
    },
    [props],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const KEY_DELAY = 500;
    const delayedFetch = (term: string) => {
      if (term === lastSearchTerm.current) {
        fetchFeaturedObjectSearchResults(searchTerm);
      }
    };
    if (searchTerm !== lastSearchTerm.current) {
      lastSearchTerm.current = searchTerm;
      timer = setTimeout(() => delayedFetch(searchTerm), KEY_DELAY);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [fetchFeaturedObjectSearchResults, searchTerm]);

  return {
    searchTermForFeaturedObjects: searchTerm,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    fetchFeaturedObjectSearchResults,
    updateSearchTermForFeaturedObjects,
  };
};
