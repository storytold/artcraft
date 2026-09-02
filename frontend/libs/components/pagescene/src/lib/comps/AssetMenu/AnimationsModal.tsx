import { Checkbox } from "@storyteller/ui-checkbox";
import { Modal } from "@storyteller/ui-modal";
import { ArrowUpFromLineIcon, FootprintsIcon, LayersIcon, SearchIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
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
import { useAnimationLibrary } from "./hooks";
import { isAnyStatusFetching } from "./utilities/misc";
import { FilterEngineCategories } from "../../enums";
import { usePageSceneStore } from "../../PageSceneStore";
import type { MediaItem } from "../../models/assets";

type AnimationsTabId = "all" | "presets" | "uploaded";

type AnimationsTab = {
  id: AnimationsTabId;
  label: string;
  icon: typeof LayersIcon;
  items: MediaItem[];
};

// Standalone animations-only library, opened from the "Add Animation" button
// next to "Enter Pose Mode" (see PoseModeSelector). A slimmed-down sibling of
// AssetModal: same floating draggable panel, same drag-under behavior, same
// ItemElements grid (cards click-add to the selected character and
// pointer-drag onto characters/timeline rows via DndAsset), but only
// animations, split into All / Presets / Uploaded tabs.
export const AnimationsModal = () => {
  const editor = useContext(EngineContext);

  const {
    animationsModalVisible,
    assetDraggingUnder,
    reopenAfterDrag,
    currentUserToken,
    setAnimationsModalVisible,
    setReopenAfterDrag,
  } = usePageSceneStore(
    useShallow((s) => ({
      animationsModalVisible: s.animationsModalVisible,
      assetDraggingUnder: s.assetDraggingUnder,
      reopenAfterDrag: s.reopenAfterDrag,
      currentUserToken: s.currentUserToken,
      setAnimationsModalVisible: s.setAnimationsModalVisible,
      setReopenAfterDrag: s.setReopenAfterDrag,
    })),
  );
  const [activeTab, setActiveTab] = useState<AnimationsTabId>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    userAnimations,
    defaultAnimations,
    allAnimations,
    fetchUserAnimations,
    loadMoreUserAnimations,
    hasMoreUserAnimations,
    fetchStatuses,
  } = useAnimationLibrary();

  const handleReopenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setTimeout(() => {
      setReopenAfterDrag(newValue);
    }, 0);
  };

  const handleClose = () => {
    setAnimationsModalVisible(false);
  };

  const handleOpenUpload = () => {
    // Same auth gate as the Controls3D upload entries — anonymous
    // visitors get the signup CTA instead of the uploader.
    if (!currentUserToken && editor?.adapter.promptSignup) {
      editor.adapter.promptSignup("upload-3d");
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (category: FilterEngineCategories) => {
    setIsUploadModalOpen(false);
    fetchUserAnimations();
    // Land the user on their new clip. The uploader is preselected to
    // Animation here, but the category toggles stay user-editable — only
    // jump to Uploaded when the upload actually was an animation.
    if (category === FilterEngineCategories.ANIMATION) {
      setActiveTab("uploaded");
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (animationsModalVisible) {
      // Clear leftover drag-under state on every open (same safety net as
      // AssetModal: a reopen-off drag closes the panel while keeping
      // assetDraggingUnder true so its fade-out doesn't flash).
      usePageSceneStore.getState().setAssetDraggingUnder(false);

      // Pick up animations the user uploaded since the last open (silent
      // for anonymous users — see the hook's suppressErrorToast).
      fetchUserAnimations();

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationsModalVisible]);

  const tabs = useMemo<AnimationsTab[]>(
    () => [
      { id: "all", label: "All", icon: LayersIcon, items: allAnimations },
      {
        id: "presets",
        label: "Presets",
        icon: FootprintsIcon,
        items: defaultAnimations,
      },
      {
        id: "uploaded",
        label: "Uploaded",
        icon: ArrowUpFromLineIcon,
        items: userAnimations,
      },
    ],
    [allAnimations, defaultAnimations, userAnimations],
  );

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

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
    setSearchTerm("");
  }, [activeTab]);

  const isFetching = isAnyStatusFetching(fetchStatuses);
  const clearSearch = () => setSearchTerm("");

  const renderContent = () => {
    if (
      activeTab === "uploaded" &&
      userAnimations.length === 0 &&
      !isFetching
    ) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-white/70">No uploaded animations yet.</p>
          <p className="text-xs text-white/40">
            Upload a Mixamo GLB or FBX to add your own clips.
          </p>
          <Button
            variant="primary"
            icon={ArrowUpFromLineIcon}
            className="mt-3"
            onClick={handleOpenUpload}
          >
            Upload animation
          </Button>
        </div>
      );
    }
    return (
      /* Uploaded tab pages through the user's library (the API caps a page
         at 100); scroll near the bottom loads the next page. Presets stay a
         single curated page. */
      <ItemElements
        items={displayedItems}
        busy={isFetching}
        debug={`animations-modal-${currentTab.id}`}
        hasMore={currentTab.id === "uploaded" ? hasMoreUserAnimations : undefined}
        onLoadMore={
          currentTab.id === "uploaded" ? loadMoreUserAnimations : undefined
        }
      />
    );
  };

  return (
    <>
      <Modal
        isOpen={animationsModalVisible}
        onClose={handleClose}
        className="relative h-[640px] max-w-4xl"
        childPadding={false}
        showClose={false}
        backdropClassName="bg-transparent"
        draggable={true}
        closeOnOutsideClick={false}
        allowBackgroundInteraction={true}
        // Same drag-under behavior as AssetModal: pointer-transparent while an
        // asset is dragged out, translucent with "Reopen after adding" on,
        // eased out entirely with it off (closing after the drop).
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
              <h2 className="text-base font-semibold opacity-80">
                Animations
              </h2>
            </div>
            <hr className="my-2 w-full border-white/15" />
            <div className="flex h-full flex-col space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "primary" : "secondary"}
                  className={twMerge(
                    "w-full justify-start rounded-[3px] border border-white/[2%] bg-white/[4%] px-3.5 py-2.5 text-left hover:bg-white/15",
                    activeTab === tab.id &&
                      "border-primary bg-primary/10 hover:bg-primary/10",
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <DynamicIcon
                    icon={tab.icon}
                    className="mr-2 opacity-70"
                  />
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-3">
              <Button
                variant="secondary"
                icon={ArrowUpFromLineIcon}
                iconClassName="opacity-70"
                className="w-full justify-center rounded-[3px] border border-white/15 bg-white/[6%] px-3.5 py-2.5 hover:bg-white/15"
                onClick={handleOpenUpload}
              >
                Upload animation
              </Button>
              <Checkbox
                id="animations-reopen-after-add"
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
                      placeholder="Search animations"
                      className="relative z-[51] grow"
                      inputClassName="pr-2.5"
                      icon={SearchIcon}
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
                <div className="overflow-auto-y mt-4 h-[574px]">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* Host-rendered upload modal — the same adapter slot AssetModal uses,
        scoped to animations so "Upload as Animation" comes preselected and
        My Library stays closed on success (this panel shows the result). */}
      {editor &&
        editor.adapter.renderAssetUploader({
          isOpen: isUploadModalOpen,
          onClose: () => setIsUploadModalOpen(false),
          onSuccess: handleUploadSuccess,
          title: "Upload Animation",
          titleIcon: ArrowUpFromLineIcon,
          initialCategory: "animation",
        })}
    </>
  );
};
