import { useCallback, useContext, useState, useRef } from "react";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import { FetchStatus } from "../../../enums";
import type {
  FilterEngineCategories,
  FilterMediaType,
} from "../../../enums";
import {
  FetchMediaItemStates,
  fetchUserMediaItems,
} from "../utilities/fetchMediaItems";

interface useUserObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export const useUserObjects = (props: useUserObjectsProps) => {
  const editor = useContext(EngineContext);
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
      if (!editor) return;
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
      const result = await fetchUserMediaItems(
        {
          filterEngineCategories,
          filterMediaType: filterMediaTypes,
          defaultErrorMessage,
          nextPageIndex,
        },
        editor.adapter,
      );

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
    [props, editor],
  );

  return {
    userObjects,
    userFetchStatus,
    nextUserObjects,
    fetchUserObjects,
  };
};
