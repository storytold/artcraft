import { useCallback, useState, useRef } from "react";
import { FetchStatus } from "~/pages/PageScene/enums";
import { FetchMediaItemStates, fetchUserMediaItems } from "../utilities";
import { FilterEngineCategories, FilterMediaType } from "~/enums";

// import { MAX_FAILED_FETCHES } from "~/constants";

interface useUserObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export const useUserObjects = (props: useUserObjectsProps) => {
  const failedFetches = useRef<number>(0);
  const firstFetch = useRef<FetchStatus>(FetchStatus.READY);

  const [
    {
      mediaItems: userObjects,
      status: userFetchStatus,
      nextPage: nextUserObjects,
    },
    setUserFetch,
  ] = useState<FetchMediaItemStates>({
    mediaItems: undefined,
    status: FetchStatus.READY,
  });

  const fetchUserObjects = useCallback(
    async (nextPageIndex?: number) => {
      let breakFlag = false;
      setUserFetch((curr) => {
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
      const result = await fetchUserMediaItems({
        filterEngineCategories: filterEngineCategories,
        filterMediaType: filterMediaTypes,
        defaultErrorMessage: defaultErrorMessage,
        nextPageIndex: nextPageIndex,
      });

      if (result.status === FetchStatus.ERROR) {
        failedFetches.current = failedFetches.current + 1;
      } else {
        failedFetches.current = 0;
      }
      if (firstFetch.current !== FetchStatus.SUCCESS && result.mediaItems) {
        firstFetch.current = FetchStatus.SUCCESS;
      }

      setUserFetch((curr) => ({
        status: result.status,
        mediaItems: result.mediaItems
          ? curr.mediaItems && nextPageIndex
            ? [...curr.mediaItems, ...result.mediaItems]
            : result.mediaItems
          : curr.mediaItems,
      }));
    },
    [props],
  );

  // useEffect(() => {
  //   if (
  //     (firstFetch.current === FetchStatus.READY ||
  //       firstFetch.current === FetchStatus.ERROR) &&
  //     failedFetches.current <= MAX_FAILED_FETCHES
  //   ) {
  //     fetchUserObjects();
  //   }
  // }, [fetchUserObjects]);

  return {
    userObjects,
    userFetchStatus,
    nextUserObjects,
    fetchUserObjects,
  };
};
