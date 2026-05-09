import type { PageSceneAdapter } from "../../../adapter";
import {
  FetchStatus,
  FilterEngineCategories,
  FilterMediaType,
  ToastTypes,
} from "../../../enums";
import type {
  MediaItem,
  Pagination,
  PaginationInfinite,
} from "../../../models";
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

export const fetchUserMediaItems = async (
  args: fetchMediaItemsInterface,
  adapter: PageSceneAdapter,
): Promise<FetchMediaItemStates> => {
  const {
    filterEngineCategories,
    filterMediaType,
    defaultErrorMessage,
    nextPageIndex,
  } = args;

  const response = await adapter.listUserMediaFiles({
    pageSize: 100,
    pageIndex: nextPageIndex,
    filterEngineCategories,
    filterMediaTypes: filterMediaType,
  });

  if (response.success && response.data) {
    const newSetObjects = responseMapping(
      response.data,
      filterEngineCategories,
      adapter,
    );
    return {
      mediaItems: newSetObjects,
      status: FetchStatus.SUCCESS,
    };
  }
  adapter.showToast(
    ToastTypes.ERROR,
    response.errorMessage ??
      defaultErrorMessage ??
      "Unknown Error in Fetching Media Items",
  );
  return { status: FetchStatus.ERROR };
};

export const fetchFeaturedMediaItems = async (
  args: fetchMediaItemsInterface,
  adapter: PageSceneAdapter,
): Promise<FetchMediaItemStates> => {
  const {
    filterMediaType,
    filterEngineCategories,
    defaultErrorMessage,
    nextPageCursor,
  } = args;

  const response = await adapter.listFeaturedMediaFiles({
    pageSize: 100,
    cursor: nextPageCursor,
    filterEngineCategories,
    filterMediaTypes: filterMediaType,
  });

  if (response.success && response.data) {
    const newSetObjects = responseMapping(
      response.data,
      filterEngineCategories,
      adapter,
    );
    return {
      mediaItems: newSetObjects,
      status: FetchStatus.SUCCESS,
      nextPageInf: response.pagination,
    };
  }
  adapter.showToast(
    ToastTypes.ERROR,
    response.errorMessage ??
      defaultErrorMessage ??
      "Unknown Error in Fetching Media Items",
  );
  return { status: FetchStatus.ERROR };
};
