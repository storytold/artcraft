import { useEffect, useState } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import {
  AssetFilterOption,
  FilterEngineCategories,
  MediaFileAnimationType,
} from "~/enums";
import {
  UploadModal,
} from "@storyteller/ui-upload-modal";
import { SearchFilter } from "@storyteller/ui-search";
import { Pagination } from "@storyteller/ui-pagination";
import { Button, FilterButtons } from "@storyteller/ui-button";
import { ItemElements } from "~/pages/PageScene/comps/SidePanelTabs/sharedComps";
import { isAnyStatusFetching } from "../../utilities";
import {
  useUserObjects,
  useFeaturedObjects,
  useSearchFeaturedObjects,
  useSearchUserObjects,
  useFeatureFlags,
} from "../../hooks";
import { getFileExtension, getFileName } from "~/utilities";

const filterEngineCategories = [FilterEngineCategories.EXPRESSION];

export const ExpressionTab = () => {
  const { showSearchObjectComponent, showUploadButton } = useFeatureFlags();

  const [openUploadModal, setOpenUploadModal] = useState(false);

  const { userObjects, userFetchStatus, fetchUserObjects } = useUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching User Expressions",
  });
  const { featuredObjects, featuredFetchStatus } = useFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching Featured Expressions",
  });
  const {
    searchTermForFeaturedObjects,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    updateSearchTermForFeaturedObjects,
  } = useSearchFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching Featured Expressions Search Results",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching User Expressions Search Results",
  });

  const [filterOwnership, setFilterOwnership] = useState(
    AssetFilterOption.FEATURED,
  );

  const displayedItems =
    filterOwnership === AssetFilterOption.FEATURED
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
      <FilterButtons
        value={filterOwnership}
        onClick={(button) => {
          setFilterOwnership(button);
          setCurrentPage(0);
        }}
      />
      <div className="flex w-full flex-col gap-3 px-4">
        {showUploadButton && (
          <Button
            icon={faCirclePlus}
            variant="action"
            onClick={() => setOpenUploadModal(true)}
            className="w-full py-3 text-sm font-medium"
          >
            Upload Expression (Dev Only)
          </Button>
        )}
        {showSearchObjectComponent && (
          <SearchFilter
            searchTerm={
              filterOwnership === AssetFilterOption.FEATURED
                ? searchTermForFeaturedObjects
                : searchTermForUserObjects
            }
            onSearchChange={
              filterOwnership === AssetFilterOption.FEATURED
                ? updateSearchTermForFeaturedObjects
                : updateSearchTermForUserObjects
            }
            key={filterOwnership}
            placeholder={
              filterOwnership === AssetFilterOption.FEATURED
                ? "Search featured expressions"
                : "Search my expressions"
            }
          />
        )}
      </div>
      <div className="h-full w-full overflow-y-auto px-4 pb-4">
        <ItemElements
          busy={isFetching}
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
      <UploadModal
        getFileName={getFileName}
        getFileExtension={getFileExtension}
        onClose={() => setOpenUploadModal(false)}
        onSuccess={fetchUserObjects}
        isOpen={openUploadModal}
        type={FilterEngineCategories.EXPRESSION}
        fileTypes={["CSV"]}
        title="Upload Expression"
        options={{
          fileSubtypes: [{ ARKit: MediaFileAnimationType.ArKit }],
          hasLength: true,
          hasThumbnailUpload: true,
        }}
      />
    </>
  );
};
