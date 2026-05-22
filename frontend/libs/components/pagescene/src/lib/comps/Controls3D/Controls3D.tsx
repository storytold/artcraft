import { useContext, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useSignals } from "@preact/signals-react/runtime";
import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faGlobe,
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
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { twMerge } from "tailwind-merge";

import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { setTransformMode } from "../../actions";
import { usePageSceneStore, type TransformMode } from "../../PageSceneStore";
import { AssetModal } from "../AssetMenu";

export interface Controls3DProps {
  /** Show the magic-wand "Create 3D model from image" shortcut next
   *  to the add-asset button. */
  showImageTo3DButton?: boolean;
}

export const Controls3D = ({
  showImageTo3DButton = true,
}: Controls3DProps = {}) => {
  useSignals();
  const editor = useContext(EngineContext);
  const {
    assetModalVisible,
    setAssetModalVisible,
    setAssetModalVisibleDuringDrag,
    selectedMode,
    transformSpace,
    currentUserToken,
    hostOverlayVisible,
  } = usePageSceneStore(
    useShallow((s) => ({
      assetModalVisible: s.assetModalVisible,
      setAssetModalVisible: s.setAssetModalVisible,
      setAssetModalVisibleDuringDrag: s.setAssetModalVisibleDuringDrag,
      selectedMode: s.selectedMode,
      transformSpace: s.transformSpace,
      currentUserToken: s.currentUserToken,
      hostOverlayVisible: s.hostOverlayVisible,
    })),
  );
  const [showEmptySceneTooltip, setShowEmptySceneTooltip] = useState(false);
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
      !uploadSplatIsShowing &&
      !hostOverlayVisible;

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
    hostOverlayVisible,
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
    const requiresAuth =
      action === "library" ||
      action === "upload-3d" ||
      action === "upload-image" ||
      action === "upload-splat";
    if (requiresAuth && !currentUserToken && editor?.adapter.promptSignup) {
      editor.adapter.promptSignup(action);
      return;
    }
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
      <div className="flex justify-center pt-3">
        <div className="glass rounded-2xl p-1.5 text-white shadow-xl h-fit">
          <div className="flex items-center justify-center gap-1.5">
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
                    buttonClassName={`h-9 w-9 rounded-xl text-lg ${
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
              {showImageTo3DButton && (
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
              )}
            </div>

            <span className="opacity-10">|</span>
            <ButtonIconSelect
              options={modes}
              onOptionChange={handleModeChange}
              selectedOption={selectedMode}
            />
            <span className="opacity-10">|</span>
            {selectedMode === "scale" ? (
              <Tooltip
                content="Scale is always in local space"
                position="bottom"
                delay={300}
              >
                <button
                  disabled
                  className="flex min-w-[92px] cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-base-fg opacity-40 transition-colors duration-150"
                >
                  <FontAwesomeIcon
                    icon={faCube}
                    className="h-3 w-3 text-base-fg/60"
                  />
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
                  className="flex min-w-[92px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-base-fg transition-colors duration-150 hover:bg-white/[0.08]"
                  onClick={() => editor?.gizmo.toggleTransformSpace()}
                >
                  <FontAwesomeIcon
                    icon={transformSpace === "world" ? faGlobe : faCube}
                    className="h-3 w-3 text-base-fg/60"
                  />
                  {transformSpace === "world" ? "World" : "Local"}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <AssetModal />

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
