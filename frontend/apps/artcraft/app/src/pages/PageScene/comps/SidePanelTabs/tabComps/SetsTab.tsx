import { useEffect, useState, useCallback } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";

import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";

import {
  AssetFilterOption,
  FeatureFlags,
  FilterEngineCategories,
  OBJECT_FILE_TYPE,
  TabTitles,
} from "~/enums";

import {
  UploadModal3D,
} from "~/components";
import { SearchFilter } from "@storyteller/ui-search";
import { Button, FilterButtons } from "@storyteller/ui-button"

import {
  TabTitle,
  ItemElements,
} from "~/pages/PageScene/comps/SidePanelTabs/sharedComps";

import { isAnyStatusFetching } from "../utilities";
import {
  useUserObjects,
  useFeaturedObjects,
  useSearchFeaturedObjects,
  useSearchUserObjects,
} from "../hooks";

const filterEngineCategories = [FilterEngineCategories.LOCATION];
const PAGE_SIZE = 42; // Load 2 pages worth of items at a time

export const SetsTab = () => {
  const showSearchObjectComponent = usePosthogFeatureFlag(
    FeatureFlags.SHOW_SEARCH_OBJECTS,
  );

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [loadedItemCount, setLoadedItemCount] = useState(PAGE_SIZE);

  const { userObjects, userFetchStatus, fetchUserObjects } = useUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching User Film Sets",
  });
  const { featuredObjects, featuredFetchStatus } = useFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching Featured Film Sets",
  });
  const {
    searchTermForFeaturedObjects,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    updateSearchTermForFeaturedObjects,
  } = useSearchFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching Featured Film Sets Search Results",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching User Film Sets Search Results",
  });

  const [selectedFilter, setSelectedFilter] = useState(
    AssetFilterOption.FEATURED,
  );

  const displayedItems =
    selectedFilter === AssetFilterOption.FEATURED
      ? searchTermForFeaturedObjects
        ? (featuredObjectsSearchResults ?? [])
        : (featuredObjects ?? [])
      : searchTermForUserObjects
        ? (userObjectsSearchResults ?? [])
        : (userObjects ?? []);

  const isFetching = isAnyStatusFetching([
    userFetchStatus,
    featuredFetchStatus,
    featuredObjectsSearchFetchStatus,
    userObjectsSearchFetchStatus,
  ]);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && loadedItemCount < displayedItems.length) {
      setLoadedItemCount((prev) =>
        Math.min(prev + PAGE_SIZE, displayedItems.length),
      );
    }
  }, [isFetching, loadedItemCount, displayedItems.length]);

  useEffect(() => {
    setLoadedItemCount(PAGE_SIZE);
  }, [searchTermForUserObjects, searchTermForFeaturedObjects, selectedFilter]);

  return (
    <>
      <TabTitle title={TabTitles.OBJECTS_SETS} />

      <FilterButtons
        value={selectedFilter}
        onClick={(buttonIdx) => {
          setSelectedFilter(Number(buttonIdx));
        }}
      />

      <div className="flex w-full flex-col gap-3 px-4">
        <Button
          icon={faCirclePlus}
          variant="action"
          onClick={() => setOpenUploadModal(true)}
          className="w-full py-3 text-sm font-medium"
        >
          Upload Film Sets
        </Button>
        {showSearchObjectComponent && (
          <SearchFilter
            searchTerm={
              selectedFilter === AssetFilterOption.FEATURED
                ? searchTermForFeaturedObjects
                : searchTermForUserObjects
            }
            onSearchChange={
              selectedFilter === AssetFilterOption.FEATURED
                ? updateSearchTermForFeaturedObjects
                : updateSearchTermForUserObjects
            }
            key={selectedFilter}
            placeholder={
              selectedFilter === AssetFilterOption.FEATURED
                ? "Search featured film sets"
                : "Search my film sets"
            }
          />
        )}
      </div>
      <div className="w-full grow overflow-y-auto px-4 pb-4">
        <ItemElements
          busy={isFetching}
          debug="sets tab"
          items={displayedItems.slice(0, loadedItemCount)}
          onLoadMore={handleLoadMore}
          hasMore={loadedItemCount < displayedItems.length}
        />
      </div>
      <UploadModal3D
        onClose={() => setOpenUploadModal(false)}
        onSuccess={fetchUserObjects}
        isOpen={openUploadModal}
        engineCategory={FilterEngineCategories.LOCATION}
        fileTypes={Object.values(OBJECT_FILE_TYPE)}
        title="Upload Film Sets"
      />
    </>
  );
};
