import { useEffect, useState } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import {
  AssetFilterOption,
  CHARACTER_MIXAMO_FILE_TYPE,
  CHARACTER_MMD_FILE_TYPE,
  FilterEngineCategories,
  FilterMediaType,
  MediaFileAnimationType,
} from "~/enums";
import { MediaItem } from "~/pages/PageScene/models";
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

const filterEngineCategories = [FilterEngineCategories.CHARACTER];

export const CharactersTab = ({
  animationType,
  demoCharacterItems = [],
}: {
  animationType: MediaFileAnimationType;
  demoCharacterItems?: MediaItem[];
}) => {
  const fileTypes = Object.values(
    animationType === MediaFileAnimationType.Mixamo
      ? CHARACTER_MIXAMO_FILE_TYPE
      : CHARACTER_MMD_FILE_TYPE,
  );
  const { showSearchObjectComponent, showUploadButton } = useFeatureFlags();

  const [openUploadModal, setOpenUploadModal] = useState(false);

  const { userObjects, nextUserObjects, userFetchStatus, fetchUserObjects } =
    useUserObjects({
      filterEngineCategories: filterEngineCategories,
      filterMediaTypes: fileTypes as FilterMediaType[],
      defaultErrorMessage: "Unknown Error in Fetching User Characters",
    });

  const {
    featuredObjects,
    nextFeaturedObjects,
    fetchFeaturedObjects,
    featuredFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: filterEngineCategories,
    filterMediaTypes: fileTypes as FilterMediaType[],
    defaultErrorMessage: "Unknown Error in Fetching Featured Characters",
  });

  const {
    searchTermForFeaturedObjects,
    featuredObjectsSearchResults,
    featuredObjectsSearchFetchStatus,
    updateSearchTermForFeaturedObjects,
  } = useSearchFeaturedObjects({
    demoFeaturedObjects: demoCharacterItems,
    filterEngineCategories: filterEngineCategories,
    filterMediaTypes: fileTypes as FilterMediaType[],
    defaultErrorMessage:
      "Unknown Error in Fetching Featured Characters Search Results",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    filterMediaTypes: fileTypes as FilterMediaType[],
    defaultErrorMessage:
      "Unknown Error in Fetching User Characters Search Results",
  });

  const [filterOwnership, setFilterOwnership] = useState(
    AssetFilterOption.FEATURED,
  );

  const displayedItems =
    filterOwnership === AssetFilterOption.FEATURED
      ? searchTermForFeaturedObjects
        ? featuredObjectsSearchResults ?? []
        : [...(demoCharacterItems ?? []), ...(featuredObjects ?? [])]
      : searchTermForUserObjects
        ? userObjectsSearchResults ?? []
        : userObjects ?? [];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 21;
  const totalPages = Math.ceil(displayedItems.length / pageSize);
  const fetchMorePages =
    filterOwnership === AssetFilterOption.FEATURED
      ? nextFeaturedObjects?.maybe_next
        ? fetchFeaturedObjects
        : undefined
      : nextUserObjects &&
        nextUserObjects.current !== nextUserObjects.total_page_count
        ? () => fetchUserObjects(nextUserObjects.current)
        : undefined;

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
      <div>
        <FilterButtons
          value={filterOwnership}
          onClick={(button) => {
            setFilterOwnership(Number(button));
            setCurrentPage(0);
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-3 px-4">
        {showUploadButton && (
          <Button
            icon={faCirclePlus}
            variant="action"
            onClick={() => setOpenUploadModal(true)}
            className="w-full py-3 text-sm font-medium"
          >
            Upload Character (Dev Only)
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
                ? "Search featured characters"
                : "Search my characters"
            }
          />
        )}
      </div>
      <div className="w-full grow overflow-y-auto rounded px-4 pb-4">
        <ItemElements
          busy={isFetching}
          debug="characters tab"
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
          onFetchMorePages={fetchMorePages}
        />
      )}
      <UploadModal
        getFileName={getFileName}
        getFileExtension={getFileExtension}
        onClose={() => setOpenUploadModal(false)}
        onSuccess={fetchUserObjects}
        isOpen={openUploadModal}
        type={FilterEngineCategories.CHARACTER}
        options={{
          hasThumbnailUpload: true,
          fileSubtypes: [
            { [animationType]: animationType },
            // { Mixamo: MediaFileAnimationType.Mixamo },
            // { MikuMikuDance: MediaFileAnimationType.MikuMikuDance },
            // { MoveAi: MediaFileAnimationType.MoveAi },
            // { Rigify: MediaFileAnimationType.Rigify },
            // { Rokoko: MediaFileAnimationType.Rokoko },
          ],
        }}
        fileTypes={fileTypes}
        title="Upload Characters"
      />
    </>
  );
};
