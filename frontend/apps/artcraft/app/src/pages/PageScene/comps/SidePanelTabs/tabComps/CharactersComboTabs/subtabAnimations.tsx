import { useEffect, useMemo, useState } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import {
  ANIMATION_MIXAMO_FILE_TYPE,
  ANIMATION_MMD_FILE_TYPE,
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
import {
  filterMixamoAnimations,
  filterMMDAnimations,
} from "./filterCharacterTypes";
import { MediaItem } from "~/pages/PageScene/models";
import { getFileExtension, getFileName } from "~/utilities";

const filterEngineCategories = [FilterEngineCategories.ANIMATION];

export const AnimationsTab = ({
  animationType,
  demoAnimationItems,
}: {
  animationType: MediaFileAnimationType;
  demoAnimationItems?: MediaItem[];
}) => {
  const { showSearchObjectComponent, showUploadButton } = useFeatureFlags();

  const [openUploadModal, setOpenUploadModal] = useState(false);

  const { userObjects, userFetchStatus, fetchUserObjects } = useUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching User Animations",
  });
  const { featuredObjects, featuredFetchStatus } = useFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching Featured Animations",
  });
  const {
    searchTermForFeaturedObjects,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    updateSearchTermForFeaturedObjects,
  } = useSearchFeaturedObjects({
    demoFeaturedObjects: demoAnimationItems,
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching Featured Animation Search Results",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching User Animation Search Results",
  });

  const [filterOwnership, setFilterOwnership] = useState(
    AssetFilterOption.FEATURED,
  );
  const filterAnimationType = useMemo(
    () =>
      animationType === MediaFileAnimationType.Mixamo
        ? filterMixamoAnimations
        : filterMMDAnimations,
    [animationType],
  );
  const displayedItems =
    filterOwnership === AssetFilterOption.FEATURED
      ? searchTermForFeaturedObjects
        ? featuredObjectsSearchResults ?? []
        : [...(demoAnimationItems ?? []), ...(featuredObjects ?? [])]
      : searchTermForUserObjects
        ? userObjectsSearchResults ?? []
        : userObjects ?? [];
  const filteredDisplayItems = displayedItems.filter(filterAnimationType);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 21;
  const totalPages = Math.ceil(filteredDisplayItems.length / pageSize);

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
        onClick={(buttonIdx) => {
          setFilterOwnership(Number(buttonIdx));
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
            Upload Animation (Dev Only)
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
                ? "Search featured animations"
                : "Search my animations"
            }
          />
        )}
      </div>
      <div className="w-full grow overflow-y-auto px-4 pb-4">
        <ItemElements
          busy={isFetching}
          debug="animations tab"
          currentPage={currentPage}
          pageSize={pageSize}
          items={filteredDisplayItems}
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
        type={FilterEngineCategories.ANIMATION}
        fileTypes={Object.values(
          animationType === MediaFileAnimationType.Mixamo
            ? ANIMATION_MIXAMO_FILE_TYPE
            : ANIMATION_MMD_FILE_TYPE,
        )}
        title="Upload Animation"
        options={{
          fileSubtypes: [
            { [animationType]: animationType },
            // { Mixamo: MediaFileAnimationType.Mixamo },
            // { MikuMikuDance: MediaFileAnimationType.MikuMikuDance },
            // { MoveAi: MediaFileAnimationType.MoveAi },
            // { Rigify: MediaFileAnimationType.Rigify },
            // { Rokoko: MediaFileAnimationType.Rokoko },
          ],
          hasLength: true,
          hasThumbnailUpload: true,
        }}
      />
    </>
  );
};
