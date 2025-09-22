import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import {
  faCamera,
  faSave,
  faSparkles,
  faDownload,
  faSpinnerThird,
  faMessageCheck,
  faMessageXmark,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleWide,
  faRectangleVertical,
  faSquare,
  faRectangle,
  faTableCellsLarge,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  CameraAspectRatio,
  DomLevels,
  Camera,
  FocalLengthDragging,
  UploadImageArgs,
} from "@storyteller/common";
import { PromptsApi } from "@storyteller/api";
// import { SoundRegistry } from "@storyteller/soundboard";
import { toast } from "@storyteller/ui-toaster";
import { EngineApi } from "@storyteller/api";
import { CameraSettingsModal } from "@storyteller/ui-camera-settings-modal";
import { twMerge } from "tailwind-merge";
import { Modal } from "@storyteller/ui-modal";
import { Signal } from "@preact/signals-react";
import {
  CommandSuccessStatus,
  EnqueueContextualEditImage,
  EnqueueContextualEditImageModel,
  EnqueueContextualEditImageSize,
  // waitForSoraLogin,
} from "@storyteller/tauri-api";
// import { showActionReminder } from "@storyteller/ui-action-reminder-modal";
import { usePrompt3DStore } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { ImageModel } from "@storyteller/model-list";
import { ImagePromptRow } from "./ImagePromptRow";

interface PromptBox3DProps {
  cameras: Signal<Camera[]>;
  cameraAspectRatio: Signal<CameraAspectRatio>;
  disableHotkeyInput: (level: number) => void;
  enableHotkeyInput: (level: number) => void;
  gridVisibility: Signal<boolean>;
  setGridVisibility: (isVisible: boolean) => void;
  selectedCameraId: Signal<string>;
  deleteCamera: (id: string) => void;
  focalLengthDragging: Signal<FocalLengthDragging>;
  isPromptBoxFocused: Signal<boolean>;
  uploadImage: (arg: UploadImageArgs) => Promise<void>;
  handleCameraSelect: (item: PopoverItem) => void;
  handleAddCamera: () => void;
  handleCameraNameChange: (id: string, newName: string) => void;
  handleCameraFocalLengthChange: (id: string, value: number) => void;
  onAspectRatioSelect: (newRatio: CameraAspectRatio) => void;
  setEnginePrompt: (prompt: string) => void;
  selectedImageModel?: ImageModel;
  snapshotCurrentFrame:
    | ((shouldDownload?: boolean) => {
        base64Snapshot: string;
        file: File;
      } | null)
    | undefined;
}

export const PromptBox3D = ({
  cameras,
  cameraAspectRatio,
  disableHotkeyInput,
  enableHotkeyInput,
  gridVisibility,
  setGridVisibility,
  selectedCameraId,
  deleteCamera,
  focalLengthDragging,
  isPromptBoxFocused,
  uploadImage,
  handleCameraSelect,
  handleAddCamera,
  handleCameraNameChange,
  handleCameraFocalLengthChange,
  onAspectRatioSelect,
  setEnginePrompt,
  selectedImageModel,
  snapshotCurrentFrame,
}: PromptBox3DProps) => {
  useSignals();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prompt = usePrompt3DStore((s) => s.prompt);
  const setPrompt = usePrompt3DStore((s) => s.setPrompt);
  const useSystemPrompt = usePrompt3DStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePrompt3DStore((s) => s.setUseSystemPrompt);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const referenceImages = usePrompt3DStore((s) => s.referenceImages);
  const setReferenceImages = usePrompt3DStore((s) => s.setReferenceImages);
  const [showImagePrompts, setShowImagePrompts] = useState(false);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "3:2",
      selected: true,
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "2:3",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "1:1",
      selected: false,
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
  ]);
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
  const isImageRowVisible =
    showImagePrompts ||
    (selectedImageModel?.canUseImagePrompt && referenceImages.length > 0) ||
    false;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Update aspect ratio list based on the current cameraAspectRatio signal
  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected:
          (item.label === "16:9" &&
            cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9) ||
          (item.label === "3:2" &&
            cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_3_2) ||
          (item.label === "2:3" &&
            cameraAspectRatio.value === CameraAspectRatio.VERTICAL_2_3) ||
          (item.label === "1:1" &&
            cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAspectRatio.value]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );

    // Map the selected label to the corresponding CameraAspectRatio enum value
    let newRatio: CameraAspectRatio;
    switch (selectedItem.label) {
      case "16:9":
        newRatio = CameraAspectRatio.HORIZONTAL_16_9;
        break;
      case "3:2":
        newRatio = CameraAspectRatio.HORIZONTAL_3_2;
        break;
      case "2:3":
        newRatio = CameraAspectRatio.VERTICAL_2_3;
        break;
      case "1:1":
        newRatio = CameraAspectRatio.SQUARE_1_1;
        break;
      default:
        newRatio = CameraAspectRatio.HORIZONTAL_16_9;
    }

    onAspectRatioSelect(newRatio);
  };

  // ImagePromptRow will handle uploads and gallery internally

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next =
      value.slice(0, selectionStart) + pastedText + value.slice(selectionEnd);
    setPrompt(next);
    requestAnimationFrame(() => {
      const pos = selectionStart + pastedText.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    setPrompt(e.target.value);
  };

  const handleError = (errorMessage: string) => {
    setContent(errorMessage);
    setIsModalOpen(true);
  };

  const handleEnqueue = async () => {
    gtagEvent("enqueue_3d");
    const isDesktop = IsDesktopApp();
    console.log("Is Desktop?", isDesktop);
    if (isDesktop) {
      console.log("Desktop app - tauri enqueue");
      await handleTauriEnqueue();
    } else {
      console.log("Web app - web enqueue");
      await handleWebEnqueue();
    }
  };

  const handleWebEnqueue = async () => {
    if (!prompt.trim()) return;

    setIsEnqueueing(true);

    setEnginePrompt(prompt);

    //const engineApi = new EngineApi();
    const promptsApi = new PromptsApi();

    if (snapshotCurrentFrame) {
      const snapshot = snapshotCurrentFrame(false);

      if (snapshot) {
        const snapshotResult = await promptsApi.uploadSceneSnapshot({
          screenshot: snapshot.file,
          sceneMediaToken: "",
        });

        console.log("(web 3d) useSystemPrompt", useSystemPrompt);

        const response = await promptsApi.enqueueImageGeneration({
          disableSystemPrompt: !useSystemPrompt,
          prompt: prompt,
          snapshotMediaToken: snapshotResult.data || "",
          additionalImages: referenceImages.map((image) => image.mediaToken),
        });

        console.log("response", response);

        if (response.errorMessage) {
          handleError(response.errorMessage);
          setIsEnqueueing(false);
          return;
        }
      }

      try {
        // Here we would pass both the prompt and reference images to the generation
        console.log(
          "(3D.2) Enqueuing with prompt:",
          prompt,
          "and reference images:",
          referenceImages
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setIsEnqueueing(false);
        toast.success("Image added to queue");
      }
    }
    setIsEnqueueing(false);
  };

  // Helper to show Sora login reminder and wait for login
  // const handleSoraLoginReminder = async () => {
  //   return new Promise<void>((resolve) => {
  //     showActionReminder({
  //       reminderType: "soraLogin",
  //       onPrimaryAction: async () => {
  //         await invoke("open_sora_login_command");
  //         await waitForSoraLogin();
  //         toast.success("Logged in to Sora!");
  //         resolve();
  //       },
  //     });
  //   });
  // };

  const handleTauriEnqueue = async () => {
    if (!prompt.trim()) return;

    // NB(bt): This needs to move to an error handler.
    // // Check if the Sora session is valid
    // const soraSession = await CheckSoraSession();
    // if (soraSession.state !== SoraSessionState.Valid) {
    //   setIsEnqueueing(false);
    //   await handleSoraLoginReminder();
    //   return;
    // }

    setIsEnqueueing(true);

    setTimeout(() => {
      // TODO(bt,2025-05-08): This is a hack so we don't accidentally wind up with a permanently disabled prompt box if
      // the backend hangs on a given request. (Sometimes Sora doesn't respond.) Ideally what we would do instead is only
      // force the prompt box to be enabled again as long as another request isn't running, ie. if we just fired off two
      // requests in succession, we wouldn't want to turn it off as the first one gets submitted.
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    setPrompt(prompt);

    const promptsApi = new PromptsApi();

    if (snapshotCurrentFrame) {
      const snapshot = snapshotCurrentFrame(false);

      if (snapshot) {
        const snapshotResult = await promptsApi.uploadSceneSnapshot({
          screenshot: snapshot.file,
          //sceneMediaToken: "",
        });

        console.log("snapshotResult", snapshotResult);

        const aspectRatio = getCurrentAspectRatio();

        const generateResponse = await EnqueueContextualEditImage({
          model: selectedImageModel,
          scene_image_media_token: snapshotResult.data!,
          image_media_tokens: referenceImages.map((image) => image.mediaToken),
          disable_system_prompt: !useSystemPrompt,
          prompt: prompt,
          image_count: 1,
          aspect_ratio: aspectRatio,
        });

        console.log("generateResponse", generateResponse);

        if (generateResponse.status === CommandSuccessStatus.Success) {
          setIsEnqueueing(false);
          return;
        } else {
          setIsEnqueueing(false);
          return;
        }
      }

      try {
        // Here we would pass both the prompt and reference images to the generation
        console.log(
          "(3D.1) Enqueuing with prompt:",
          prompt,
          "and reference images:",
          referenceImages
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setIsEnqueueing(false);
        toast.success("Image added to queue");
      }
    }

    setIsEnqueueing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  // Get the current aspect ratio icon based on the cameraAspectRatio signal
  const getCurrentAspectRatioIcon = () => {
    switch (cameraAspectRatio.value) {
      case CameraAspectRatio.HORIZONTAL_3_2:
        return faRectangle;
      case CameraAspectRatio.VERTICAL_2_3:
        return faRectangleVertical;
      case CameraAspectRatio.VERTICAL_9_16:
        return faRectangleVertical;
      case CameraAspectRatio.SQUARE_1_1:
        return faSquare;
      default:
        return faRectangleWide;
    }
  };

  const getCurrentAspectRatio = (): EnqueueContextualEditImageSize => {
    switch (cameraAspectRatio.value) {
      case CameraAspectRatio.HORIZONTAL_3_2:
        return EnqueueContextualEditImageSize.Wide;
      case CameraAspectRatio.VERTICAL_2_3:
      case CameraAspectRatio.VERTICAL_9_16:
        return EnqueueContextualEditImageSize.Tall;
      case CameraAspectRatio.SQUARE_1_1:
      default:
        return EnqueueContextualEditImageSize.Square;
    }
  };

  const handleSaveFrame = async () => {
    if (!snapshotCurrentFrame) {
      return;
    }

    const snapshot = snapshotCurrentFrame(false);
    if (snapshot) {
      const engineApi = new EngineApi();
      await engineApi.uploadSceneSnapshot({
        screenshot: snapshot.file || "",
        sceneMediaToken: "",
      });
    }
  };

  const handleDownloadFrame = () => {
    if (!snapshotCurrentFrame) {
      return;
    }
    snapshotCurrentFrame(true);
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setContent("");
        }}
      >
        {content}
      </Modal>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
        {selectedImageModel?.canUseImagePrompt && isImageRowVisible && (
          <ImagePromptRow
            visible={true}
            maxImagePromptCount={Math.max(
              1,
              selectedImageModel?.maxImagePromptCount ?? 1
            )}
            allowUpload={true}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            uploadImage={uploadImage as any}
            onImageClick={(image) => {
              setContent(
                <img
                  src={image.url}
                  alt="Reference preview"
                  className="w-full h-full object-contain"
                />
              );
              setIsModalOpen(true);
            }}
          />
        )}
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isPromptBoxFocused.value ? "!border !border-primary" : "",
            selectedImageModel?.canUseImagePrompt &&
              isImageRowVisible &&
              "rounded-t-none"
          )}
        >
          <div className="flex justify-center gap-2">
            {selectedImageModel?.canUseImagePrompt && (
              <Tooltip
                content="Add Image"
                position="top"
                closeOnClick={true}
                className={twMerge(isImageRowVisible && "hidden opacity-0")}
              >
                <Button
                  variant="action"
                  className={twMerge(
                    "h-8 w-8 p-0 bg-transparent hover:bg-transparent group transition-all border-0 shadow-none",
                    isImageRowVisible && "text-primary"
                  )}
                  onClick={() => setShowImagePrompts((prev) => !prev)}
                >
                  <svg
                    width="24"
                    height="20"
                    viewBox="0 0 24 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="group-hover:opacity-100 opacity-80 transition-all"
                  >
                    <path
                      opacity="1"
                      d="M2.66667 2H16C16.3667 2 16.6667 2.3 16.6667 2.66667V6.1125C17.1 6.04167 17.5458 6 18 6C18.225 6 18.4458 6.00833 18.6667 6.02917V2.66667C18.6667 1.19583 17.4708 0 16 0H2.66667C1.19583 0 0 1.19583 0 2.66667V16C0 17.4708 1.19583 18.6667 2.66667 18.6667H11.5C11.0625 18.0583 10.7083 17.3875 10.4542 16.6667H2.66667C2.3 16.6667 2 16.3667 2 16V2.66667C2 2.3 2.3 2 2.66667 2ZM11.8625 7.49167C11.6833 7.1875 11.3542 7 11 7C10.6458 7 10.3167 7.1875 10.1375 7.49167L8.2 10.7833L7.48333 9.75833C7.29583 9.49167 6.99167 9.33333 6.6625 9.33333C6.33333 9.33333 6.02917 9.49167 5.84167 9.75833L3.50833 13.0917C3.29583 13.3958 3.26667 13.7958 3.44167 14.125C3.61667 14.4542 3.9625 14.6667 4.33333 14.6667H10.0292C10.0125 14.4458 10 14.225 10 14C10 11.7833 10.9 9.77917 12.3542 8.33333L11.8625 7.49583V7.49167ZM5.33333 6.66667C6.07083 6.66667 6.66667 6.07083 6.66667 5.33333C6.66667 4.59583 6.07083 4 5.33333 4C4.59583 4 4 4.59583 4 5.33333C4 6.07083 4.59583 6.66667 5.33333 6.66667ZM18 20C21.3125 20 24 17.3125 24 14C24 10.6875 21.3125 8 18 8C14.6875 8 12 10.6875 12 14C12 17.3125 14.6875 20 18 20ZM18.6667 11.3333V13.3333H20.6667C21.0333 13.3333 21.3333 13.6333 21.3333 14C21.3333 14.3667 21.0333 14.6667 20.6667 14.6667H18.6667V16.6667C18.6667 17.0333 18.3667 17.3333 18 17.3333C17.6333 17.3333 17.3333 17.0333 17.3333 16.6667V14.6667H15.3333C14.9667 14.6667 14.6667 14.3667 14.6667 14C14.6667 13.6333 14.9667 13.3333 15.3333 13.3333H17.3333V11.3333C17.3333 10.9667 17.6333 10.6667 18 10.6667C18.3667 10.6667 18.6667 10.9667 18.6667 11.3333Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </Tooltip>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Describe your image..."
              className="text-md mb-2 max-h-[5.5em] min-h-[36px] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                disableHotkeyInput(DomLevels.INPUT);
                isPromptBoxFocused.value = true;
              }}
              onBlur={() => {
                enableHotkeyInput(DomLevels.INPUT);
                isPromptBoxFocused.value = false;
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tooltip
                content="Aspect ratio"
                position="top"
                className="z-50"
                closeOnClick={true}
              >
                <PopoverMenu
                  items={aspectRatioList}
                  onSelect={handleAspectRatioSelect}
                  mode="toggle"
                  panelTitle="Aspect Ratio"
                  showIconsInList
                  triggerIcon={
                    <FontAwesomeIcon
                      icon={getCurrentAspectRatioIcon()}
                      className="h-4 w-4"
                    />
                  }
                />
              </Tooltip>
              <Tooltip
                content="Camera"
                position="top"
                className="z-50"
                delay={300}
                closeOnClick={true}
              >
                <PopoverMenu
                  items={cameras.value.map((cam) => ({
                    id: cam.id,
                    label: cam.label,
                    selected: cam.id === selectedCameraId.value,
                    icon: (
                      <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                    ),
                    focalLength: cam.focalLength,
                    position: cam.position,
                    rotation: cam.rotation,
                    lookAt: cam.lookAt,
                  }))}
                  onSelect={handleCameraSelect}
                  onAdd={handleAddCamera}
                  triggerIcon={
                    <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                  }
                  showAddButton
                  disableAddButton={cameras.value.length >= 6}
                  showIconsInList
                  mode="toggle"
                  panelTitle="Camera"
                  panelActionLabel="Settings"
                  onPanelAction={() => setIsCameraSettingsOpen(true)}
                  buttonClassName="max-w-[130px] h-9"
                />
              </Tooltip>
              <Tooltip
                content={
                  useSystemPrompt
                    ? "Use system prompt: ON"
                    : "Use system prompt: OFF"
                }
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={useSystemPrompt}
                  icon={faMessageXmark}
                  activeIcon={faMessageCheck}
                  onClick={() => setUseSystemPrompt(!useSystemPrompt)}
                />
              </Tooltip>
              <Tooltip
                content={gridVisibility.value ? "Grid: ON" : "Grid: OFF"}
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={gridVisibility.value}
                  icon={faTableCellsLarge}
                  activeIcon={faTableCellsLarge}
                  onClick={() => setGridVisibility(!gridVisibility.value)}
                />
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip
                content="Download frame"
                position="top"
                className="z-50"
                closeOnClick={true}
                delay={200}
              >
                <Button
                  className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg backdrop-blur-lg hover:bg-ui-controls/90"
                  variant="secondary"
                  icon={faDownload}
                  onClick={handleDownloadFrame}
                />
              </Tooltip>

              <Button
                className="flex items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg backdrop-blur-lg hover:bg-ui-controls/90"
                variant="secondary"
                icon={faSave}
                onClick={handleSaveFrame}
              >
                Save frame
              </Button>
              <Button
                className="flex items-center border-none bg-brand-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={!isEnqueueing ? faSparkles : undefined}
                onClick={handleEnqueue}
                disabled={isEnqueueing || !prompt.trim()}
              >
                {isEnqueueing ? (
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="animate-spin text-lg"
                  />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>
        </div>
        <CameraSettingsModal
          isOpen={isCameraSettingsOpen}
          onClose={() => setIsCameraSettingsOpen(false)}
          cameras={cameras.value.map((cam) => ({
            id: cam.id,
            label: cam.label,
            selected: cam.id === selectedCameraId.value,
            icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
            focalLength: cam.focalLength,
            focalLengthDragging: focalLengthDragging,
            position: cam.position,
            rotation: cam.rotation,
            lookAt: cam.lookAt,
          }))}
          onCameraNameChange={handleCameraNameChange}
          onCameraFocalLengthChange={handleCameraFocalLengthChange}
          onAddCamera={handleAddCamera}
          selectedCameraId={selectedCameraId.value}
          handleCameraSelect={handleCameraSelect}
          onDeleteCamera={deleteCamera}
          disableHotkeyInput={disableHotkeyInput}
          enableHotkeyInput={enableHotkeyInput}
          focalLengthDragging={focalLengthDragging}
        />
      </div>
    </>
  );
};
