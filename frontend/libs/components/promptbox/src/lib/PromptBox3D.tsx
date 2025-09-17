import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { downloadFileFromUrl } from "@storyteller/api";
import {
  faPlus,
  faCamera,
  faSave,
  faSparkles,
  faUpload,
  faImages,
  faDownload,
  faSpinnerThird,
  faTimes,
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
  UploaderStates,
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
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
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
import { usePrompt3DStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { ImageModel } from "@storyteller/model-list";

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
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
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
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const uploadId = Math.random().toString(36).substring(7);
        setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

        const reader = new FileReader();
        reader.onloadend = () => {
          uploadImage({
            title: `reference-image-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              console.debug("Upload progress:", newState.data);
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: RefImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data || "",
                };
                setReferenceImages([...referenceImages, referenceImage]);
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId)
                );
                console.log("Reference image added:", referenceImage);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId)
                );
                console.error("Upload failed");
              }
            },
          });
        };

        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGallerySelect = () => setIsGalleryModalOpen(true);
  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    const newRefs = [...referenceImages];
    selectedItems.forEach((item) => {
      if (!item.fullImage) return;
      newRefs.push({
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "gallery-image"),
        mediaToken: item.id,
      });
    });
    setReferenceImages(newRefs);
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        handleUploadClick();
        break;
      case "gallery":
        handleGallerySelect();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

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
        {(referenceImages.length > 0 || uploadingImages.length > 0) && (
          <div className="flex w-full gap-2">
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="glass relative aspect-square w-20 rounded-lg"
              >
                <img
                  src={image.url}
                  alt="Reference"
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => handleRemoveReference(image.id)}
                  className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {uploadingImages.map(({ id, file }) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={id}
                  className="glass relative aspect-square w-20 overflow-hidden rounded-lg"
                >
                  <div className="absolute inset-0">
                    <img
                      src={previewUrl}
                      alt="Uploading preview"
                      className="h-full w-full object-cover blur-sm"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <FontAwesomeIcon
                      icon={faSpinnerThird}
                      className="h-6 w-6 animate-spin text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isPromptBoxFocused.value ? "!border !border-primary" : ""
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            multiple
          />
          <div className="flex justify-center gap-2">
            <PopoverMenu
              mode="button"
              panelTitle="Add Image"
              items={[
                {
                  label: "Upload from device",
                  selected: false,
                  icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
                  action: "upload",
                },
                {
                  label: "Choose from library",
                  selected: false,
                  icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
                  action: "gallery",
                },
              ]}
              onPanelAction={handleAction}
              showIconsInList
              buttonClassName="bg-transparent hover:bg-transparent py-1.5 px-0 pr-1 m-0 hover:opacity-50 transition-opacity duration-100 ring-0 border-none focus:ring-0 outline-none"
              triggerIcon={
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              }
            />

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
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={4}
        onUseSelected={handleGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
