import { useCallback, useEffect, useRef, useState } from "react";
import { FetchStatus } from "~/pages/PageScene/enums";
import {
  FetchMediaItemStates,
  fetchUserMediaItemsSearchResults,
} from "../utilities";
import { FilterEngineCategories, FilterMediaType } from "~/enums";

interface useSearchUserObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export const useSearchUserObjects = (props: useSearchUserObjectsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const lastSearchTerm = useRef(searchTerm);
  const updateSearchTermForUserObjects = (newTerm: string) => {
    setSearchTerm(newTerm);
  };
  const [
    {
      mediaItems: userObjectsSearchResults,
      status: userObjectsSearchFetchStatus,
    },
    setUserSearchFetch,
  ] = useState<FetchMediaItemStates>({
    mediaItems: undefined,
    status: FetchStatus.READY,
  });

  const fetchUserObjectsSearchResults = useCallback(
    async (term: string) => {
      if (!term || !term.trim()) {
        //if after trim it's empty, do nothing
        return;
      }

      let breakFlag = false;
      setUserSearchFetch((curr) => {
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
      const result = await fetchUserMediaItemsSearchResults({
        filterEngineCategories: filterEngineCategories,
        filterMediaType: filterMediaTypes,
        defaultErrorMessage: defaultErrorMessage,
        searchTerm: term,
      });
      setUserSearchFetch({
        status: result.status,
        mediaItems: result.mediaItems,
      });
    },
    [props],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const KEY_DELAY = 500;
    const delayedFetch = (term: string) => {
      if (term === lastSearchTerm.current) {
        fetchUserObjectsSearchResults(searchTerm);
      }
    };
    if (searchTerm !== lastSearchTerm.current) {
      lastSearchTerm.current = searchTerm;
      timer = setTimeout(() => delayedFetch(searchTerm), KEY_DELAY);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [fetchUserObjectsSearchResults, searchTerm]);

  return {
    searchTermForUserObjects: searchTerm,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    fetchUserObjectsSearchResults,
    updateSearchTermForUserObjects,
  };
};
