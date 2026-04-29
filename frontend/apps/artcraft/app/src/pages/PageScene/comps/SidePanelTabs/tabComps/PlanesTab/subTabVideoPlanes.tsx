import { useEffect, useState } from "react";
import { faCirclePlus } from "@fortawesome/pro-solid-svg-icons";
import {
  FeatureFlags,
  FilterEngineCategories,
  VIDEOPLANE_FILE_TYPE,
} from "~/enums";
import {
  UploadModalMedia,
} from "~/components";
import { SearchFilter } from "@storyteller/ui-search";
import { Button } from "@storyteller/ui-button";
import { Pagination } from "@storyteller/ui-pagination";
import { ItemElements } from "~/pages/PageScene/comps/SidePanelTabs/sharedComps";
import { isAnyStatusFetching } from "../../utilities";
import { useUserObjects, useSearchUserObjects } from "../../hooks";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";

const filterEngineCategories = [FilterEngineCategories.VIDEO_PLANE];

export const VideoPlanesTab = () => {
  const showSearchObjectComponent = usePosthogFeatureFlag(
    FeatureFlags.SHOW_SEARCH_OBJECTS,
  );

  const [openUploadModal, setOpenUploadModal] = useState(false);

  const { userObjects, userFetchStatus, fetchUserObjects } = useUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage: "Unknown Error in Fetching User Video Panels",
  });

  const {
    searchTermForUserObjects,
    userObjectsSearchResults,
    userObjectsSearchFetchStatus,
    updateSearchTermForUserObjects,
  } = useSearchUserObjects({
    filterEngineCategories: filterEngineCategories,
    defaultErrorMessage:
      "Unknown Error in Fetching User Video Panel Search Results",
  });

  const displayedItems = searchTermForUserObjects
    ? userObjectsSearchResults ?? []
    : userObjects ?? [];

  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 21;
  const totalPages = Math.ceil(displayedItems.length / pageSize);

  const isFetching = isAnyStatusFetching([
    userFetchStatus,
    userObjectsSearchFetchStatus,
  ]);

  useEffect(() => {
    if (searchTermForUserObjects.length > 0) {
      setCurrentPage(0);
    }
  }, [searchTermForUserObjects]);

  return (
    <>
      <div className="flex w-full flex-col gap-3 px-4">
        <Button
          icon={faCirclePlus}
          variant="action"
          onClick={() => setOpenUploadModal(true)}
          className="w-full py-3 text-sm font-medium"
        >
          Upload Video Panels
        </Button>
        {showSearchObjectComponent && (
          <SearchFilter
            searchTerm={searchTermForUserObjects}
            onSearchChange={updateSearchTermForUserObjects}
            placeholder={"Search my video panels"}
          />
        )}
      </div>
      <div className="w-full grow overflow-y-auto px-4 pb-4">
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
      <UploadModalMedia
        onClose={() => setOpenUploadModal(false)}
        onSuccess={fetchUserObjects}
        isOpen={openUploadModal}
        fileTypes={Object.values(VIDEOPLANE_FILE_TYPE)}
        title="Upload Video Panels"
      />
    </>
  );
};
