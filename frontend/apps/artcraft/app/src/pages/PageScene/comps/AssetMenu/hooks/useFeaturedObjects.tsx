import { useCallback, useEffect, useState, useRef } from "react";
import { FetchStatus } from "~/pages/PageScene/enums";
import { FetchMediaItemStates, fetchFeaturedMediaItems } from "../utilities";
import { FilterEngineCategories, FilterMediaType } from "~/enums";
import { MAX_FAILED_FETCHES } from "~/constants";

interface useFeaturedObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export const useFeaturedObjects = (props: useFeaturedObjectsProps) => {
  const failedFetches = useRef<number>(0);
  const firstFetch = useRef<FetchStatus>(FetchStatus.READY);

  const [
    {
      mediaItems: featuredObjects,
      status: featuredFetchStatus,
      nextPageInf: nextFeaturedObjects,
    },
    setFeaturedFetch,
  ] = useState<FetchMediaItemStates>({
    mediaItems: undefined,
    nextPageInf: undefined,
    status: FetchStatus.READY,
  });
  const nextPageCursor = nextFeaturedObjects?.maybe_next;

  const fetchFeaturedObjects = useCallback(async () => {
    let breakFlag = false;
    setFeaturedFetch((curr) => {
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

    const result = await fetchFeaturedMediaItems({
      filterEngineCategories: filterEngineCategories,
      filterMediaType: filterMediaTypes,
      defaultErrorMessage: defaultErrorMessage,
      nextPageCursor: nextPageCursor,
    });

    if (result.status === FetchStatus.ERROR) {
      failedFetches.current = failedFetches.current + 1;
    } else {
      failedFetches.current = 0;
    }
    if (firstFetch.current !== FetchStatus.SUCCESS && result.mediaItems) {
      firstFetch.current = FetchStatus.SUCCESS;
    }

    setFeaturedFetch((curr) => ({
      status: result.status,
      mediaItems: result.mediaItems
        ? curr.mediaItems
          ? [...curr.mediaItems, ...result.mediaItems]
          : result.mediaItems
        : curr.mediaItems,
      nextPageInf: result.nextPageInf,
    }));
  }, [nextPageCursor, props]);

  useEffect(() => {
    if (
      (firstFetch.current === FetchStatus.READY ||
        firstFetch.current === FetchStatus.ERROR) &&
      failedFetches.current <= MAX_FAILED_FETCHES
    ) {
      firstFetch.current = FetchStatus.IN_PROGRESS;
      fetchFeaturedObjects();
    }
  }, [fetchFeaturedObjects]);

  return {
    featuredObjects,
    featuredFetchStatus,
    nextFeaturedObjects,
    fetchFeaturedObjects,
  };
};
