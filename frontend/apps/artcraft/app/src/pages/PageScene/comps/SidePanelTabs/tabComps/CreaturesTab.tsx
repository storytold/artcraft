import { useEffect, useState } from "react";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import {
  AssetFilterOption,
  FeatureFlags,
  FilterEngineCategories,
  OBJECT_FILE_TYPE,
  TabTitles,
} from "~/enums";
import {
  TabTitle,
  ItemElements,
} from "~/pages/PageScene/comps/SidePanelTabs/sharedComps";
import {
  UploadModal3D,
} from "~/components";
import { SearchFilter } from "@storyteller/ui-search";
import { Pagination } from "@storyteller/ui-pagination";

import { Button, FilterButtons } from "@storyteller/ui-button"

import { isAnyStatusFetching } from "../utilities";
import {
  useUserObjects,
  useFeaturedObjects,
  useSearchFeaturedObjects,
  useSearchUserObjects,
} from "../hooks";

const filterEngineCategories = [FilterEngineCategories.CREATURE];

export const CreaturesTab = () => {
  const showSearchObjectComponent = usePosthogFeatureFlag(
    FeatureFlags.SHOW_SEARCH_OBJECTS,
  );

  const [openUploadModal, setOpenUploadModal] = useState(false);

  const { userObjects, userFetchStatus, fetchUserObjects } = useUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching User Creature Objects",
  });

  const { featuredObjects, featuredFetchStatus } = useFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching Featured Creature Objects",
  });

  const {
    searchTermForFeaturedObjects,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    updateSearchTermForFeaturedObjects,
  } = useSearchFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching Featured Creature Objects Search Results",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching User Creature Objects Search Results",
  });

  const [selectedFilter, setSelectedFilter] = useState(
    AssetFilterOption.FEATURED,
  );

  const displayedItems =
    selectedFilter === AssetFilterOption.FEATURED
      ? searchTermForFeaturedObjects
        ? featuredObjectsSearchResults ?? []
        : featuredObjects ?? []
      : searchTermForUserObjects
        ? userObjectsSearchResults ?? []
        : userObjects ?? [];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 21;
  const totalPages = Math.ceil(displayedItems.length / pageSize);

  const isFetching = isAnyStatusFetching([
    userFetchStatus,
    featuredFetchStatus,
    featuredObjectsSearchFetchStatus,
    userObjectsSearchFetchStatus,
  ]);

  useEffect(() => {
    if (searchTermForUserObjects.length > 0) {
      setCurrentPage(0);
    }
  }, [searchTermForUserObjects]);

  useEffect(() => {
    if (searchTermForFeaturedObjects.length > 0) {
      setCurrentPage(0);
    }
  }, [searchTermForFeaturedObjects]);

  return (
    <>
      <TabTitle title={TabTitles.OBJECTS_CREATURES} />
      <FilterButtons
        value={selectedFilter}
        onClick={(button) => {
          setSelectedFilter(Number(button));
          setCurrentPage(0);
        }}
      />
      <div className="flex w-full flex-col gap-3 px-4">
        <Button
          icon={faCirclePlus}
          variant="action"
          onClick={() => setOpenUploadModal(true)}
          className="w-full py-3 text-sm font-medium"
        >
          Upload Creatures
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
                ? "Search featured creature objects"
                : "Search my creature objects"
            }
          />
        )}
      </div>
      <div className="w-full grow overflow-y-auto rounded px-4 pb-4">
        <ItemElements
          busy={isFetching}
          debug="objects tab"
          currentPage={currentPage}
          pageSize={pageSize}
          items={displayedItems}
        />
      </div>
      {totalPages > 1 && (
        <Pagination
          className="-mt-4 px-4"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage: number) => {
            setCurrentPage(newPage);
          }}
        />
      )}
      <UploadModal3D
        onClose={() => setOpenUploadModal(false)}
        onSuccess={fetchUserObjects}
        isOpen={openUploadModal}
        engineCategory={FilterEngineCategories.CREATURE}
        fileTypes={Object.values(OBJECT_FILE_TYPE)}
        title="Upload Creatures"
      />
    </>
  );
};
