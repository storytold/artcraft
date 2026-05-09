import { useContext, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useSignals } from "@preact/signals-react/runtime";
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
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { twMerge } from "tailwind-merge";

import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { setTransformMode } from "../../actions";
import {
  usePageSceneStore,
  type TransformMode,
} from "../../PageSceneStore";
import { AssetModal } from "../AssetMenu";

export const Controls3D = () => {
  useSignals();
  const editor = useContext(EngineContext);
  const {
    assetModalVisible,
    setAssetModalVisible,
    setAssetModalVisibleDuringDrag,
    selectedMode,
    transformSpace,
  } = usePageSceneStore(
    useShallow((s) => ({
      assetModalVisible: s.assetModalVisible,
      setAssetModalVisible: s.setAssetModalVisible,
      setAssetModalVisibleDuringDrag: s.setAssetModalVisibleDuringDrag,
      selectedMode: s.selectedMode,
      transformSpace: s.transformSpace,
    })),
  );
  const [showEmptySceneTooltip, setShowEmptySceneTooltip] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [upload3DIsShowing, setUpload3DIsShowing] = useState(false);
  const [isAddAssetPopoverOpen, setIsAddAssetPopoverOpen] = useState(false);
  const [uploadImageIsShowing, setUploadImageIsShowing] = useState(false);
  const [uploadSplatIsShowing, setUploadSplatIsShowing] = useState(false);

  const outlinerItemCount = usePageSceneStore((s) => s.outlinerItems.length);

  useEffect(() => {
    const isSceneEmpty =
      outlinerItemCount === 0 &&
      !assetModalVisible &&
      !galleryModalVisibleViewMode.value &&
      !isAddAssetPopoverOpen &&
      !upload3DIsShowing &&
      !uploadImageIsShowing &&
      !uploadSplatIsShowing;

    setShowEmptySceneTooltip(isSceneEmpty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    outlinerItemCount,
    assetModalVisible,
    galleryModalVisibleViewMode.value,
    isAddAssetPopoverOpen,
    upload3DIsShowing,
    uploadImageIsShowing,
    uploadSplatIsShowing,
  ]);

  const handleModeChange = (value: string) => {
    if (!editor) return;
    if (value === "move" || value === "rotate" || value === "scale") {
      setTransformMode(editor, value as TransformMode);
    }
  };

  const handleOpenModal = () => {
    setAssetModalVisibleDuringDrag(true);
    setAssetModalVisible(true);
  };

  const handleOpenCreate3dModal = () => {
    editor?.adapter.navigateToImageTo3D();
  };

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
      case "upload-splat":
        setUploadSplatIsShowing(true);
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
                      {
                        label: "Upload Splat",
                        selected: false,
                        icon: (
                          <FontAwesomeIcon
                            icon={faArrowUpFromBracket}
                            className="h-4 w-4"
                          />
                        ),
                        action: "upload-splat",
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
              selectedOption={selectedMode}
            />
            {selectedMode === "scale" ? (
              <Tooltip
                content="Scale is always in local space"
                position="bottom"
                delay={300}
              >
                <button
                  disabled
                  className="h-9 rounded-[10px] px-2.5 text-[10px] font-semibold font-mono bg-white/15 uppercase tracking-wide opacity-40 cursor-not-allowed"
                >
                  Local
                </button>
              </Tooltip>
            ) : (
              <Tooltip
                content={`Transform space: ${transformSpace} (X to toggle)`}
                position="bottom"
                delay={300}
              >
                <button
                  className="h-9 rounded-[10px] px-2.5 text-[10px] font-semibold font-mono bg-white/15 hover:bg-white/25 transition-colors uppercase tracking-wide"
                  onClick={() => editor?.gizmo.toggleTransformSpace()}
                >
                  {transformSpace === "world" ? "World" : "Local"}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <AssetModal />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => editor?.adapter.performLogout()}
        initialSection="accounts"
      />

      {editor &&
        editor.adapter.renderAssetUploader({
          isOpen: upload3DIsShowing,
          onClose: () => setUpload3DIsShowing(false),
          onSuccess: () => setUpload3DIsShowing(false),
          title: "Upload a 3D Model",
          titleIcon: faCube,
        })}

      {editor &&
        editor.adapter.renderImageUploader({
          isOpen: uploadImageIsShowing,
          onClose: () => setUploadImageIsShowing(false),
          onSuccess: () => setUploadImageIsShowing(false),
          title: "Upload an Image",
          titleIcon: faImages,
        })}

      {editor &&
        editor.adapter.renderSplatUploader({
          isOpen: uploadSplatIsShowing,
          onClose: () => setUploadSplatIsShowing(false),
          onSuccess: () => setUploadSplatIsShowing(false),
          title: "Upload an spz file",
          titleIcon: faCube,
        })}
    </>
  );
};
