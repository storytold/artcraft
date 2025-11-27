import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faMagicWandSparkles,
  faPlus,
  faUpRightAndDownLeftFromCenter,
  faCube,
  faImages,
  faArrowUpFromBracket,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { EngineContext } from "../../contexts/EngineContext";
import { useContext, useEffect, useState } from "react";
import { assetModalVisibleDuringDrag, assetModalVisible } from "../../signals";
import { useTabStore } from "~/pages/Stores/TabState";
// import { v4 as uuidv4 } from "uuid";
// import { addObject } from "../../signals/objectGroup/addObject";
// import { MediaItem } from "../../models/assets";
// eslint-disable-next-line import/no-unresolved
// import { AssetType } from "~/enums";
import { AssetModal } from "../AssetMenu/AssetModal";
import { selectedMode } from "../../signals/selectedMode";
import { useSignals } from "@preact/signals-react/runtime";
import { outlinerState } from "../../signals/outliner/outliner";
// eslint-disable-next-line import/no-unresolved
import { setLogoutStates } from "~/signals/authentication/utilities";
import { UploadModal3D } from "../../../../components/reusable/UploadModal3D/UploadModal3D";
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { twMerge } from "tailwind-merge";
import { UploadModalImage } from "../../../../components/reusable/UploadModalImage";

export const Controls3D = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const [showEmptySceneTooltip, setShowEmptySceneTooltip] = useState(false);
  // Action reminder is now handled through signals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [upload3DIsShowing, setUpload3DIsShowing] = useState(false);
  const [isAddAssetPopoverOpen, setIsAddAssetPopoverOpen] = useState(false);
  const [uploadImageIsShowing, setUploadImageIsShowing] = useState(false);


  useEffect(() => {
    // Check if scene is empty and onboarding helper is not visible
    const checkSceneEmpty = () => {
      const isSceneEmpty =
        outlinerState.items.value.length === 0 &&
        !assetModalVisible.value &&
        !galleryModalVisibleViewMode.value &&
        !isAddAssetPopoverOpen &&
        !upload3DIsShowing &&
        !uploadImageIsShowing;

      setShowEmptySceneTooltip(isSceneEmpty);
    };

    // Initial check
    checkSceneEmpty();

    // Subscribe to outliner state changes
    const unsubscribe = outlinerState.items.subscribe(checkSceneEmpty);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    assetModalVisible.value,
    galleryModalVisibleViewMode.value,
    isAddAssetPopoverOpen,
    upload3DIsShowing,
    uploadImageIsShowing,
  ]);

  const handleModeChange = (value: string) => {
    selectedMode.value = value;
    switch (value) {
      case "move":
        handleMoveArrows();
        break;
      case "rotate":
        handleRotateArrows();
        break;
      case "scale":
        handleZoomArrows();
        break;
      default:
        console.log("Unknown option");
    }
  };

  const handleMoveArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("translate");
  };
  const handleRotateArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("rotate");
  };
  const handleZoomArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("scale");
  };

  // ----- TODO LATER - BFlat for auto add 3d model to scene -----

  // Function to add the generated 3D model to the scene
  // const addGeneratedModelToScene = useCallback((mediaToken: string) => {
  //   console.log("[DEBUG] addGeneratedModelToScene called with token:", mediaToken);

  //   // Create a MediaItem object for the 3D model
  //   const mediaItem: MediaItem = {
  //     version: 1,
  //     type: AssetType.OBJECT,
  //     media_id: mediaToken,
  //     name: "3D Model",
  //     object_uuid: uuidv4(),
  //   };

  //   // Add the object to the scene
  //   console.log("[DEBUG] Calling addObject with:", mediaItem);
  //   try {
  //     addObject(mediaItem);
  //     console.log("[DEBUG] addObject called successfully");
  //   } catch (error) {
  //     console.error("[DEBUG] Error in addObject:", error);
  //   }
  // }, []);

  const handleOpenModal = () => {
    assetModalVisibleDuringDrag.value = true;
    assetModalVisible.value = true;
  };

  const handleOpenCreate3dModal = () => {
    useTabStore.getState().setActiveTab("IMAGE_TO_3D_OBJECT");
  };

  // Open global Gallery modal
  const handleOpenGalleryModal = () => {
    galleryModalVisibleViewMode.value = true;
    galleryModalVisibleDuringDrag.value = true;
  };

  const handleAddAssetAction = (action: string) => {
    switch (action) {
      case "presets":
        handleOpenModal();
        break;
      case "library":
        handleOpenGalleryModal();
        break;
      case "upload-3d":
        setUpload3DIsShowing(true);
        break;
      case "upload-image":
        setUploadImageIsShowing(true);
        break;
      default:
        break;
    }
  };

  const modes = [
    {
      value: "move",
      icon: faArrowsUpDownLeftRight,
      text: "Move",
      tooltip: "Move (T)",
    },
    {
      value: "rotate",
      icon: faArrowsRotate,
      text: "Rotate",
      tooltip: "Rotate (R)",
    },
    {
      value: "scale",
      icon: faUpRightAndDownLeftFromCenter,
      text: "Scale",
      tooltip: "Scale (G)",
    },
  ];

  return (
    <>
      <div className="flex justify-center">
        <div className="glass rounded-b-xl p-1.5 pr-2 text-white shadow-md">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                {showEmptySceneTooltip && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 transform whitespace-nowrap">
                    <div className="animate-bounce rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg">
                      Click + to add your first 3D asset!
                      <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform bg-primary" />
                    </div>
                  </div>
                )}
                <Tooltip
                  content="Add an asset to scene"
                  position="bottom"
                  delay={300}
                  closeOnClick
                  className={twMerge(
                    showEmptySceneTooltip ? "hidden" : "block",
                  )}
                >
                  <PopoverMenu
                    mode="button"
                    position="bottom"
                    panelTitle="Add an asset to scene"
                    onOpenChange={setIsAddAssetPopoverOpen}
                    items={[
                      {
                        label: "ArtCraft Presets (B)",
                        selected: false,
                        icon: (
                          <FontAwesomeIcon icon={faCube} className="h-4 w-4" />
                        ),
                        action: "presets",
                      },
                      {
                        label: "My Library",
                        selected: false,
                        icon: (
                          <FontAwesomeIcon
                            icon={faImages}
                            className="h-4 w-4"
                          />
                        ),
                        action: "library",
                        divider: true,
                      },
                      {
                        label: "Upload 3D Model",
                        selected: false,
                        icon: (
                          <FontAwesomeIcon
                            icon={faArrowUpFromBracket}
                            className="h-4 w-4"
                          />
                        ),
                        action: "upload-3d",
                      },
                      {
                        label: "Upload Image",
                        selected: false,
                        icon: (
                          <FontAwesomeIcon
                            icon={faArrowUpFromBracket}
                            className="h-4 w-4"
                          />
                        ),
                        action: "upload-image",
                      },
                    ]}
                    onPanelAction={handleAddAssetAction}
                    showIconsInList
                    buttonClassName={`h-9 w-9 rounded-[10px] text-lg ${
                      showEmptySceneTooltip
                        ? "bg-primary/90 hover:bg-primary/70"
                        : "border-transparent bg-primary/90 hover:bg-primary/70"
                    }`}
                    triggerIcon={
                      <FontAwesomeIcon icon={faPlus} className="text-xl" />
                    }
                  />
                </Tooltip>
              </div>
              <Tooltip
                content="Create 3D model from image"
                position="bottom"
                delay={300}
                closeOnClick
              >
                <Button
                  icon={faMagicWandSparkles}
                  className="text-md h-9 w-9 rounded-[10px] bg-white/15 transition-colors hover:bg-white/25"
                  variant="secondary"
                  onClick={handleOpenCreate3dModal}
                />
              </Tooltip>
            </div>

            <span className="opacity-20">|</span>
            <ButtonIconSelect
              options={modes}
              onOptionChange={handleModeChange}
              selectedOption={selectedMode.value}
            />
          </div>
        </div>
      </div>

      <AssetModal />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => setLogoutStates()}
        initialSection="accounts"
      />

      <UploadModal3D
        isOpen={upload3DIsShowing}
        onClose={() => setUpload3DIsShowing(false)}
        onSuccess={() => setUpload3DIsShowing(false)}
        title="Upload a 3D Model"
        titleIcon={faCube}
      />

      <UploadModalImage
        isOpen={uploadImageIsShowing}
        onClose={() => setUploadImageIsShowing(false)}
        onSuccess={() => setUploadImageIsShowing(false)}
        title="Upload an Image"
        titleIcon={faImages}
      />
    </>
  );
};
