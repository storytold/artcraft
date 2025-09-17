import { Modal } from "@storyteller/ui-modal";
import { UploadModal3D } from "~/components/reusable/UploadModal3D";
import {
  faSearch,
  faChevronLeft,
  faLayerGroup,
  faUser,
  faSun,
  faCube,
  faChevronRight,
  faMountainCity,
  faDog,
  faFaceGrinStars,
  faUpFromLine,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { CloseButton } from "@storyteller/ui-close-button";
import { Input } from "@storyteller/ui-input";
// import { TabSelector } from "@storyteller/ui-tab-selector";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from "react";
import { ItemElements } from "../SidePanelTabs/sharedComps/ItemElements";
import {
  demoSkyboxItems,
  demoShapeItems,
  demoCharacterItems,
  demoMemeItems,
  assetModalVisibleDuringDrag,
  reopenAfterDragSignal,
  assetModalVisible,
} from "../../signals";
import { MediaItem } from "../../models";
import { useUserObjects, useFeaturedObjects } from "../SidePanelTabs/hooks";
import { FilterEngineCategories, FilterMediaType } from "~/enums";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { isAnyStatusFetching } from "../SidePanelTabs/utilities";

type AssetTab = {
  id: string;
  label: string;
  labelSingle?: string;
  icon: typeof faLayerGroup;
  engineCategory?: FilterEngineCategories;
  items: MediaItem[];
};

const AllTabSection = ({
  label,
  items,
  onViewAll,
}: {
  label: string;
  items: MediaItem[];
  onViewAll: () => void;
}) => (
  <div className="mb-0">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-md ml-2 font-semibold opacity-90">{label}</h3>
      <Button
        variant="secondary"
        className="mr-3 flex items-center gap-1 px-2 py-1 text-xs"
        onClick={onViewAll}
      >
        View all
        <FontAwesomeIcon icon={faChevronRight} className="text-xs opacity-70" />
      </Button>
    </div>
    <div className="h-[170px]">
      <ItemElements
        items={items.slice(0, 4)}
        busy={false}
        debug={`all-tab-section-${label}`}
      />
    </div>
  </div>
);

const categoryToTabIdMap: Record<FilterEngineCategories, string> = {
  [FilterEngineCategories.CHARACTER]: "characters",
  [FilterEngineCategories.CREATURE]: "creatures",
  [FilterEngineCategories.IMAGE_PLANE]: "image-planes",
  [FilterEngineCategories.LOCATION]: "sets",
  [FilterEngineCategories.OBJECT]: "objects",
  [FilterEngineCategories.SKYBOX]: "skybox",
  [FilterEngineCategories.ANIMATION]: "all",
  [FilterEngineCategories.AUDIO]: "all",
  [FilterEngineCategories.EXPRESSION]: "all",
  [FilterEngineCategories.SCENE]: "all",
  [FilterEngineCategories.SET_DRESSING]: "all",
  [FilterEngineCategories.VIDEO_PLANE]: "all",
};

export const AssetModal = () => {
  useSignals();
  const [activeLibraryTab, setActiveLibraryTab] = useState("library");
  const [activeAssetTab, setActiveAssetTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterEngineCategories | null>(null);
  const [isSelectVisible, setIsSelectVisible] = useState(true);

  const handleReopenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    // Force the update to be asynchronous
    setTimeout(() => {
      reopenAfterDragSignal.value = newValue;
    }, 0);
  };

  const handleClose = () => {
    assetModalVisible.value = false;
  };

  const handleOpen = () => {
    assetModalVisible.value = true;
  };

  useEffect(() => {
    if (assetModalVisible.value) {
      // Check for stored category and tab from upload
      const lastUploadedTab = sessionStorage.getItem("lastUploadedTab");
      if (lastUploadedTab) {
        setActiveLibraryTab("mine");
        setActiveAssetTab(lastUploadedTab);
        // Clear the stored values
        sessionStorage.removeItem("lastUploadedTab");
        sessionStorage.removeItem("lastUploadedCategory");
      }
      // Small delay to ensure the modal is fully mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        // Ensure no side effects remain
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetModalVisible.value]);

  // Fetch objects for different categories
  const {
    userObjects: userCharacters,
    userFetchStatus: userCharactersFetchStatus,
    fetchUserObjects: fetchUserCharacters,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.CHARACTER],
    defaultErrorMessage: "Error fetching user characters",
  });

  const {
    userObjects: userObjects,
    userFetchStatus: userObjectsFetchStatus,
    fetchUserObjects: fetchUserObjects,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.OBJECT],
    defaultErrorMessage: "Error fetching user objects",
  });

  const {
    userObjects: userSets,
    userFetchStatus: userSetsFetchStatus,
    fetchUserObjects: fetchUserSets,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.LOCATION],
    defaultErrorMessage: "Error fetching user sets",
  });

  const {
    userObjects: userCreatures,
    userFetchStatus: userCreaturesFetchStatus,
    fetchUserObjects: fetchUserCreatures,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.CREATURE],
    defaultErrorMessage: "Error fetching user creatures",
  });

  const {
    userObjects: userImagePlanes,
    userFetchStatus: userImagePlanesFetchStatus,
    fetchUserObjects: fetchUserImagePlanes,
  } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.IMAGE_PLANE],
    defaultErrorMessage: "Error fetching user image planes",
  });

  const {
    featuredObjects: featuredCharacters,
    featuredFetchStatus: featuredCharactersFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.CHARACTER],
    filterMediaTypes: [FilterMediaType.GLB],
    defaultErrorMessage: "Error fetching featured characters",
  });

  const {
    featuredObjects: featuredObjects,
    featuredFetchStatus: featuredObjectsFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.OBJECT],
    defaultErrorMessage: "Error fetching featured objects",
  });

  const {
    featuredObjects: featuredSets,
    featuredFetchStatus: featuredSetsFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.LOCATION],
    defaultErrorMessage: "Error fetching featured sets",
  });

  const {
    featuredObjects: featuredCreatures,
    featuredFetchStatus: featuredCreaturesFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.CREATURE],
    defaultErrorMessage: "Error fetching featured creatures",
  });

  const {
    featuredObjects: featuredImagePlanes,
    featuredFetchStatus: featuredImagePlanesFetchStatus,
  } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.IMAGE_PLANE],
    defaultErrorMessage: "Error fetching featured image planes",
  });

  const isFetching = isAnyStatusFetching([
    userCharactersFetchStatus,
    userObjectsFetchStatus,
    userSetsFetchStatus,
    userCreaturesFetchStatus,
    userImagePlanesFetchStatus,
    featuredCharactersFetchStatus,
    featuredObjectsFetchStatus,
    featuredSetsFetchStatus,
    featuredCreaturesFetchStatus,
    featuredImagePlanesFetchStatus,
  ]);

  // const libraryTabs = [
  //   { id: "library", label: "Library" },
  //   { id: "mine", label: "Mine" },
  // ];

  const assetTabs = useMemo<AssetTab[]>(
    () => [
      { id: "all", label: "All", icon: faLayerGroup, items: [] },
      {
        id: "character",
        label: "Characters",
        labelSingle: "Character",
        icon: faUser,
        engineCategory: FilterEngineCategories.CHARACTER,
        items:
          activeLibraryTab === "library"
            ? [...demoCharacterItems.value, ...(featuredCharacters ?? [])]
            : (userCharacters ?? []),
      },
      {
        id: "objects",
        label: "Objects",
        labelSingle: "Object",
        icon: faCube,
        engineCategory: FilterEngineCategories.OBJECT,
        items:
          activeLibraryTab === "library"
            ? [...demoShapeItems.value, ...(featuredObjects ?? [])]
            : (userObjects ?? []),
      },
      {
        id: "memes",
        label: "Memes",
        labelSingle: "Meme",
        icon: faFaceGrinStars,
        engineCategory: FilterEngineCategories.CHARACTER,
        items: activeLibraryTab === "library" ? demoMemeItems.value : [],
      },
      {
        id: "sets",
        label: "Sets",
        labelSingle: "Set",
        icon: faMountainCity,
        engineCategory: FilterEngineCategories.LOCATION,
        items:
          activeLibraryTab === "library"
            ? (featuredSets ?? [])
            : (userSets ?? []),
      },
      {
        id: "creatures",
        label: "Creatures",
        labelSingle: "Creature",
        icon: faDog,
        engineCategory: FilterEngineCategories.CREATURE,
        items:
          activeLibraryTab === "library"
            ? (featuredCreatures ?? [])
            : (userCreatures ?? []),
      },
      {
        id: "skybox",
        label: "Skybox",
        labelSingle: "Skybox",
        icon: faSun,
        items: activeLibraryTab === "library" ? demoSkyboxItems.value : [],
      },
      // {
      //   id: "image-planes",
      //   label: "Image Planes",
      //   labelSingle: "Image Plane",
      //   icon: faImage,
      //   engineCategory: FilterEngineCategories.IMAGE_PLANE,
      //   items:
      //     activeLibraryTab === "library"
      //       ? (featuredImagePlanes ?? [])
      //       : (userImagePlanes ?? []),
      // },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeLibraryTab,
      demoCharacterItems.value,
      demoShapeItems.value,
      demoSkyboxItems.value,
      demoMemeItems.value,
      featuredCharacters,
      featuredCreatures,
      featuredObjects,
      featuredSets,
      featuredImagePlanes,
      userCharacters,
      userCreatures,
      userObjects,
      userSets,
      userImagePlanes,
    ],
  );

  // Combine all items for the "All" tab
  const allItems = useMemo(() => {
    const items = assetTabs
      .filter((tab) => tab.id !== "all")
      .flatMap((tab) => tab.items);
    // console.log("All items:", items);
    // console.log("Active library tab:", activeLibraryTab);
    // console.log("User creatures:", userCreatures);
    // console.log("User objects:", userObjects);
    return items;
  }, [assetTabs]);

  // Update the items array for the "All" tab
  assetTabs[0].items = allItems;

  const currentTab =
    assetTabs.find((tab) => tab.id === activeAssetTab) || assetTabs[0];

  // Filter items based on search term
  const displayedItems = useMemo(() => {
    if (!searchTerm) {
      return currentTab.items;
    }

    const searchLower = searchTerm.toLowerCase();
    return currentTab.items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower),
    );
  }, [currentTab.items, searchTerm]);

  // Switch to "All" tab when searching
  useEffect(() => {
    if (searchTerm && activeAssetTab !== "all") {
      setActiveAssetTab("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Clear search term when tab changes
  useEffect(() => {
    setSearchTerm("");
  }, [activeAssetTab]);

  // Refresh user content when switching to mine tab
  useEffect(() => {
    if (activeLibraryTab === "mine") {
      // Trigger a refetch of user content
      fetchUserCharacters();
      fetchUserObjects();
      fetchUserSets();
      fetchUserCreatures();
      fetchUserImagePlanes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLibraryTab]);

  const renderContent = () => {
    if (activeAssetTab === "all" && !searchTerm) {
      // Filter out empty categories when in "mine" tab
      const tabsToShow = assetTabs
        .slice(1)
        .filter(
          (tab) => activeLibraryTab === "library" || tab.items.length > 0,
        );

      return (
        <div className="h-full space-y-2 overflow-y-auto">
          {tabsToShow.map((tab) => (
            <AllTabSection
              key={tab.id}
              label={tab.label}
              items={tab.items}
              onViewAll={() => setActiveAssetTab(tab.id)}
            />
          ))}
        </div>
      );
    }

    return (
      <ItemElements
        items={displayedItems}
        busy={isFetching}
        debug={`asset-modal-${currentTab.id}`}
      />
    );
  };

  // const handleAddAsset = () => {
  //   handleClose();
  //   setIsUploadModalOpen(true);
  //   setSelectedCategory(null);
  //   setIsSelectVisible(true);
  // };

  // const handleAddSpecificAsset = (category: FilterEngineCategories) => {
  //   handleClose();
  //   setIsUploadModalOpen(true);
  //   setSelectedCategory(category);
  //   setIsSelectVisible(false);
  // };

  const handleUploadSuccess = (category: FilterEngineCategories) => {
    if (reopenAfterDragSignal.value) {
      // Small delay to allow the modal to close and reopen
      setTimeout(() => {
        handleClose();
      }, 100);
    } else {
      handleClose();
    }

    // Use the provided category to find the AssetTab ID
    const lastUploadedTabId = categoryToTabIdMap[category] || "all";

    // Close the upload modal
    setTimeout(() => {
      sessionStorage.setItem("lastUploadedTab", lastUploadedTabId);
      console.log("AssetModal: lastUploadedTabId set to:", lastUploadedTabId);
      setIsUploadModalOpen(false);
      handleOpen();
    }, 300);

    fetchUserCharacters();
    fetchUserObjects();
    fetchUserSets();
    fetchUserCreatures();
    fetchUserImagePlanes();
  };

  const clearSearch = () => setSearchTerm("");

  const getArticle = (word: string | undefined) => {
    if (!word) return "a";
    return /^[aeiou]/i.test(word) ? "an" : "a";
  };

  return (
    <>
      <Modal
        isOpen={assetModalVisible.value && assetModalVisibleDuringDrag.value}
        onClose={handleClose}
        className="relative h-[640px] max-w-4xl"
        childPadding={false}
        showClose={false}
        backdropClassName="bg-transparent"
        draggable={true}
        closeOnOutsideClick={false}
        allowBackgroundInteraction={true}
        // initialPosition={{
        //   x: 100,
        //   y: typeof window !== "undefined" ? (window.innerHeight - 640) / 2 : 0,
        // }}
      >
        <Modal.DragHandle>
          <div className="absolute left-0 top-0 z-[50] h-[46px] w-full cursor-move" />
        </Modal.DragHandle>
        <div className="grid h-full grid-cols-12 gap-3">
          <div className="relative col-span-3 flex h-full flex-col p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:bg-white/10">
            <div className="flex items-center justify-between gap-2.5 py-0.5">
              <h2 className="text-[18px] font-semibold opacity-80">
                ArtCraft Presets
              </h2>
              {/* <Tooltip content="Upload model" position="top" delay={200}>
                <Button
                  className="flex h-7 w-7 items-center justify-center rounded-md border-none bg-primary/50 text-white/70 transition-colors hover:bg-primary/70 hover:text-white/100"
                  onClick={handleAddAsset}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-lg" />
                </Button>
              </Tooltip> */}
            </div>
            <hr className="my-2 w-full border-white/10" />
            <div className="flex h-full flex-col space-y-2">
              {/* <Button
                variant="primary"
                className={twMerge(
                  "w-full justify-start rounded-xl border border-white/[2%] bg-white/[4%] px-3.5 py-2.5 text-left hover:bg-white/15",
                  "border-primary bg-primary/70 hover:bg-primary",
                )}
                onClick={handleAddAsset}
              >
                <FontAwesomeIcon
                  icon={faUpFromLine}
                  className="mr-2 text-lg opacity-70"
                />
                Upload an asset
              </Button> */}
              {assetTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeAssetTab === tab.id ? "primary" : "secondary"}
                  className={twMerge(
                    "w-full justify-start rounded-xl border border-white/[2%] bg-white/[4%] px-3.5 py-2.5 text-left hover:bg-white/15",
                    activeAssetTab === tab.id &&
                      "border-primary bg-primary/10 hover:bg-primary/10",
                  )}
                  onClick={() => setActiveAssetTab(tab.id)}
                >
                  <FontAwesomeIcon
                    icon={tab.icon}
                    className="mr-2 opacity-70"
                  />
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 pt-3">
              <div
                className="flex cursor-pointer items-center"
                onClick={(e) => {
                  // Prevent double-firing when clicking the checkbox itself
                  if (e.target instanceof HTMLInputElement) return;
                  const checkbox = document.getElementById(
                    "reopen-after-add",
                  ) as HTMLInputElement;
                  if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    reopenAfterDragSignal.value = checkbox.checked;
                  }
                }}
              >
                <input
                  type="checkbox"
                  id="reopen-after-add"
                  checked={reopenAfterDragSignal.value}
                  onChange={handleReopenChange}
                  className="h-4 w-4 cursor-pointer rounded-lg border-gray-300 bg-gray-700 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="reopen-after-add"
                  className="ml-2 cursor-pointer select-none text-sm text-white/70"
                >
                  Reopen after adding
                </label>
              </div>
            </div>
          </div>
          <div className="col-span-9 p-3 pb-0 ps-0 pt-2">
            <div className="flex h-full flex-col">
              <div className="h-full">
                <div className="flex items-center gap-4">
                  {/* <TabSelector
                    tabs={libraryTabs}
                    activeTab={activeLibraryTab}
                    onTabChange={setActiveLibraryTab}
                    className="relative z-[51] w-auto"
                  /> */}
                  <div className="relative grow">
                    <Input
                      ref={searchInputRef}
                      placeholder="Search"
                      className="relative z-[51] grow"
                      inputClassName="pr-2.5"
                      icon={faSearch}
                      value={searchTerm}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSearchTerm(e.target.value)
                      }
                      iconClassName="text-white/60"
                    />
                    {searchTerm && (
                      <CloseButton
                        onClick={clearSearch}
                        className="absolute right-2.5 top-1/2 z-[51] h-4 w-4 -translate-y-1/2 bg-white/10 text-[10px] hover:bg-white/20"
                      />
                    )}
                  </div>
                  <CloseButton
                    onClick={handleClose}
                    className="relative z-[51]"
                  />
                </div>
                <div
                  className={twMerge(
                    "overflow-auto-y mt-4 h-[574px]",
                    activeAssetTab !== "all" && "h-[552px]",
                  )}
                >
                  {activeAssetTab !== "all" && !searchTerm && (
                    <div className="mb-2 flex items-center justify-between font-semibold">
                      <div className="flex items-center">
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2 border-none bg-transparent px-3 py-1.5 text-sm text-white/70 hover:bg-transparent hover:text-white/100"
                          onClick={() => setActiveAssetTab("all")}
                        >
                          <FontAwesomeIcon
                            icon={faChevronLeft}
                            className="text-sm font-semibold opacity-70"
                          />
                        </Button>
                        {currentTab.label}
                      </div>
                      {/* {activeAssetTab !== "skybox" &&
                        activeAssetTab !== "all" && (
                          <Button
                            icon={faUpFromLine}
                            onClick={() =>
                              handleAddSpecificAsset(
                                currentTab.engineCategory ||
                                  FilterEngineCategories.OBJECT,
                              )
                            }
                            className="border-primary bg-primary/70 px-2 py-1 text-xs transition-colors hover:bg-primary"
                          >
                            Upload {getArticle(currentTab.labelSingle)}{" "}
                            {currentTab.labelSingle}
                          </Button>
                        )} */}
                    </div>
                  )}
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <UploadModal3D
        onClose={() => {
          setIsUploadModalOpen(false);
        }}
        onSuccess={(category) => handleUploadSuccess(category)}
        isOpen={isUploadModalOpen}
        title={`Upload ${selectedCategory ? (selectedCategory.toLowerCase().replace(/_/g, " ") === "location" ? "sets" : selectedCategory.toLowerCase().replace(/_/g, " ")) : "3D Asset"}`}
        titleIcon={!isSelectVisible ? currentTab.icon : faUpFromLine}
        preselectedCategory={selectedCategory || FilterEngineCategories.OBJECT}
        isSelectVisible={isSelectVisible}
      />
    </>
  );
};
