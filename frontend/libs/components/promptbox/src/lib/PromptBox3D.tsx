import { useState, useRef, useEffect, type ReactNode } from "react";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import {
  faCamera,
  faSave,
  faDownload,
  faExpand,
  faChevronDown,
  faChevronUp,
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
import { Button, ToggleButton, GenerateButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  CameraAspectRatio,
  DomLevels,
  Camera,
  FocalLengthDragging,
  UploadImageArgs,
} from "@storyteller/common";
import { OmniGenApi, PromptsApi } from "@storyteller/api";
import type { OmniGenImageRequest } from "@storyteller/api";
// import { SoundRegistry } from "@storyteller/soundboard";
import { toast } from "@storyteller/ui-toaster";
import { EngineApi } from "@storyteller/api";
import { CameraSettingsModal } from "@storyteller/ui-camera-settings-modal";
import { twMerge } from "tailwind-merge";
import { Modal } from "@storyteller/ui-modal";
import {
  CommandSuccessStatus,
  GenerateImage,
  GenerateImageRequest,
} from "@storyteller/tauri-api";
import { usePrompt3DStore, useEnterToGenerateStore } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { CommonAspectRatio, CommonResolution, ImageModel } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { ImagePromptRow } from "./ImagePromptRow";
import { AspectRatioPicker } from "./common/AspectRatioPicker";

interface PromptBox3DProps {
  cameras: Camera[];
  cameraAspectRatio: CameraAspectRatio;
  disableHotkeyInput: (level: number) => void;
  enableHotkeyInput: (level: number) => void;
  gridVisibility: boolean;
  setGridVisibility: (isVisible: boolean) => void;
  selectedCameraId: string;
  deleteCamera: (id: string) => void;
  focalLengthDragging: FocalLengthDragging;
  setFocalLengthDragging: (state: FocalLengthDragging) => void;
  isPromptBoxFocused: boolean;
  setIsPromptBoxFocused: (focused: boolean) => void;
  uploadImage: (arg: UploadImageArgs) => Promise<void>;
  handleCameraSelect: (item: PopoverItem) => void;
  handleAddCamera: () => void;
  handleCameraNameChange: (id: string, newName: string) => void;
  handleCameraFocalLengthChange: (id: string, value: number) => void;
  onAspectRatioSelect: (newRatio: CameraAspectRatio) => void;
  setEnginePrompt: (prompt: string) => void;
  selectedImageModel?: ImageModel;
  selectedProvider?: GenerationProvider;
  snapshotCurrentFrame:
  | ((shouldDownload?: boolean) => {
    base64Snapshot: string;
    file: File;
  } | null)
  | undefined;
  credits?: number | null;
  /** Optional model-picker slot rendered at the start of the toolbar
   *  (left of the aspect-ratio picker). Tauri leaves this unset and
   *  renders ClassyModelSelector outside the prompt box; the webapp
   *  passes a compact selector here so the chrome matches its other
   *  prompt boxes. */
  modelSelector?: ReactNode;
  // Optional pre-submit gate. Returns false to abort the generation
  // (e.g. host wants to open a signup modal for anon visitors).
  onBeforeSubmit?: () => boolean;
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
  setFocalLengthDragging,
  isPromptBoxFocused,
  setIsPromptBoxFocused,
  uploadImage,
  handleCameraSelect,
  handleAddCamera,
  handleCameraNameChange,
  handleCameraFocalLengthChange,
  onAspectRatioSelect,
  setEnginePrompt,
  selectedImageModel,
  selectedProvider,
  snapshotCurrentFrame,
  credits,
  modelSelector,
  onBeforeSubmit,
}: PromptBox3DProps) => {
  //const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prompt = usePrompt3DStore((s) => s.prompt);
  const setPrompt = usePrompt3DStore((s) => s.setPrompt);
  const useSystemPrompt = usePrompt3DStore((s) => s.useSystemPrompt);
  const resolution = usePrompt3DStore((s) => s.resolution);
  const setResolution = usePrompt3DStore((s) => s.setResolution);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (textareaRef.current) {
        textareaRef.current.style.height = next ? "300px" : "auto";
      }
      return next;
    });
  };
  const referenceImages = usePrompt3DStore((s) => s.referenceImages);
  const setReferenceImages = usePrompt3DStore((s) => s.setReferenceImages);
  const enterToGenerate = useEnterToGenerateStore((s) => s.enabled);
  const [showImagePrompts, setShowImagePrompts] = useState(false);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "Wide",
      selected: true,
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "Tall",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "Square",
      selected: false,
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
  ]);
  const [resolutionList, setResolutionList] = useState<PopoverItem[]>([
    {
      label: "1K",
      selected: resolution === "1k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
    {
      label: "2K",
      selected: resolution === "2k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
    {
      label: "4K",
      selected: resolution === "4k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
  ]);
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
  const isImageRowVisible =
    showImagePrompts ||
    (selectedImageModel?.canUseImagePrompt && referenceImages.length > 0) ||
    false;

  // New aspect ratio state will begin to phase out old aspect ratio
  const [commonAspectRatio, setCommonAspectRatio] = useState<
    CommonAspectRatio | undefined
  >(undefined);

  // Drives both the API request payload (commonAspectRatio) and the 3D
  // editor letterbox in one shot. Auto* ratios have no fixed shape, so
  // they leave the letterbox alone.
  const handleCommonAspectRatioSelect = (ratio: CommonAspectRatio) => {
    setCommonAspectRatio(ratio);
    const mapped = commonToCameraAspect(ratio);
    if (mapped) onAspectRatioSelect(mapped);
  };

  useEffect(() => {
    if (textareaRef.current && !isExpanded) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    setResolutionList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label.toLowerCase() === resolution,
      })),
    );
  }, [resolution]);

  // Update aspect ratio list based on the current cameraAspectRatio
  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected:
          (item.label === "Wide" &&
            cameraAspectRatio === CameraAspectRatio.HORIZONTAL_3_2) ||
          (item.label === "Tall" &&
            cameraAspectRatio === CameraAspectRatio.VERTICAL_2_3) ||
          (item.label === "Square" &&
            cameraAspectRatio === CameraAspectRatio.SQUARE_1_1),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAspectRatio]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );

    // Map the selected label to the corresponding CameraAspectRatio enum value
    let newRatio: CameraAspectRatio;
    switch (selectedItem.label.toLowerCase()) {
      case "wide":
        newRatio = CameraAspectRatio.HORIZONTAL_3_2;
        break;
      case "tall":
        newRatio = CameraAspectRatio.VERTICAL_2_3;
        break;
      case "square":
        newRatio = CameraAspectRatio.SQUARE_1_1;
        break;
      default:
        newRatio = CameraAspectRatio.HORIZONTAL_3_2;
    }

    onAspectRatioSelect(newRatio);
  };

  const handleResolutionSelect = (selectedItem: PopoverItem) => {
    setResolution(selectedItem.label.toLowerCase() as any);
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
      const pos = Math.min(selectionStart + pastedText.length, next.length);
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

  const maxLen = selectedImageModel?.maxPromptLength ?? 1000;

  const handleEnqueue = async () => {
    if (onBeforeSubmit && !onBeforeSubmit()) {
      return;
    }
    if (isFinite(maxLen) && prompt.length > maxLen) {
      toast.error(`Prompt exceeds the ${maxLen} character limit for this model`);
      return;
    }
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

    // OmniGen's request shape requires a model id. The Tauri path can
    // fall back on `tauriId`, but the web path goes straight to the
    // omni-gen backend which keys off the canonical `model` / `id`
    // string. Bail loudly if nothing is selected.
    if (!selectedImageModel?.id) {
      handleError("No model selected");
      return;
    }

    setIsEnqueueing(true);
    setEnginePrompt(prompt);

    try {
      // Snapshot upload still goes through the legacy /v1/image_studio/
      // scene_snapshot endpoint — that's the one image_studio route the
      // Rust backend keeps registered, and it returns the media token we
      // pass through to OmniGen as the canvas image.
      let snapshotToken: string | undefined;
      if (snapshotCurrentFrame) {
        const snapshot = snapshotCurrentFrame(false);
        if (snapshot) {
          const snapshotResult = await new PromptsApi().uploadSceneSnapshot({
            screenshot: snapshot.file,
            sceneMediaToken: "",
          });
          if (!snapshotResult.success || !snapshotResult.data) {
            handleError(
              snapshotResult.errorMessage || "Failed to upload scene snapshot",
            );
            return;
          }
          snapshotToken = snapshotResult.data;
        }
      }

      const referenceTokens = referenceImages
        .map((image) => image.mediaToken)
        .filter((t): t is string => !!t && t.length > 0);
      const imageMediaTokens = [
        ...(snapshotToken ? [snapshotToken] : []),
        ...referenceTokens,
      ];

      const aspectRatio =
        selectedImageModel.supportsNewAspectRatio() && commonAspectRatio
          ? commonAspectRatio
          : getCurrentAspectRatio();

      const request: OmniGenImageRequest = {
        model: selectedImageModel.id,
        prompt: prompt,
        idempotency_token: crypto.randomUUID(),
        aspect_ratio: aspectRatio ?? null,
        resolution: getCurrentResolution() ?? null,
        image_batch_count: 1,
        image_media_tokens:
          imageMediaTokens.length > 0 ? imageMediaTokens : null,
      };

      const response = await new OmniGenApi().generateImage(request);
      if (!response.success || !response.inference_job_token) {
        handleError("Generation failed");
        return;
      }

      window.__storeTaskEnqueueMeta?.({
        prompt,
        refImageUrls: referenceImages
          ?.map((image) => image.url)
          .filter(Boolean),
        modelType: selectedImageModel.id,
        timestamp: Date.now(),
      });

      toast.success("Image added to queue");
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : "Generation request failed",
      );
    } finally {
      setIsEnqueueing(false);
    }
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

        const aspectRatio =
          selectedImageModel?.supportsNewAspectRatio() && commonAspectRatio
            ? commonAspectRatio
            : getCurrentAspectRatio();

        const request: GenerateImageRequest = {
          model: selectedImageModel,
          scene_image_media_token: snapshotResult.data!,
          image_media_tokens: referenceImages.map((image) => image.mediaToken),
          enable_system_prompt: useSystemPrompt,
          prompt: prompt,
          batch_size: 1,
          aspect_ratio: aspectRatio,
          resolution: getCurrentResolution(),
        };

        if (!!selectedProvider) {
          request.provider = selectedProvider;
        }

        window.__storeTaskEnqueueMeta?.({
          prompt,
          refImageUrls: referenceImages
            ?.map((image) => image.url)
            .filter(Boolean),
          modelType:
            (selectedImageModel as any)?.tauriId ||
            String(selectedImageModel),
          timestamp: Date.now(),
        });

        const generateResponse = await GenerateImage(request);

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
          referenceImages,
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

    if (e.key !== "Enter") return;
    const isSubmitCombo = enterToGenerate && !e.shiftKey;
    if (isSubmitCombo) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  const getCurrentAspectRatioIcon = () => {
    switch (cameraAspectRatio) {
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

  const getCurrentAspectRatio = (): CommonAspectRatio => {
    switch (cameraAspectRatio.value) {
      case CameraAspectRatio.HORIZONTAL_3_2:
        return CommonAspectRatio.Wide;
      case CameraAspectRatio.VERTICAL_2_3:
      case CameraAspectRatio.VERTICAL_9_16:
        return CommonAspectRatio.Tall;
      case CameraAspectRatio.SQUARE_1_1:
      default:
        return CommonAspectRatio.Square;
    }
  };

  const getCurrentResolution = (): CommonResolution | undefined => {
    const selected = resolutionList.find((item) => item.selected);
    switch (selected?.label) {
      case "1k":
        return CommonResolution.OneK;
      case "2k":
        return CommonResolution.TwoK;
      case "4k":
        return CommonResolution.FourK;
      default:
        return undefined;
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
              selectedImageModel?.maxImagePromptCount ?? 1,
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
                />,
              );
              setIsModalOpen(true);
            }}
          />
        )}
        <div
          className={twMerge(
            "glass relative w-[860px] rounded-xl p-4",
            isPromptBoxFocused ? "!border !border-primary" : "",
            selectedImageModel?.canUseImagePrompt &&
            isImageRowVisible &&
            "rounded-t-none",
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
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
                    isImageRowVisible && "text-primary",
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

            <div className="promptbox-resize-wrap relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Describe your image..."
                className={`promptbox-scrollbar text-md mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none ${isExpanded ? "max-h-[300px]" : "max-h-[5.5em]"}`}
                value={prompt}
                onChange={handleChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  disableHotkeyInput(DomLevels.INPUT);
                  setIsPromptBoxFocused(true);
                }}
                onBlur={() => {
                  enableHotkeyInput(DomLevels.INPUT);
                  setIsPromptBoxFocused(false);
                }}
              />
              <span className={`absolute -bottom-1 right-0 text-[10px] tabular-nums ${isFinite(maxLen) && prompt.length > maxLen ? "text-red-500" : "text-base-fg/40"}`}>
                {prompt.length} / {isFinite(maxLen) ? maxLen : "∞"}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {modelSelector}
              {selectedImageModel?.supportsNewAspectRatio() && (
                <AspectRatioPicker
                  model={selectedImageModel}
                  currentAspectRatio={commonAspectRatio}
                  handleCommonAspectRatioSelect={handleCommonAspectRatioSelect}
                />
              )}
              {selectedImageModel?.canChangeAspectRatio &&
                !selectedImageModel?.supportsNewAspectRatio() && (
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
                )}
              {selectedImageModel?.canChangeResolution && (
                <Tooltip
                  content="Resolution"
                  position="top"
                  className="z-50"
                  closeOnClick={true}
                >
                  <PopoverMenu
                    items={resolutionList}
                    onSelect={handleResolutionSelect}
                    mode="toggle"
                    panelTitle="Resolution"
                    showIconsInList
                    triggerIcon={
                      <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
                    }
                  />
                </Tooltip>
              )}
              <Tooltip
                content="Camera"
                position="top"
                className="z-50"
                delay={300}
                closeOnClick={true}
              >
                <PopoverMenu
                  items={cameras.map((cam) => ({
                    id: cam.id,
                    label: cam.label,
                    selected: cam.id === selectedCameraId,
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
                  disableAddButton={cameras.length >= 6}
                  showIconsInList
                  mode="toggle"
                  panelTitle="Camera"
                  panelActionLabel="Settings"
                  onPanelAction={() => setIsCameraSettingsOpen(true)}
                  buttonClassName="max-w-[130px] h-9"
                />
              </Tooltip>
              <Tooltip
                content={gridVisibility ? "Grid: ON" : "Grid: OFF"}
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={gridVisibility}
                  icon={faTableCellsLarge}
                  activeIcon={faTableCellsLarge}
                  onClick={() => setGridVisibility(!gridVisibility)}
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
              <GenerateButton
                className="flex items-center border-none bg-brand-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={undefined}
                onClick={handleEnqueue}
                disabled={isEnqueueing || !prompt.trim()}
                loading={isEnqueueing}
                credits={credits}
              >
                Generate
              </GenerateButton>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Tooltip content={isExpanded ? "Collapse" : "Expand"} position="top" className="-mb-2">
              <button
                type="button"
                onClick={toggleExpand}
                className="text-base-fg/30 hover:text-base-fg/90 transition-colors px-3 py-0.5"
              >
                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-xs" />
              </button>
            </Tooltip>
          </div>
        </div>
        <CameraSettingsModal
          isOpen={isCameraSettingsOpen}
          onClose={() => setIsCameraSettingsOpen(false)}
          cameras={cameras.map((cam) => ({
            id: cam.id,
            label: cam.label,
            selected: cam.id === selectedCameraId,
            icon: <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />,
            focalLength: cam.focalLength,
            position: cam.position,
            rotation: cam.rotation,
            lookAt: cam.lookAt,
          }))}
          onCameraNameChange={handleCameraNameChange}
          onCameraFocalLengthChange={handleCameraFocalLengthChange}
          onAddCamera={handleAddCamera}
          selectedCameraId={selectedCameraId}
          handleCameraSelect={handleCameraSelect}
          onDeleteCamera={deleteCamera}
          disableHotkeyInput={disableHotkeyInput}
          enableHotkeyInput={enableHotkeyInput}
          setFocalLengthDragging={setFocalLengthDragging}
        />
      </div>
    </>
  );
};

// Map a CommonAspectRatio (the 2D/API-side enum) to the closest
// CameraAspectRatio variant the 3D editor's letterbox supports.
// Returns undefined for Auto* values, which have no fixed shape.
// Exported so PageEditor can sync the editor letterbox to a model's
// default on first load (where the picker fallback applies).
export const commonToCameraAspect = (
  ratio: CommonAspectRatio,
): CameraAspectRatio | undefined => {
  switch (ratio) {
    case CommonAspectRatio.Square:
    case CommonAspectRatio.SquareHd:
      return CameraAspectRatio.SQUARE_1_1;
    case CommonAspectRatio.WideSixteenByNine:
    case CommonAspectRatio.WideTwentyOneByNine:
      return CameraAspectRatio.HORIZONTAL_16_9;
    case CommonAspectRatio.WideThreeByTwo:
    case CommonAspectRatio.WideFourByThree:
    case CommonAspectRatio.WideFiveByFour:
    case CommonAspectRatio.Wide:
      return CameraAspectRatio.HORIZONTAL_3_2;
    case CommonAspectRatio.TallNineBySixteen:
    case CommonAspectRatio.TallNineByTwentyOne:
      return CameraAspectRatio.VERTICAL_9_16;
    case CommonAspectRatio.TallTwoByThree:
    case CommonAspectRatio.TallThreeByFour:
    case CommonAspectRatio.TallFourByFive:
    case CommonAspectRatio.Tall:
      return CameraAspectRatio.VERTICAL_2_3;
    case CommonAspectRatio.Auto:
    case CommonAspectRatio.Auto2k:
    case CommonAspectRatio.Auto3k:
    case CommonAspectRatio.Auto4k:
      return undefined;
  }
};
