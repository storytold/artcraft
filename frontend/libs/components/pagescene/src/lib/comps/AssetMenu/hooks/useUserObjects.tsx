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
  // Fail quietly (no toast) — for fetches expected to fail for anonymous
  // users, e.g. the Animations tab's background "my animations" load.
  suppressErrorToast?: boolean;
}

export const useUserObjects = (props: useUserObjectsProps) => {
  const editor = useContext(EngineContext);
  const failedFetches = useRef<number>(0);
  const firstFetch = useRef<FetchStatus>(FetchStatus.READY);
  const inFlightRef = useRef(false);

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
      // A ref (not a flag set inside a setState updater): React may run updater
      // functions later, so a flag set there is not reliable right after the call.
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setUserFetch((curr) => ({
        ...curr,
        status: FetchStatus.IN_PROGRESS,
      }));

      const {
        filterEngineCategories,
        filterMediaTypes,
        defaultErrorMessage,
        suppressErrorToast,
      } = props;
      let result: FetchMediaItemStates;
      try {
        result = await fetchUserMediaItems(
          {
            filterEngineCategories,
            filterMediaType: filterMediaTypes,
            defaultErrorMessage,
            nextPageIndex,
            suppressErrorToast,
          },
          editor.adapter,
        );
      } catch {
        // A thrown request is treated like a failed one, so the status never
        // stays stuck on IN_PROGRESS.
        result = { status: FetchStatus.ERROR };
      } finally {
        inFlightRef.current = false;
      }

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
        // Keep the pagination info so callers can ask for the next page; on a
        // failed fetch keep the last known one.
        nextPage: result.nextPage ?? curr.nextPage,
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
