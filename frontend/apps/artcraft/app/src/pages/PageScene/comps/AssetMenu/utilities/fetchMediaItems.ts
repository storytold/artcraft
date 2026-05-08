import { FilterEngineCategories, FilterMediaType, ToastTypes } from "~/enums";
import { addToast } from "~/signals";
import { FetchStatus } from "~/pages/PageScene/enums";
import { MediaFilesApi } from "~/Classes/ApiManager";
import {
  MediaItem,
  Pagination,
  PaginationInfinite,
} from "~/pages/PageScene/models";

import { responseMapping } from "./misc";

export interface FetchMediaItemStates {
  mediaItems?: MediaItem[];
  nextPageInf?: PaginationInfinite;
  nextPage?: Pagination;
  status: FetchStatus;
}

interface fetchMediaItemsInterface {
  filterEngineCategories: FilterEngineCategories[];
  filterMediaType?: FilterMediaType[];
  defaultErrorMessage?: string;
  nextPageCursor?: string; // for featured items' infinite pagination
  nextPageIndex?: number; // for user item's normal pagination
}

export const fetchUserMediaItems = async ({
  filterEngineCategories,
  filterMediaType,
  defaultErrorMessage,
  nextPageIndex,
}: fetchMediaItemsInterface): Promise<FetchMediaItemStates> => {
  const mediaFilesApi = new MediaFilesApi();

  const response = await mediaFilesApi.ListUserMediaFiles({
    page_size: 100,
    page_index: nextPageIndex,
    filter_engine_categories: filterEngineCategories,
    filter_media_type: filterMediaType,
  });

  if (response.success && response.data) {
    const newSetObjects = responseMapping(
      response.data,
      filterEngineCategories,
    );
    return {
      mediaItems: newSetObjects,
      status: FetchStatus.SUCCESS,
    };
  }
  addToast(
    ToastTypes.ERROR,
    response.errorMessage ??
      defaultErrorMessage ??
      "Unknown Error in Fetching Media Items",
  );
  return { status: FetchStatus.ERROR };
};

export const fetchFeaturedMediaItems = async ({
  filterMediaType,
  filterEngineCategories,
  defaultErrorMessage,
  nextPageCursor,
}: fetchMediaItemsInterface): Promise<FetchMediaItemStates> => {
  const mediaFilesApi = new MediaFilesApi();
  const response = await mediaFilesApi.ListFeaturedMediaFiles({
    page_size: 100,
    filter_engine_categories: filterEngineCategories,
    filter_media_type: filterMediaType,
    cursor: nextPageCursor,
  });

  if (response.success && response.data) {
    const newSetObjects = responseMapping(
      response.data,
      filterEngineCategories,
    );
    return {
      mediaItems: newSetObjects,
      status: FetchStatus.SUCCESS,
      nextPageInf: response.pagination,
    };
  }
  addToast(
    ToastTypes.ERROR,
    response.errorMessage ??
      defaultErrorMessage ??
      "Unknown Error in Fetching Media Items",
  );
  return { status: FetchStatus.ERROR };
};
