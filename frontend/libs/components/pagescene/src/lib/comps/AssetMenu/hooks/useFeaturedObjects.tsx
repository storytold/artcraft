import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import { FetchStatus } from "../../../enums";
import type {
  FilterEngineCategories,
  FilterMediaType,
} from "../../../enums";
import {
  FetchMediaItemStates,
  fetchFeaturedMediaItems,
} from "../utilities/fetchMediaItems";

const MAX_FAILED_FETCHES = 5;

interface useFeaturedObjectsProps {
  defaultErrorMessage: string;
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export const useFeaturedObjects = (props: useFeaturedObjectsProps) => {
  const editor = useContext(EngineContext);
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
    if (!editor) return;
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

    const result = await fetchFeaturedMediaItems(
      {
        filterEngineCategories,
        filterMediaType: filterMediaTypes,
        defaultErrorMessage,
        nextPageCursor,
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

    setFeaturedFetch((curr) => ({
      status: result.status,
      mediaItems: result.mediaItems
        ? curr.mediaItems
          ? [...curr.mediaItems, ...result.mediaItems]
          : result.mediaItems
        : curr.mediaItems,
      nextPageInf: result.nextPageInf,
    }));
  }, [nextPageCursor, props, editor]);

  useEffect(() => {
    // Wait for the editor instance before claiming first-fetch ownership.
    // Otherwise the IN_PROGRESS flip below would burn the slot on a no-op
    // call (fetchFeaturedObjects bails at !editor), and the subsequent
    // re-run after editor becomes available would see IN_PROGRESS and
    // skip the actual fetch forever. See PR #1492 regression.
    if (!editor) return;
    if (
      (firstFetch.current === FetchStatus.READY ||
        firstFetch.current === FetchStatus.ERROR) &&
      failedFetches.current <= MAX_FAILED_FETCHES
    ) {
      firstFetch.current = FetchStatus.IN_PROGRESS;
      fetchFeaturedObjects();
    }
  }, [editor, fetchFeaturedObjects]);

  return {
    featuredObjects,
    featuredFetchStatus,
    nextFeaturedObjects,
    fetchFeaturedObjects,
  };
};
