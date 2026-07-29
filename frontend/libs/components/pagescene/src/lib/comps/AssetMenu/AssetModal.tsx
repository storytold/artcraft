import { Checkbox } from "@storyteller/ui-checkbox";
import { Modal } from "@storyteller/ui-modal";
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
import React, {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { twMerge } from "tailwind-merge";

import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { ItemElements } from "./shared/ItemElements";
import { useUserObjects, useFeaturedObjects } from "./hooks";
import { isAnyStatusFetching } from "./utilities/misc";
import { FilterEngineCategories, FilterMediaType } from "../../enums";
import {
  demoSkyboxItems,
  demoShapeItems,
  demoCharacterItems,
  demoMemeItems,
} from "../../signals/demoAssets";
import { usePageSceneStore } from "../../PageSceneStore";
import type { MediaItem } from "../../models/assets";

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

// Mapping from upload category to AssetTab id, so the modal can
// auto-switch the user to the tab matching what they just uploaded.
const categoryToTabIdMap: Partial<Record<FilterEngineCategories, string>> = {
  [FilterEngineCategories.CHARACTER]: "characters",
  [FilterEngineCategories.CREATURE]: "creatures",
  [FilterEngineCategories.IMAGE_PLANE]: "image-planes",
  [FilterEngineCategories.LOCATION]: "sets",
  [FilterEngineCategories.OBJECT]: "objects",
  [FilterEngineCategories.SKYBOX]: "skybox",
};

const CHARACTER_PRIORITY_ORDER = [
  "storyboy",
  "story girl",
  "knight",
  "news anchor",
];
const MEME_OVERRIDES = ["ai trump"];

export const AssetModal = () => {
  const editor = useContext(EngineContext);

  const {
    assetModalVisible,
    assetDraggingUnder,
    reopenAfterDrag,
    setAssetModalVisible,
    setReopenAfterDrag,
  } = usePageSceneStore(
    useShallow((s) => ({
      assetModalVisible: s.assetModalVisible,
      assetDraggingUnder: s.assetDraggingUnder,
      reopenAfterDrag: s.reopenAfterDrag,
      setAssetModalVisible: s.setAssetModalVisible,
      setReopenAfterDrag: s.setReopenAfterDrag,
    })),
  );
  const [activeLibraryTab] = useState("library");
  const [activeAssetTab, setActiveAssetTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleReopenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setTimeout(() => {
      setReopenAfterDrag(newValue);
    }, 0);
  };

  const handleClose = () => {
    setAssetModalVisible(false);
  };

  const handleOpen = () => {
    setAssetModalVisible(true);
  };

  useEffect(() => {
    if (assetModalVisible) {
      // Whenever the modal becomes visible, clear any leftover drag-under state.
      // A reopen-off drag closes the panel while keeping `assetDraggingUnder`
      // true (so its fade-out doesn't flash), so without this a later reopen
      // would render straight back into the hidden state. Resetting here is the
      // single safety net covering every open path (toolbar +, asset menu,
      // upload-reopen). It can't clobber an active drag: `assetModalVisible`
      // doesn't change mid-drag, so this effect doesn't re-run then.
      usePageSceneStore.getState().setAssetDraggingUnder(false);

      const lastUploadedTab = sessionStorage.getItem("lastUploadedTab");
      if (lastUploadedTab) {
        setActiveAssetTab(lastUploadedTab);
        sessionStorage.removeItem("lastUploadedTab");
        sessionStorage.removeItem("lastUploadedCategory");
      }
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetModalVisible]);

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

  const assetTabs = useMemo<AssetTab[]>(() => {
    const allCharacterCandidates =
      activeLibraryTab === "library"
        ? [...demoCharacterItems, ...(featuredCharacters ?? [])]
        : (userCharacters ?? []);

    const memeOverrideItems = allCharacterCandidates.filter((item) =>
      MEME_OVERRIDES.includes(item.name?.toLowerCase() ?? ""),
    );
    const characterCandidates = allCharacterCandidates.filter(
      (item) => !MEME_OVERRIDES.includes(item.name?.toLowerCase() ?? ""),
    );

    const priorityCharacters: MediaItem[] = [];
    for (const name of CHARACTER_PRIORITY_ORDER) {
      const found = characterCandidates.find(
        (item) => item.name?.toLowerCase() === name,
      );
      if (found) priorityCharacters.push(found);
    }
    const remainingCharacters = characterCandidates.filter(
      (item) =>
        !CHARACTER_PRIORITY_ORDER.includes(item.name?.toLowerCase() ?? ""),
    );
    const orderedCharacters = [...priorityCharacters, ...remainingCharacters];

    return [
      { id: "all", label: "All", icon: faLayerGroup, items: [] },
      {
        id: "character",
        label: "Characters",
        labelSingle: "Character",
        icon: faUser,
        engineCategory: FilterEngineCategories.CHARACTER,
        items: orderedCharacters,
      },
      {
        id: "objects",
        label: "Objects",
        labelSingle: "Object",
        icon: faCube,
        engineCategory: FilterEngineCategories.OBJECT,
        items:
          activeLibraryTab === "library"
            ? [...demoShapeItems, ...(featuredObjects ?? [])]
            : (userObjects ?? []),
      },
      {
        id: "memes",
        label: "Memes",
        labelSingle: "Meme",
        icon: faFaceGrinStars,
        engineCategory: FilterEngineCategories.CHARACTER,
        items:
          activeLibraryTab === "library"
            ? [...demoMemeItems, ...memeOverrideItems]
            : [],
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
        items: activeLibraryTab === "library" ? demoSkyboxItems : [],
      },
    ];
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeLibraryTab,
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

  const allItems = useMemo(() => {
    return assetTabs
      .filter((tab) => tab.id !== "all")
      .flatMap((tab) => tab.items);
  }, [assetTabs]);

  assetTabs[0].items = allItems;

  const currentTab =
    assetTabs.find((tab) => tab.id === activeAssetTab) || assetTabs[0];

  const displayedItems = useMemo(() => {
    if (!searchTerm) return currentTab.items;
    const searchLower = searchTerm.toLowerCase();
    return currentTab.items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower),
    );
  }, [currentTab.items, searchTerm]);

  useEffect(() => {
    if (searchTerm && activeAssetTab !== "all") {
      setActiveAssetTab("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [activeAssetTab]);

  useEffect(() => {
    if (activeLibraryTab === "mine") {
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

  const handleUploadSuccess = (category: FilterEngineCategories) => {
    if (reopenAfterDrag) {
      setTimeout(() => handleClose(), 100);
    } else {
      handleClose();
    }
    const lastUploadedTabId = categoryToTabIdMap[category] || "all";
    setTimeout(() => {
      sessionStorage.setItem("lastUploadedTab", lastUploadedTabId);
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

  return (
    <>
      <Modal
        isOpen={assetModalVisible}
        onClose={handleClose}
        className="relative h-[640px] max-w-4xl"
        childPadding={false}
        showClose={false}
        backdropClassName="bg-transparent"
        draggable={true}
        closeOnOutsideClick={false}
        allowBackgroundInteraction={true}
        // While dragging an asset out, the panel becomes pointer-transparent so
        // the drag passes under it onto the canvas. With "Reopen after adding"
        // on it steps back to translucent; with it off it eases all the way out
        // (closing after the drop). Same drag-under behavior as the gallery.
        contentInteractive={!assetDraggingUnder}
        contentDimmed={assetDraggingUnder && reopenAfterDrag}
        contentHidden={assetDraggingUnder && !reopenAfterDrag}
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
            </div>
            <hr className="my-2 w-full border-white/10" />
            <div className="flex h-full flex-col space-y-2">
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
              <Checkbox
                id="reopen-after-add"
                checked={reopenAfterDrag}
                onChange={handleReopenChange}
                label="Reopen after adding"
              />
            </div>
          </div>
          <div className="col-span-9 p-3 pb-0 ps-0 pt-2">
            <div className="flex h-full flex-col">
              <div className="h-full">
                <div className="flex items-center gap-4">
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
                    </div>
                  )}
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* Host-rendered upload modal — wired through the adapter slot. */}
      {editor &&
        editor.adapter.renderAssetUploader({
          isOpen: isUploadModalOpen,
          onClose: () => setIsUploadModalOpen(false),
          onSuccess: handleUploadSuccess,
          title: "Upload 3D Asset",
          titleIcon: faUpFromLine,
        })}
    </>
  );
};
